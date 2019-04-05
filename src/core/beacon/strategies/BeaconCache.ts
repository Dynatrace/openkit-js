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

import { SessionImpl } from '../../impl/SessionImpl';
import { PayloadBuilder } from '../../payload/PayloadBuilder';
import { removeElement } from '../../utils/Utils';
import { CommunicationState } from '../CommunicationState';

export interface CacheEntry {
    readonly prefix: string;
    readonly communicationState: CommunicationState;
    readonly session: SessionImpl;
    readonly builder: PayloadBuilder;

    initialized: boolean;
}

export interface BeaconCache {
    getEntries(): CacheEntry[];
}

export class BeaconCacheImpl {
    private readonly entries: CacheEntry[] = [];

    public register(session: SessionImpl, prefix: string, payloadBuilder: PayloadBuilder, state: CommunicationState): CacheEntry {

        const entry: CacheEntry = {
            session,
            initialized: false,
            prefix,
            communicationState: state,
            builder: payloadBuilder,
        };

        this.entries.push(entry);

        return entry;
    }

    public getAllUninitializedSessions(): CacheEntry[] {
        return this.entries.filter((entry) => !entry.initialized);
    }

    public getAllClosedSessions(): CacheEntry[] {
        return this.entries.filter((entry) => entry.initialized && entry.session.isShutdown());
    }

    public getAllInitializedSessions(): CacheEntry[] {
        return this.entries.filter((entry) => entry.initialized);
    }

    public unregister(entry: CacheEntry): void {
        removeElement(this.entries, entry);
    }

    public getEntries(): CacheEntry[] {
        return this.entries.slice(0);
    }
}
