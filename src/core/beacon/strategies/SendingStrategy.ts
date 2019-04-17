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

import { BeaconSender } from '../BeaconSender';
import { BeaconCache, CacheEntry } from './BeaconCache';

export interface SendingStrategy {
    init(sender: BeaconSender, cache: BeaconCache): void;
    entryAdded(entry: CacheEntry): void;
    shutdown(): Promise<void>;
}

export abstract class AbstractSendingStrategy implements SendingStrategy {
    protected sender?: BeaconSender;
    protected cache?: BeaconCache;

    public init(sender: BeaconSender, cache: BeaconCache): void {
        this.sender = sender;
        this.cache = cache;

        this.afterInit();
    }

    public shutdown(): Promise<void> {
        return Promise.resolve();
    }

    public entryAdded(entry: CacheEntry): void {
        // stub
    }

    protected afterInit(): void {
        // stub
    }

    protected flush(): Promise<void> {
        if (!this.sender) {
            return Promise.resolve();
        }

        return this.sender.flush();
    }
}
