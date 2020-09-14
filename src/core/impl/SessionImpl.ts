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
    CrashReportingLevel,
    DataCollectionLevel,
    Logger,
    Session,
    WebRequestTracer,
} from '../../api';
import {
    OpenKitConfiguration,
    PrivacyConfiguration,
} from '../config/Configuration';
import { validationFailed } from '../logging/LoggingUtils';
import { PayloadBuilder } from '../payload/PayloadBuilder';
import {
    defaultTimestampProvider,
    TimestampProvider,
} from '../provider/TimestampProvider';
import { removeElement } from '../utils/Utils';
import { ActionImpl } from './ActionImpl';
import { defaultNullAction } from './null/NullAction';
import { defaultNullWebRequestTracer } from './null/NullWebRequestTracer';
import { PayloadBuilderHelper } from './PayloadBuilderHelper';
import { WebRequestTracerImpl } from './WebRequestTracerImpl';

export class SessionImpl implements Session {
    public readonly payloadData: PayloadBuilderHelper;

    private readonly openActions: Action[] = [];
    private readonly logger: Logger;

    private _isShutdown = false;

    constructor(
        public readonly sessionId: number,
        payloadBuilder: PayloadBuilder,
        sessionStartTime: number,
        private readonly config: PrivacyConfiguration & OpenKitConfiguration,
        timestampProvider: TimestampProvider = defaultTimestampProvider,
    ) {
        this.sessionId = sessionId;
        this.payloadData = new PayloadBuilderHelper(
            payloadBuilder,
            sessionStartTime,
            timestampProvider,
        );
        this.payloadData.startSession();

        this.logger = config.loggerFactory.createLogger(
            `SessionImpl (sessionId=${this.sessionId})`,
        );
        this.logger.debug('created');
    }

    /**
     * @inheritDoc
     */
    public end(): void {
        if (this._isShutdown) {
            // We only send the end-session event if the user enabled monitoring.
            return;
        }

        this._isShutdown = true;

        this.logger.debug('end');

        if (this.config.dataCollectionLevel === DataCollectionLevel.Off) {
            return;
        }

        // If DCL = Off => no actions are spawned anyway
        this.openActions.splice(0).forEach((action) => action.leaveAction());

        this.payloadData.endSession();
    }

    /**
     * @inheritDoc
     */
    public identifyUser(userTag: string): void {
        // Only capture userTag if we track everything.
        if (
            this.isShutdown() ||
            this.config.dataCollectionLevel !== DataCollectionLevel.UserBehavior
        ) {
            return;
        }

        // Only allow non-empty strings as userTag
        if (typeof userTag !== 'string' || userTag.length === 0) {
            validationFailed(
                this.logger,
                'identifyUser',
                'userTag must be a non empty string',
            );

            return;
        }

        this.logger.debug('identifyUser', { userTag });

        this.payloadData.identifyUser(userTag);
    }

    /**
     * @inheritDoc
     */
    public enterAction(actionName: string): Action {
        if (
            this.isShutdown() ||
            this.config.dataCollectionLevel === DataCollectionLevel.Off
        ) {
            return defaultNullAction;
        }

        this.logger.debug('enterAction', { actionName });

        const action = new ActionImpl(
            actionName,
            this.payloadData.currentTimestamp(),
            this,
            this.payloadData,
            this.config,
        );

        this.openActions.push(action);
        return action;
    }

    /**
     * @inheritDoc
     */
    public reportError(name: string, code: number, message: string): void {
        if (
            this.isShutdown() ||
            this.config.dataCollectionLevel === DataCollectionLevel.Off
        ) {
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

        this.logger.debug('reportError', { name, code, message });

        this.payloadData.reportError(0, name, code, String(message));
    }

    /**
     * @inheritDoc
     */
    public reportCrash(
        name: string,
        message: string,
        stacktrace: string,
    ): void {
        if (
            this.isShutdown() ||
            this.config.crashReportingLevel !== CrashReportingLevel.OptInCrashes
        ) {
            return;
        }

        if (typeof name !== 'string' || name.length === 0) {
            validationFailed(
                this.logger,
                'reportCrash',
                'name must be a non empty string',
                { name },
            );

            return;
        }

        this.logger.debug('reportCrash', { name, message, stacktrace });

        this.payloadData.reportCrash(name, String(message), String(stacktrace));
    }

    public traceWebRequest(url: string): WebRequestTracer {
        if (
            this.isShutdown() ||
            this.config.dataCollectionLevel === DataCollectionLevel.Off
        ) {
            return defaultNullWebRequestTracer;
        }

        if (typeof url !== 'string' || url.length === 0) {
            validationFailed(
                this.logger,
                'traceWebRequest',
                'url must be a non empty string',
                { url },
            );

            return defaultNullWebRequestTracer;
        }

        this.logger.debug('traceWebRequest', { url });

        const { deviceId, applicationId, loggerFactory } = this.config;

        return new WebRequestTracerImpl(
            this.payloadData,
            0,
            url,
            loggerFactory,
            deviceId,
            applicationId,
            this.sessionId,
        );
    }

    public isShutdown(): boolean {
        return this._isShutdown === true;
    }

    public _getOpenActions(): Action[] {
        return this.openActions.slice(0);
    }

    public _endAction(action: Action): void {
        removeElement(this.openActions, action);
    }
}
