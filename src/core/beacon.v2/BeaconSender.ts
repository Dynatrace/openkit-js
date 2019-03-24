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

import { CommunicationChannel } from '../../api';
import { OpenKitConfiguration } from '../config/Configuration';
import { SessionImpl } from '../impl/SessionImpl';
import { StatusRequestImpl } from '../impl/StatusRequestImpl';
import { Payload } from '../payload.v2/Payload';
import { PayloadBuilder } from '../payload.v2/PayloadBuilder';
import { defaultTimestampProvider } from '../provider/TimestampProvider';
import { removeElement, timeout } from '../utils/Utils';
import { CommunicationState } from './CommunicationState';

const DEFAULT_SERVER_ID = 1;

export interface SessionInformation {
    session: SessionImpl;
    initialized: boolean;
    prefix: string;
    props: CommunicationState;
    builder: PayloadBuilder;
}
export class BeaconSender {
    private readonly channel: CommunicationChannel;

    private sessions: SessionInformation[] = [];
    private okSessionId: number = DEFAULT_SERVER_ID;

    private isShutdown = false;

    constructor(private readonly config: OpenKitConfiguration) {
        this.channel = config.communicationChannel;
    }

    public async init(): Promise<void> {
        const response =
            await this.channel.sendStatusRequest(
                this.config.beaconURL, StatusRequestImpl.create(this.config.applicationId, this.okSessionId));

        if (response.valid) {
            this.okSessionId = response.serverId || DEFAULT_SERVER_ID;

            this.sessions.forEach((s) => s.props.setServerId(this.okSessionId));

            this.loop();
        }
    }

    public addSession(session: SessionImpl, prefix: string, payloadBuilder: PayloadBuilder, state: CommunicationState): void {
        state.setServerId(this.okSessionId);

        this.sessions.push({
            session,
            initialized: false,
            prefix,
            props: state,
            builder: payloadBuilder,
        });
    }

    public async shutdown(): Promise<void> {
        this.isShutdown = true;

        // immediately close all sessions to set the end timestamp
        this.sessions.forEach((session) => session.session.end());

        const sessions = this.sessions.splice(0);

        // Now send all data immediately
        for (const session of sessions) {
            await this.sendPayload(session);
        }

        this.sessions.splice(0);
    }

    private async loop(): Promise<void> {
        while (!this.isShutdown) {
            await this.sendNewSessionRequests();
            await this.finishSessions();
            await this.sendPayloadData();

            await timeout(1000);
        }
    }

    private async sendNewSessionRequests(): Promise<void> {
        const newSessions = this.sessions.filter((session) => session.initialized === false);

        for (const session of newSessions) {
            await this.sendNewSessionRequest(session);
        }

    }

    private async sendNewSessionRequest(session: SessionInformation): Promise<void> {
        const response = await this.channel.sendNewSessionRequest(
            this.config.beaconURL, StatusRequestImpl.create(this.config.applicationId, session.props.serverId));

        if (response.valid) {
            session.props.updateFromResponse(response);
            session.props.setServerIdLocked();
            session.initialized = true;
        }
    }

    private async finishSessions(): Promise<void> {
        const sessionsToFinish = this.sessions
            .filter((session) => session.initialized && session.session.isShutdown());

        for (const session of sessionsToFinish) {
            await this.sendPayload(session);

            removeElement(this.sessions, session);
        }
    }

    private async sendPayloadData(): Promise<void> {
        const openSessions = this.sessions.filter((session) => session.initialized);

        for (const session of openSessions) {
            await this.sendPayload(session);
        }
    }

    private async sendPayload(session: SessionInformation): Promise<void> {
        let payload: Payload | undefined;
        // tslint:disable-next-line
        while (payload = session.builder.getNextPayload(session.prefix, defaultTimestampProvider.getCurrentTimestamp())) {
            const request = StatusRequestImpl.create(this.config.applicationId, session.props.serverId);

            await this.channel.sendPayloadData(this.config.beaconURL, request, payload);
        }
    }
}
