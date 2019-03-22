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

import { PayloadBuilder as StaticPayloadBuilder } from '../beacon/PayloadBuilder';
import { SessionCommunicationProperties } from '../impl/OpenKitImpl';
import { createTag } from '../impl/WebRequestTracerImpl';
import { Payload } from './Payload';
import { PayloadQueue } from './PayloadQueue';

export class PayloadBuilder {
    private readonly queue = new PayloadQueue();

    constructor(
        private readonly properties: SessionCommunicationProperties,
    ) {}

    public reportNamedEvent(name: string, actionId: number, sequenceNumber: number, timeSinceSessionStart: number): void {
        if (!this.properties.isCaptureEnabled) {
            return;
        }

        const payload = StaticPayloadBuilder.reportNamedEvent(name, actionId, sequenceNumber, timeSinceSessionStart);

        this.queue.push(payload);
    }

    public push_unchecked(payload: Payload): void {
        this.queue.push(payload);
    }

    public getNextPayload(prefix: Payload, transmissionTime: number): Payload | undefined {
        if (this.queue.isEmpty()) {
            return undefined;
        }

        let payload = this.getCompletePrefix(prefix, transmissionTime);

        let remainingBeaconSize = this.properties.maxBeaconSize - payload.length;

        let next: Payload | undefined = this.queue.peek();
        while (next !== undefined && remainingBeaconSize - next.length > 0) {
            payload += '&' + this.queue.pop();
            remainingBeaconSize = this.properties.maxBeaconSize - payload.length;

            next = this.queue.peek();
        }

        return payload;
    }

    public getWebRequestTracerTag(actionId: number, sessionNumber: number, sequenceNumber: number, deviceId: string, appId: string): string {
        return createTag(actionId, sessionNumber, sequenceNumber, this.properties.serverId, deviceId, appId);
    }

    private getCompletePrefix(prefix: Payload, transmissionTime: number): Payload {
        const mutable = StaticPayloadBuilder.mutable(1, transmissionTime);

        return [prefix, mutable].join('&');
    }
}
