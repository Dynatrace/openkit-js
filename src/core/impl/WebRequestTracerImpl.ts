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

import { Logger, LoggerFactory, WebRequestTracer } from '../../api';
import { PayloadBuilderHelper } from './PayloadBuilderHelper';
import { protocolVersion } from '../PlatformConstants';

const tagPrefix = 'MT';

// We do not need to percent encode, because the device id and application id are only [0-9a-fA-F-]
export const createTag =
    (actionId: number, sessionNumber: number, sequenceNumber: number, serverId: number, deviceId: string, appId: string): string =>
        [
            tagPrefix,
            protocolVersion,
            serverId,
            deviceId,
            sessionNumber,
            appId,
            actionId,
            1,
            sequenceNumber,
        ].join('_');

export class WebRequestTracerImpl implements WebRequestTracer {
    private readonly payload: PayloadBuilderHelper;
    private readonly parentActionId: number;
    private readonly url: string;
    private readonly startSequenceNumber: number;
    private readonly tag: string;
    private readonly logger: Logger;

    private startTime: number;
    private endSequenceNumber: number = -1;
    private endTime: number = -1;
    private responseCode: number = -1;
    private bytesSent: number = -1;
    private bytesReceived: number = -1;

    constructor(
        payload: PayloadBuilderHelper,
        actionId: number,
        url: string,
        logFactory: LoggerFactory,
        deviceId: string,
        appId: string,
        sessionNumber: number,
    ) {
        this.payload = payload;
        this.parentActionId = actionId;
        this.url = url;

        // creating start sequence number has to be done here, because it's needed for the creation of the tag
        this.startSequenceNumber = payload.createSequenceNumber();

        this.logger = logFactory.createLogger(`WebRequestTracerImpl] [${sessionNumber}] [${this.startSequenceNumber}`);

        // if start is not called before using the setters the start time (e.g. load time) is not in 1970
        this.startTime = payload.currentTimestamp();

        this.tag =
            payload.payloadBuilder.getWebRequestTracerTag(actionId, sessionNumber, this.startSequenceNumber, deviceId, appId);

        this.logger.debug('create');
    }

    public getTag(): string {
        this.logger.debug('getTag', `tag=${this.tag}`);

        return this.tag;
    }

    public setBytesReceived(bytesReceived: number): this {
        if (!this.isStopped()) {
            this.logger.debug('setBytesReceived', `bytesReceived=${bytesReceived}`);

            this.bytesReceived = bytesReceived;
        }

        return this;
    }

    public setBytesSent(bytesSent: number): this {
        if (!this.isStopped()) {
            this.logger.debug('setBytesReceived', `bytesSent=${bytesSent}`);

            this.bytesSent = bytesSent;
        }

        return this;
    }

    public start(): this {
        if (!this.isStopped()) {
            this.logger.debug('start');

            this.startTime = this.payload.currentTimestamp();
        }

        return this;
    }

    public stop(responseCode?: number): void {
        if (this.isStopped()) {
            return;
        }

        if (responseCode !== undefined) {
            this.responseCode = responseCode;
        }

        this.endTime = this.payload.currentTimestamp();

        this.endSequenceNumber = this.payload.createSequenceNumber();

        this.logger.debug('stop()', 'duration=' + (this.endTime - this.startTime));
        this.payload.addWebRequest(this, this.parentActionId);
    }

    public getUrl(): string {
        return this.url;
    }

    public getDuration(): number {
        if (!this.isStopped()) {
            return -1;
        }

        return this.endTime - this.startTime;
    }

    public getStart(): number {
        return this.startTime;
    }

    public getResponseCode(): number {
        return this.responseCode;
    }

    public getBytesReceived(): number {
        return this.bytesReceived;
    }

    public getBytesSent(): number {
        return this.bytesSent;
    }

    public getEndSequenceNumber(): number {
        return this.endSequenceNumber;
    }

    public getStartSequenceNumber(): number {
        return this.startSequenceNumber;
    }

    private isStopped(): boolean {
        return this.endTime !== -1;
    }
}
