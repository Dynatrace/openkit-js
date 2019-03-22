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

import { DataCollectionLevel } from '../../api';
import { ActionImpl } from '../impl/ActionImpl';
import { State } from '../impl/State';
import { WebRequestTracerImpl } from '../impl/WebRequestTracerImpl';
import { Payload } from '../payload.v2/Payload';
import { SequenceIdProvider } from '../provider/SequenceIdProvider';
import { defaultTimestampProvider, TimestampProvider } from '../provider/TimestampProvider';
import { PayloadBuilder } from './PayloadBuilder';

/**
 * Responsible for creating and holding all payload data for a session.
 */
export class PayloadData {
    private readonly payloadQueue: Payload[] = [];

    private readonly state: State;

    private readonly sequenceId = new SequenceIdProvider();
    private readonly nextId = new SequenceIdProvider();
    private readonly timestampProvider: TimestampProvider;

    private readonly sessionStartTime: number;

    constructor(
        state: State,
        timestampProvider: TimestampProvider = defaultTimestampProvider) {
        this.state = state;
        this.timestampProvider = timestampProvider;
        this.sessionStartTime = timestampProvider.getCurrentTimestamp();
    }

    public createId(): number {
        return this.nextId.next();
    }

    public createSequenceNumber(): number {
        return this.sequenceId.next();
    }

    public startSession(): void {
        this.addPayload(PayloadBuilder.startSession(this.createSequenceNumber()));
    }

    public endSession(): void {
        const duration = this.timestampProvider.getCurrentTimestamp() - this.sessionStartTime;
        this.addPayload(PayloadBuilder.endSession(this.createSequenceNumber(), duration));
    }

    public addAction(action: ActionImpl): void {
        this.addPayload(PayloadBuilder.action(action, this.sessionStartTime));
    }

    public reportValue(action: ActionImpl, name: string, value: number | string | null | undefined): void {
        this.addPayload(PayloadBuilder.reportValue(
            action,
            name,
            value,
            this.createSequenceNumber(),
            this.timestampProvider.getCurrentTimestamp(),
            this.sessionStartTime));
    }

    public identifyUser(userTag: string): void {
        this.addPayload(PayloadBuilder.identifyUser(
            userTag,
            this.createSequenceNumber(),
            this.timestampProvider.getCurrentTimestamp(),
            this.sessionStartTime));
    }

    public reportError(parentActionId: number, name: string, code: number, message: string): void {
        this.addPayload(PayloadBuilder.reportError(
            name,
            parentActionId,
            this.createSequenceNumber(),
            this.timestampProvider.getCurrentTimestamp() - this.sessionStartTime,
            message,
            code,
        ));
    }

    public reportCrash(errorName: string, reason: string, stacktrace: string): void {
        this.addPayload(PayloadBuilder.reportCrash(
            errorName,
            reason,
            stacktrace,
            this.createSequenceNumber(),
            this.sessionStartTime,
            this.timestampProvider.getCurrentTimestamp(),
        ));
    }

    public reportEvent(actionId: number, name: string): void {
        this.addPayload(PayloadBuilder.reportNamedEvent(
            name,
            actionId,
            this.createSequenceNumber(),
            this.timestampProvider.getCurrentTimestamp() - this.sessionStartTime));
    }

    public getNextPayload(prefix: string): Payload | undefined {
        if (this.payloadQueue.length === 0) {
            return undefined;
        }

        const maxLength = this.state.maxBeaconSize;
        let currentPayload = this.getCompletePayloadPrefix(prefix);

        let remainingLength;
        do {
            currentPayload += `&${this.payloadQueue.shift()}`;

            remainingLength = maxLength - currentPayload.length;
        } while (this.payloadQueue.length !== 0 && (remainingLength - this.payloadQueue[0].length) > 0);

        return currentPayload;
    }

    public currentTimestamp(): number {
        return this.timestampProvider.getCurrentTimestamp();
    }

    public addWebRequest(webRequest: WebRequestTracerImpl, parentActionId: number): void {
        if (this.state.isCaptureDisabled() || this.state.config.dataCollectionLevel === DataCollectionLevel.Off) {
            return;
        }

        this.addPayload(PayloadBuilder.webRequest(
            webRequest.getUrl(),
            parentActionId,
            webRequest.getStartSequenceNumber(),
            this.currentTimestamp() - webRequest.getStart(),
            webRequest.getEndSequenceNumber(),
            webRequest.getDuration(),
            webRequest.getBytesSent(),
            webRequest.getBytesReceived(),
            webRequest.getResponseCode(),
        ));
    }

    public hasPayloadsLeft(): boolean {
        return this.payloadQueue.length > 0;
    }

    private getCompletePayloadPrefix(prefix: string): Payload {
        const mutablePart = PayloadBuilder.mutable(
            this.sessionStartTime, this.state.multiplicity, this.timestampProvider.getCurrentTimestamp());

        return `${prefix}&${mutablePart}`;
    }

    private addPayload(payload: Payload): void {
        this.payloadQueue.push(payload);
    }
}
