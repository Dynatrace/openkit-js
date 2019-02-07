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

import { ActionImpl } from '../impl/ActionImpl';
import { State } from '../impl/State';
import { SequenceIdProvider } from '../utils/SequenceIdProvider';
import { now } from '../utils/Utils';
import { PayloadBuilder } from './PayloadBuilder';

/**
 * Responsible for creating and holding all payload data for a session.
 */
export class PayloadData {
    private readonly payloadQueue: string[] = [];

    private readonly state: State;

    private readonly sequenceId = new SequenceIdProvider();
    private readonly nextId = new SequenceIdProvider();

    private readonly sessionStartTime = now();
    private readonly payloadPrefix: string;

    constructor(state: State, clientIp: string, sessionId: number) {
        this.state = state;
        this.payloadPrefix = PayloadBuilder.prefix(this.state.config, sessionId, clientIp);
    }

    public createId(): number {
        return this.nextId.getNextId();
    }

    public createSequenceNumber(): number {
        return this.sequenceId.getNextId();
    }

    public startSession(): void {
        this.addPayload(PayloadBuilder.startSession(this.createId()));
    }

    public endSession(): void {
        this.addPayload(PayloadBuilder.endSession(this.createSequenceNumber(), now() - this.sessionStartTime));
    }

    public addAction(action: ActionImpl): void {
        this.addPayload(PayloadBuilder.action(action, this.sessionStartTime));
    }

    public getNextPayload(): string | undefined {
        if (this.payloadQueue.length === 0) {
            return undefined;
        }

        const maxLength = this.state.maxBeaconSize;
        let currentPayload = this.getCompletePayloadPrefix();

        let remainingLength;
        do {
            currentPayload += `&${this.payloadQueue.shift()}`;

            remainingLength = maxLength - currentPayload.length;
        } while (this.payloadQueue.length !== 0 && (remainingLength - this.payloadQueue[0].length) > 0);

        return currentPayload;
    }

    public hasPayloadsLeft(): boolean {
        return this.payloadQueue.length > 0;
    }

    private getCompletePayloadPrefix(): string {
        return `${this.payloadPrefix}&${PayloadBuilder.mutable(this.sessionStartTime, this.state.multiplicity, now())}`;
    }

    private addPayload(payload: string): void {
        this.payloadQueue.push(payload);
    }
}
