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
import { OpenKitImpl } from '../impl/OpenKitImpl';
import { SessionImpl } from '../impl/SessionImpl';
import { StatusRequestImpl } from '../impl/StatusRequestImpl';
import { Payload } from '../payload/Payload';
import { PayloadBuilder } from '../payload/PayloadBuilder';
import { defaultServerId } from '../PlatformConstants';
import { defaultTimestampProvider } from '../provider/TimestampProvider';
import { CommunicationState } from './CommunicationState';
import { BeaconCacheImpl, CacheEntry } from './strategies/BeaconCache';
import { SendingStrategy } from './strategies/SendingStrategy';

export class BeaconSender {
    private readonly channel: CommunicationChannel;

    private okSessionId: number = defaultServerId;
    private readonly cache = new BeaconCacheImpl();

    private isShutdown = false;
    private initialized = false;
    private flushing = false;

    constructor(
        private readonly openKit: OpenKitImpl,
        private readonly config: OpenKitConfiguration,
        private readonly sendingStrategies: SendingStrategy[],
    ) {
        this.channel = config.communicationChannel;
    }

    public async init(): Promise<void> {
        const response =
            await this.channel.sendStatusRequest(
                this.config.beaconURL, StatusRequestImpl.create(this.config.applicationId, this.okSessionId));

        if (response.valid) {
            this.initialized = true;
            this.okSessionId = response.serverId || defaultServerId;

            this.cache.getEntries().forEach((entry) => entry.communicationState.setServerId(this.okSessionId));

            this.sendingStrategies.forEach((strategy) => strategy.init(this, this.cache));
        }

        this.openKit.notifyInitialized(response.valid);
    }

    public addSession(session: SessionImpl, prefix: string, payloadBuilder: PayloadBuilder, state: CommunicationState): void {
        state.setServerId(this.okSessionId);

        const entry = this.cache.register(session, prefix, payloadBuilder, state);

        this.sendingStrategies.forEach((strategies) => strategies.entryAdded(entry));
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public async shutdown(): Promise<void> {
        if (!this.isInitialized() || this.isShutdown) {
            return;
        }
        this.isShutdown = true;

        // Close all sessions
        this.cache.getEntries().forEach((entry) => entry.session.end());

        for (const strategy of this.sendingStrategies) {
            await strategy.shutdown();
        }

        this.cache.clear();
    }

    public async flush(): Promise<void> {
        if (this.flushing) {
            return;
        }
        this.flushing = true;

        if (this.initialized) {
            await this.sendNewSessionRequests();
            await this.finishSessions();
            await this.sendPayloadData();
        }

        this.flushing = false;
    }

    private async sendNewSessionRequests(): Promise<void> {
        const newSessions = this.cache.getAllUninitializedSessions();

        for (const session of newSessions) {
            await this.sendNewSessionRequest(session);
        }
    }

    private async sendNewSessionRequest(session: CacheEntry): Promise<void> {
        const response = await this.channel.sendNewSessionRequest(
            this.config.beaconURL, StatusRequestImpl.create(this.config.applicationId, session.communicationState.serverId),
        );

        if (response.valid) {
            session.communicationState.updateFromResponse(response);
            session.communicationState.setServerIdLocked();
            session.initialized = true;
        }
    }

    private async finishSessions(): Promise<void> {
        const sessionsToFinish = this.cache.getAllClosedSessions();

        for (const session of sessionsToFinish) {
            await this.sendPayload(session);

            this.cache.unregister(session);
        }
    }

    private async sendPayloadData(): Promise<void> {
        const openSessions = this.cache.getAllInitializedSessions();

        for (const session of openSessions) {
            await this.sendPayload(session);
        }
    }

    private async sendPayload(session: CacheEntry): Promise<void> {
        let payload: Payload | undefined;
        // tslint:disable-next-line
        while (payload = session.builder.getNextPayload(session.prefix, defaultTimestampProvider.getCurrentTimestamp())) {
            const request = StatusRequestImpl.create(this.config.applicationId, session.communicationState.serverId);

            await this.channel.sendPayloadData(this.config.beaconURL, request, payload);
        }
    }
}
