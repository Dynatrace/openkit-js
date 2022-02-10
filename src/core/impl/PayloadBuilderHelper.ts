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

import { PayloadBuilder } from '../payload/PayloadBuilder';
import { SequenceIdProvider } from '../provider/SequenceIdProvider';
import {
    defaultTimestampProvider,
    TimestampProvider,
} from '../provider/TimestampProvider';
import { ActionImpl } from './ActionImpl';
import { WebRequestTracerImpl } from './WebRequestTracerImpl';

/**
 * Responsible for creating and holding all payload data for a session.
 */
export class PayloadBuilderHelper {
    private readonly sequenceId = new SequenceIdProvider();
    private readonly nextId = new SequenceIdProvider();

    constructor(
        public readonly payloadBuilder: PayloadBuilder,
        private readonly sessionStartTime: number,
        private readonly timestampProvider: TimestampProvider = defaultTimestampProvider,
    ) {}

    public createActionId(): number {
        return this.nextId.next();
    }

    public createSequenceNumber(): number {
        return this.sequenceId.next();
    }

    public startSession(): void {
        this.payloadBuilder.startSession(this.createSequenceNumber());
    }

    public endSession(): void {
        this.payloadBuilder.endSession(
            this.createSequenceNumber(),
            this.timeSinceSessionStart(),
        );
    }

    public addAction(action: ActionImpl): void {
        if (action.endSequenceNumber === undefined) {
            return;
        }

        this.payloadBuilder.action(
            action.name,
            action.actionId,
            action.startSequenceNumber,
            action.endSequenceNumber,
            action.startTime - this.sessionStartTime,
            action.endTime - action.startTime,
        );
    }

    public reportValue(
        action: ActionImpl,
        name: string,
        value: number | string | null | undefined,
    ): void {
        this.payloadBuilder.reportValue(
            name,
            value,
            action.actionId,
            this.createSequenceNumber(),
            this.timeSinceSessionStart(),
        );
    }

    public identifyUser(userTag: string): void {
        this.payloadBuilder.identifyUser(
            userTag,
            this.createSequenceNumber(),
            this.timeSinceSessionStart(),
        );
    }

    public reportError(
        parentActionId: number,
        name: string,
        code: number,
        message: string,
    ): void {
        this.payloadBuilder.reportError(
            name,
            message,
            code,
            parentActionId,
            this.createSequenceNumber(),
            this.timeSinceSessionStart(),
        );
    }

    public reportCrash(
        errorName: string,
        reason: string,
        stacktrace: string,
    ): void {
        this.payloadBuilder.reportCrash(
            errorName,
            reason,
            stacktrace,
            this.createSequenceNumber(),
            this.timeSinceSessionStart(),
        );
    }

    public reportEvent(actionId: number, name: string): void {
        this.payloadBuilder.reportNamedEvent(
            name,
            actionId,
            this.createSequenceNumber(),
            this.timeSinceSessionStart(),
        );
    }

    public currentTimestamp(): number {
        return this.timestampProvider.getCurrentTimestamp();
    }

    public addWebRequest(
        webRequest: WebRequestTracerImpl,
        parentActionId: number,
    ): void {
        this.payloadBuilder.webRequest(
            webRequest.getUrl(),
            parentActionId,
            webRequest.getStartSequenceNumber(),
            webRequest.getStart() - this.sessionStartTime,
            webRequest.getEndSequenceNumber(),
            webRequest.getDuration(),
            webRequest.getBytesSent(),
            webRequest.getBytesReceived(),
            webRequest.getResponseCode(),
        );
    }

    public getWebRequestTracerTag(
        actionId: number,
        sessionNumber: number,
        sequenceNumber: number,
        deviceId: string,
        appId: string,
    ): string {
        return this.payloadBuilder.getWebRequestTracerTag(
            actionId,
            sessionNumber,
            sequenceNumber,
            deviceId,
            appId,
        );
    }

    public sendEvent(jsonPayload: string): void {
        this.payloadBuilder.sendEvent(jsonPayload);
    }

    private timeSinceSessionStart(): number {
        return this.currentTimestamp() - this.sessionStartTime;
    }
}
