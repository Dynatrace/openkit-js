/*
 * Copyright 2019 Dynatrace LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {InitCallback, OpenKit} from '../api/OpenKit';
import {BeaconSender} from './beacon/BeaconSender';
import {Configuration} from './config/Configuration';
import {Status} from './http/HttpResponse';

/**
 * Implementation of the {@link OpenKit} interface.
 */
export class OpenKitImpl implements OpenKit {
    public initCallback?: InitCallback;
    private initialized = false;
    private isShutdown = false;

    private readonly config: Configuration;
    private readonly sender: BeaconSender;

    constructor(config: Configuration) {
        this.config = config;
        this.sender = new BeaconSender(this.config);
    }

    public async initialize(): Promise<void> {
        const statusResponse = await this.sender.sendStatusRequest();

        this.config.updateSettings(statusResponse);

        if (!this.isShutdown) {
            this.initialized = statusResponse.status === Status.OK;
        }

        if (this.initCallback) {
            this.initCallback(this.initialized);
        }

        console.debug('OpenKitImpl', statusResponse);
        console.debug('OpenKitImpl', this.config);
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public shutdown(): void {
        this.isShutdown = true;
        this.initialized = false;
    }

    /**
     * @inheritDoc
     */
    public waitForInit(callback: InitCallback, timeout?: number): void {
        if (timeout === undefined) {
            this.initCallback = callback;
        } else {
            this.waitForInitWithTimeout(callback, timeout);
        }
    }

    private waitForInitWithTimeout(callback: InitCallback, timeout: number) {
        const timeoutId = setTimeout(() => {
            callback(false);
            this.initCallback = undefined;
        }, timeout);

        this.initCallback = (success) => {
            callback(success);
            clearTimeout(timeoutId);
        };
    }
}
