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
    private readonly appId: string;
    private readonly beaconUrl: string;
    private readonly sendingStrategies: SendingStrategy[];
    private readonly channel: CommunicationChannel;

    private readonly timestampProvider = defaultTimestampProvider;

    private okServerId: number = defaultServerId;

    private isShutdown = false;
    private initialized = false;
    private flushing = false;

    constructor(
        private readonly openKit: OpenKitImpl,
        private readonly cache: BeaconCacheImpl,
        config: OpenKitConfiguration,
    ) {
        this.appId = config.applicationId;
        this.beaconUrl = config.beaconURL;
        this.channel = config.communicationChannel;
        this.sendingStrategies = config.sendingStrategies;
    }

    public async init(): Promise<void> {
        const response =
            await this.channel.sendStatusRequest(this.beaconUrl, StatusRequestImpl.create(this.appId, this.okServerId));

        if (response.valid) {
            this.initialized = true;
            this.okServerId = response.serverId || defaultServerId;

            this.cache.getEntries().forEach((entry) => entry.communicationState.setServerId(this.okServerId));

            this.sendingStrategies.forEach((strategy) => strategy.init(this, this.cache));
        }

        this.openKit.notifyInitialized(response.valid);
    }

    public sessionAdded(entry: CacheEntry): void {
        entry.communicationState.setServerId(this.okServerId);

        this.sendingStrategies.forEach((strategy) => strategy.entryAdded(entry));
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public async shutdown(): Promise<void> {
        if (this.isShutdown) {
            return;
        }
        this.isShutdown = true;

        // Close all sessions
        this.cache.getEntries().forEach((entry) => entry.session.end());

        for (const strategy of this.sendingStrategies) {
            await strategy.shutdown();
        }
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
        const entries = this.cache.getAllUninitializedSessions();

        for (const entry of entries) {
            await this.sendNewSessionRequest(entry);
        }
    }

    private async sendNewSessionRequest(entry: CacheEntry): Promise<void> {
        const response = await this.channel.sendNewSessionRequest(
            this.beaconUrl, StatusRequestImpl.create(this.appId, entry.communicationState.serverId),
        );

        if (response.valid) {
            entry.communicationState.updateFromResponse(response);
            entry.communicationState.setServerIdLocked();
            entry.initialized = true;
        }
    }

    private async finishSessions(): Promise<void> {
        const entries = this.cache.getAllClosedSessions();

        for (const entry of entries) {
            await this.sendPayload(entry);

            this.cache.unregister(entry);
        }
    }

    private async sendPayloadData(): Promise<void> {
        const entries = this.cache.getAllInitializedSessions();

        for (const entry of entries) {
            await this.sendPayload(entry);
        }
    }

    private async sendPayload(entry: CacheEntry): Promise<void> {
        let payload: Payload | undefined;
        // tslint:disable-next-line
        while (payload = entry.builder.getNextPayload(entry.prefix, this.timestampProvider.getCurrentTimestamp())) {
            const request = StatusRequestImpl.create(this.appId, entry.communicationState.serverId);

            const response = await this.channel.sendPayloadData(this.beaconUrl, request, payload);

            entry.communicationState.updateFromResponse(response);
        }
    }
}
