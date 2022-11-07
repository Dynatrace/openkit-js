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

import { CommunicationChannel, Logger } from '../../api';
import { OpenKitConfiguration } from '../config/Configuration';
import { OpenKitImpl } from '../impl/OpenKitImpl';
import { Payload } from '../payload/Payload';
import { defaultServerId } from '../PlatformConstants';
import { defaultTimestampProvider } from '../provider/TimestampProvider';
import { StatusRequestImpl } from './StatusRequestImpl';
import { BeaconCacheImpl, CacheEntry } from './strategies/BeaconCache';
import { SendingStrategy } from './strategies/SendingStrategy';

export interface BeaconSender {
    flush(): Promise<void>;
    flushImmediate(): Promise<void>;
}

export class BeaconSenderImpl implements BeaconSender {
    private readonly appId: string;
    private readonly beaconUrl: string;
    private readonly sendingStrategies: SendingStrategy[];
    private readonly channel: CommunicationChannel;

    private readonly timestampProvider = defaultTimestampProvider;

    private readonly logger: Logger;

    private okServerId: number = defaultServerId;
    private readonly deviceId: string;

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
        this.deviceId = config.deviceId;

        this.logger = config.loggerFactory.createLogger('BeaconSender');
    }

    public async init(): Promise<void> {
        this.logger.debug('init');

        const response = await this.channel.sendStatusRequest(
            this.beaconUrl,
            StatusRequestImpl.create(this.appId, this.okServerId, 0),
        );

        if (response.valid) {
            this.initialized = true;
            this.okServerId =
                response.serverId === undefined
                    ? defaultServerId
                    : response.serverId;

            this.cache.getEntriesCopy().forEach((entry) => {
                entry.communicationState.setServerId(this.okServerId);
            });

            this.sendingStrategies.forEach((strategy) =>
                strategy.init(this, this.cache),
            );
        }

        this.openKit.notifyInitialized(response.valid);
    }

    public sessionAdded(entry: CacheEntry): void {
        entry.communicationState.setServerId(this.okServerId);

        this.sendingStrategies.forEach((strategy) =>
            strategy.entryAdded(entry),
        );
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public async shutdown(): Promise<void> {
        if (this.isShutdown) {
            return;
        }
        this.isShutdown = true;

        this.logger.debug('shutdown');

        // Close all sessions
        this.cache.getEntriesCopy().forEach((entry) => entry.session.end());

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
            await this.sendNewSessionRequests(false);
            await this.sendPayloadData();
            await this.finishSessions();
        }

        this.flushing = false;
    }

    public async flushImmediate(): Promise<void> {
        if (this.initialized) {
            await this.sendNewSessionRequests(true);
            await this.sendPayloadData();
            await this.finishSessions();
        }
    }

    private async sendNewSessionRequests(immediate: boolean): Promise<void> {
        const entries = this.cache.getAllUninitializedSessions();

        if (immediate) {
            for (const entry of entries) {
                entry.communicationState.setServerId(this.okServerId);
                entry.communicationState.setServerIdLocked();
                entry.initialized = true;
            }
        } else {
            for (const entry of entries) {
                await this.sendNewSessionRequest(entry);
            }
        }
    }

    private async sendNewSessionRequest(entry: CacheEntry): Promise<void> {
        const response = await this.channel.sendNewSessionRequest(
            this.beaconUrl,
            StatusRequestImpl.create(
                this.appId,
                entry.communicationState.serverId,
                entry.communicationState.timestamp,
                this.deviceId,
                entry.session.sessionId,
            ),
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
        while (
            // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions,no-cond-assign
            (payload = entry.builder.getNextPayload(
                entry.prefix,
                this.timestampProvider.getCurrentTimestampMs(),
            ))
        ) {
            const request = StatusRequestImpl.create(
                this.appId,
                entry.communicationState.serverId,
                entry.communicationState.timestamp,
                this.deviceId,
                entry.session.sessionId,
            );

            const response = await this.channel.sendPayloadData(
                this.beaconUrl,
                request,
                payload,
            );

            entry.communicationState.updateFromResponse(response);
        }
    }
}
