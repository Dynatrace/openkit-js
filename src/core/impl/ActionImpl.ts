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

import {
    Action,
    DataCollectionLevel,
    Logger,
    WebRequestTracer,
} from '../../api';
import {
    OpenKitConfiguration,
    PrivacyConfiguration,
} from '../config/Configuration';
import { validationFailed } from '../logging/LoggingUtils';
import { isFinite, isValidHttpUrl } from '../utils/Utils';
import { defaultNullWebRequestTracer } from './null/NullWebRequestTracer';
import { PayloadBuilderHelper } from './PayloadBuilderHelper';
import { SessionImpl } from './SessionImpl';
import { WebRequestTracerImpl } from './WebRequestTracerImpl';

export class ActionImpl implements Action {
    public readonly startSequenceNumber: number;
    public readonly actionId: number;
    public endSequenceNumber?: number;

    private readonly logger: Logger;

    private _endTime = -1;
    public get endTime(): number {
        return this._endTime;
    }

    constructor(
        public readonly name: string,
        public readonly startTime: number,
        private readonly session: SessionImpl,
        private readonly payloadBuilder: PayloadBuilderHelper,
        private readonly config: PrivacyConfiguration & OpenKitConfiguration,
    ) {
        this.startSequenceNumber = this.payloadBuilder.createSequenceNumber();
        this.actionId = this.payloadBuilder.createActionId();

        this.logger = config.loggerFactory.createLogger(
            `ActionImpl (sessionId=${session.sessionId}, actionId=${this.actionId})`,
        );

        this.logger.debug('created', { name });
    }

    /**
     * @inheritDoc
     */
    public reportValue(
        name: string,
        value: number | string | null | undefined,
    ): void {
        if (
            this.isActionLeft() ||
            this.config.dataCollectionLevel !== DataCollectionLevel.UserBehavior
        ) {
            return;
        }

        if (typeof name !== 'string' || name.length === 0) {
            validationFailed(
                this.logger,
                'reportValue',
                'Name must be a non empty string',
                { name },
            );

            return;
        }

        const type = typeof value;
        if (
            type !== 'string' &&
            type !== 'number' &&
            value !== null &&
            value !== undefined
        ) {
            validationFailed(
                this.logger,
                'reportValue',
                'Value is not a valid type',
                { value },
            );

            return;
        }

        this.logger.debug('reportValue', { name, value });

        this.payloadBuilder.reportValue(this, name, value);
    }

    /**
     * @inheritDoc
     */
    public reportEvent(name: string): void {
        if (
            this.isActionLeft() ||
            this.config.dataCollectionLevel !== DataCollectionLevel.UserBehavior
        ) {
            return;
        }

        if (typeof name !== 'string' || name.length === 0) {
            validationFailed(
                this.logger,
                'reportEvent',
                'Name must be a non empty string',
                { name },
            );

            return;
        }

        this.logger.debug('reportEvent', { name });

        this.payloadBuilder.reportEvent(this.actionId, name);
    }

    /**
     * @inheritDoc
     */
    public reportError(name: string, code: number): void {
        if (this.isActionLeft()) {
            validationFailed(
                this.logger,
                'reportError',
                'Action is already closed',
            );

            return;
        }

        if (typeof name !== 'string' || name.length === 0) {
            validationFailed(
                this.logger,
                'reportError',
                'Name must be a non empty string',
                { name },
            );

            return;
        }

        if (!isFinite(code)) {
            validationFailed(
                this.logger,
                'reportError',
                'Code must be a finite number',
                { code },
            );

            return;
        }

        this.logger.debug('reportError', { name, code });

        this.payloadBuilder.reportError(this.actionId, name, code);
    }

    public traceWebRequest(url: string): WebRequestTracer {
        if (this.isActionLeft()) {
            validationFailed(
                this.logger,
                'traceWebRequest',
                'Action is already closed',
            );

            return defaultNullWebRequestTracer;
        }

        if (typeof url !== 'string' || url.length === 0) {
            validationFailed(
                this.logger,
                'traceWebRequest',
                'Url must be a non empty string',
                { url },
            );

            return defaultNullWebRequestTracer;
        }

        if (!isValidHttpUrl(url)) {
            validationFailed(
                this.logger,
                'traceWebRequest',
                'url must be a valid url',
                { url },
            );

            return defaultNullWebRequestTracer;
        }

        this.logger.debug('traceWebRequest', { url });

        const { deviceId, applicationId, loggerFactory } = this.config;

        return new WebRequestTracerImpl(
            this.payloadBuilder,
            this.actionId,
            url,
            loggerFactory,
            deviceId,
            applicationId,
            this.session.sessionId,
        );
    }

    public leaveAction(): null {
        if (this.isActionLeft()) {
            return null;
        }

        this.endSequenceNumber = this.payloadBuilder.createSequenceNumber();
        this._endTime = this.payloadBuilder.currentTimestamp();
        this.payloadBuilder.addAction(this);
        this.session._endAction(this);

        this.logger.debug('leaveAction');

        return null;
    }

    private isActionLeft(): boolean {
        return this._endTime !== -1;
    }
}
