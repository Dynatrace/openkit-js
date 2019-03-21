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
import { Status } from '../impl/OpenKitObject';
import { SessionImpl } from '../impl/SessionImpl';
import { StatusRequestImpl } from '../impl/StatusRequestImpl';
import { removeElement, timeout } from '../utils/Utils';

const DEFAULT_SERVER_ID = 1;

export interface SessionInformation {
    session: SessionImpl;
    initialized: boolean;
    serverId: number;
}
// tslint:disable
export class BeaconSender {
    private sessions: SessionInformation[] = [];
    private okSessionId: number = DEFAULT_SERVER_ID;

    constructor(
        private channel: CommunicationChannel,
        private config: OpenKitConfiguration) {
    }

    public async init(): Promise<void> {
        const response =
            await this.channel.sendStatusRequest(this.config.beaconURL, StatusRequestImpl.create(this.config.applicationId, this.okSessionId));

        if (response.valid) {
            this.okSessionId = response.serverId || DEFAULT_SERVER_ID;

            this.loop();
        }
    }

    private async loop () {
        while(true) {
            console.warn("wup")

            await this.sendNewSessionRequests();
            await this.finishSessions();
            await this.sendPayloadDatas();

            await timeout(1000);
        }
    }

    public addSession(session: SessionImpl): void {
        this.sessions.push({
            session,
            initialized: false,
            serverId: 1,
        });
    }


    private async sendNewSessionRequests() {
        const newSessions = this.sessions.filter((session) => session.initialized === false);

        for(const session of newSessions) {
            await this.sendNewSessionRequest(session);
        }

    }

    private async sendNewSessionRequest(session: SessionInformation) {
        const response = await this.channel.sendNewSessionRequest(this.config.beaconURL, StatusRequestImpl.create(this.config.applicationId, session.serverId));

        if(response.valid) {
            session.initialized = true;
            session.serverId = response.serverId || session.serverId;
        }
    }

    private async finishSessions() {
        const sessionsToFinish = this.sessions
            .filter(session => session.initialized && session.session.status === Status.Shutdown);

        for(const session of sessionsToFinish) {
            await this.sendPayload(session);

            removeElement(this.sessions, session);
        }
    }

    private async sendPayloadDatas() {
        const openSessions = this.sessions.filter(session => session.initialized);

        for(const session of openSessions) {
            await this.sendPayload(session);
        }
    }

    private async sendPayload(session: SessionInformation) {
        const pl = session.session.payloadData;

        let x: string | undefined;
        while(x = pl.getNextPayload()) {
            await this.channel.sendPayloadData(this.config.beaconURL, StatusRequestImpl.create(this.config.applicationId, session.serverId), x);
        }
    }

    public async shutdown() {
        // immediately close all sessions to set the end timestamp
        this.sessions.forEach(session => session.session.end());

        const sessions = this.sessions.splice(0);

        // Now send all data immediately
        for(const session of sessions) {
            await this.sendPayload(session);
        }

        this.sessions.splice(0);
    }
}
