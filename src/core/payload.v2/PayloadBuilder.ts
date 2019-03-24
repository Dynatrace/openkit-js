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

import { CommunicationState } from '../beacon.v2/CommunicationState';
import { StaticPayloadBuilder as StaticPayloadBuilder } from '../beacon/StaticPayloadBuilder';
import { createTag } from '../impl/WebRequestTracerImpl';
import { Payload } from './Payload';
import { PayloadQueue } from './PayloadQueue';

export class PayloadBuilder {
    private readonly queue = new PayloadQueue();

    constructor(
        private readonly commState: CommunicationState,
    ) {}

    public reportNamedEvent(name: string, actionId: number, sequenceNumber: number, timeSinceSessionStart: number): void {
        if (this.isCaptureDisabled()) {
            return;
        }

        const payload = StaticPayloadBuilder.reportNamedEvent(name, actionId, sequenceNumber, timeSinceSessionStart);

        this.queue.push(payload);
    }

    public reportCrash(errorName: string, reason: string, stacktrace: string, startSequenceNumber: number, timeSinceSessionStart: number): void {
        if (this.isCaptureCrashesDisabled()) {
            return;
        }

        const payload = StaticPayloadBuilder.reportCrash(errorName, reason, stacktrace, startSequenceNumber, timeSinceSessionStart);

        this.queue.push(payload);
    }

    public reportError(name: string, reason: string, errorValue: number, parentActionId: number, startSequenceNumber: number, timeSinceSessionStart: number): void {
        if (this.isCaptureErrorsDisabled()) {
            return;
        }

        const payload = StaticPayloadBuilder.reportError(name, parentActionId, startSequenceNumber, timeSinceSessionStart, reason, errorValue);

        this.queue.push(payload);
    }

    public reportValue(name: string, value: number | string | null | undefined, actionId: number, sequenceNumber: number, timeSinceSessionStart: number): void {
        if (this.isCaptureDisabled()) {
            return;
        }

        const payload = StaticPayloadBuilder.reportValue(actionId, name, value, sequenceNumber, timeSinceSessionStart);

        this.queue.push(payload);
    }

    public identifyUser(userTag: string, startSequenceNumber: number, timeSinceSessionStart: number): void {
        if (this.isCaptureDisabled()) {
            return;
        }

        const payload = StaticPayloadBuilder.identifyUser(userTag, startSequenceNumber, timeSinceSessionStart);

        this.queue.push(payload);
    }

    public action(
        name: string,
        actionId: number,
        startSequenceNumber: number,
        endSequenceNumber: number,
        timeSinceSessionStart: number,
        duration: number,
    ): void {
        if (this.isCaptureDisabled()) {
            return;
        }

        const payload = StaticPayloadBuilder.action(
            name, actionId, startSequenceNumber, endSequenceNumber, timeSinceSessionStart, duration);

        this.queue.push(payload);
    }

    public startSession(startSequenceNumber: number): void {
        if (this.isCaptureDisabled()) {
            return;
        }

        const payload = StaticPayloadBuilder.startSession(startSequenceNumber);

        this.queue.push(payload);
    }

    public endSession(startSequenceNumber: number, duration: number): void {
        if (this.isCaptureDisabled()) {
            return;
        }

        const payload = StaticPayloadBuilder.endSession(startSequenceNumber, duration);

        this.queue.push(payload);
    }

    public webRequest(
        url: string,
        parentActionId: number,
        startSequenceNumber: number,
        timeSinceSessionStart: number,
        endSequenceNumber: number,
        duration: number,
        bytesSent: number,
        bytesReceived: number,
        responseCode: number,
    ): void {
        if (this.isCaptureDisabled()) {
            return;
        }

        const p = StaticPayloadBuilder.webRequest(url, parentActionId, startSequenceNumber, timeSinceSessionStart,
            endSequenceNumber, duration, bytesSent, bytesReceived, responseCode);

        this.queue.push(p);
    }

    public getNextPayload(prefix: Payload, transmissionTime: number): Payload | undefined {
        if (this.queue.isEmpty()) {
            return undefined;
        }

        let payload = this.getCompletePrefix(prefix, transmissionTime);

        let remainingBeaconSize = this.commState.maxBeaconSize - payload.length;

        let next: Payload | undefined = this.queue.peek();
        while (next !== undefined && remainingBeaconSize - next.length > 0) {
            payload += '&' + this.queue.pop();
            remainingBeaconSize = this.commState.maxBeaconSize - payload.length;

            next = this.queue.peek();
        }

        return payload;
    }

    public getWebRequestTracerTag(actionId: number, sessionNumber: number, sequenceNumber: number, deviceId: string, appId: string): string {
        return createTag(actionId, sessionNumber, sequenceNumber, this.commState.serverId, deviceId, appId);
    }

    private getCompletePrefix(prefix: Payload, transmissionTime: number): Payload {
        const mutable = StaticPayloadBuilder.mutable(1, transmissionTime);

        return [prefix, mutable].join('&');
    }

    private isCaptureDisabled(): boolean {
        return !this.commState.capture;
    }

    private isCaptureErrorsDisabled(): boolean {
        return !this.commState.captureErrors || this.isCaptureDisabled();
    }

    private isCaptureCrashesDisabled(): boolean {
        return !this.commState.captureCrashes || this.isCaptureDisabled();
    }
}
