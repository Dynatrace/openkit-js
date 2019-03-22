/*
 * Copyright 2019 Dynatrace LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CaptureMode, CommunicationChannel } from '../../api';
import { Configuration } from '../config/Configuration';
import { SessionCommunicationProperties } from '../impl/OpenKitImpl';
import { SessionImpl } from '../impl/SessionImpl';
import { StatusRequestImpl } from '../impl/StatusRequestImpl';
import { Payload } from '../payload.v2/Payload';
import { PayloadBuilder } from '../payload.v2/PayloadBuilder';
import { defaultTimestampProvider } from '../provider/TimestampProvider';
import { removeElement, timeout } from '../utils/Utils';

const DEFAULT_SERVER_ID = 1;

export interface SessionInformation {
    session: SessionImpl;
    initialized: boolean;
    prefix: string;
    props: SessionCommunicationProperties;
    builder: PayloadBuilder;
}
// tslint:disable
export class BeaconSender {
    private sessions: SessionInformation[] = [];
    private okSessionId: number = DEFAULT_SERVER_ID;

    private isShutdown = false;

    constructor(
        private channel: CommunicationChannel,
        private config: Configuration) {
    }

    public async init(): Promise<void> {
        const response =
            await this.channel.sendStatusRequest(this.config.beaconURL, StatusRequestImpl.create(this.config.applicationId, this.okSessionId));

        if (response.valid) {
            this.okSessionId = response.serverId || DEFAULT_SERVER_ID;

            this.loop();
        }
    }

    private async loop() {
        while (!this.isShutdown) {
            console.warn("loop");

            await this.sendNewSessionRequests();
            await this.finishSessions();
            await this.sendPayloadData();

            await timeout(1000);
        }
    }

    public addSession(session: SessionImpl, prefix: string, payloadBuilder: PayloadBuilder, sessionProperties: SessionCommunicationProperties): void {
        sessionProperties.serverId = this.okSessionId;

        this.sessions.push({
            session,
            initialized: false,
            prefix,
            props: sessionProperties,
            builder: payloadBuilder,
        });
    }


    private async sendNewSessionRequests() {
        const newSessions = this.sessions.filter((session) => session.initialized === false);

        for (const session of newSessions) {
            await this.sendNewSessionRequest(session);
        }

    }

    private async sendNewSessionRequest(session: SessionInformation) {
        const response = await this.channel.sendNewSessionRequest(this.config.beaconURL, StatusRequestImpl.create(this.config.applicationId, session.props.serverId));

        if (response.valid) {
            session.initialized = true;
            session.props.serverId = response.serverId || session.props.serverId;
            session.props.isCaptureEnabled = response.captureMode === CaptureMode.Off;
        }
    }

    private async finishSessions() {
        const sessionsToFinish = this.sessions
            .filter(session => session.initialized && session.session.isShutdown());

        for (const session of sessionsToFinish) {
            await this.sendPayload(session);

            removeElement(this.sessions, session);
        }
    }

    private async sendPayloadData() {
        const openSessions = this.sessions.filter(session => session.initialized);

        for (const session of openSessions) {
            await this.sendPayload(session);
        }
    }

    private async sendPayload(session: SessionInformation) {
        let payload: Payload | undefined;
        // noinspection JSAssignmentUsedAsCondition
        while (payload = session.builder.getNextPayload(session.prefix, defaultTimestampProvider.getCurrentTimestamp())) {
            const request = StatusRequestImpl.create(this.config.applicationId, session.props.serverId);

            await this.channel.sendPayloadData(this.config.beaconURL, request, payload);
        }
    }

    public async shutdown() {
        this.isShutdown = true;

        // immediately close all sessions to set the end timestamp
        this.sessions.forEach(session => session.session.end());

        const sessions = this.sessions.splice(0);

        // Now send all data immediately
        for (const session of sessions) {
            await this.sendPayload(session);
        }

        this.sessions.splice(0);
    }
}
