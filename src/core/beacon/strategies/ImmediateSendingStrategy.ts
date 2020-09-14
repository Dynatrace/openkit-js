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

import { getEventType, Payload } from '../../payload/Payload';
import { PayloadBuilderListener } from '../../payload/PayloadBuilder';
import { EventType } from '../../protocol/EventType';
import { CacheEntry } from './BeaconCache';
import { FlushLeftoversStrategy } from './FlushLeftoversStrategy';

const defaultFlushEventTypes = [
    EventType.Crash,
    EventType.Error,
    EventType.ManualAction,
    EventType.IdentifyUser,
    EventType.SessionStart,
    EventType.SessionEnd,
    EventType.WebRequest,
];

export class ImmediateSendingStrategy
    extends FlushLeftoversStrategy
    implements PayloadBuilderListener {
    constructor(private flushEventTypes: EventType[] = defaultFlushEventTypes) {
        super();
    }

    public afterInit(): void {
        this.flush();
    }

    public added(payload: Payload): void {
        if (!this.sender) {
            return;
        }

        const et = getEventType(payload);

        if (et !== undefined && this.shouldFlush(et)) {
            this.flush();
        }
    }

    public entryAdded(entry: CacheEntry): void {
        entry.builder.register(this);
    }

    private shouldFlush(eventType: EventType): boolean {
        return this.flushEventTypes.indexOf(eventType) !== -1;
    }
}
