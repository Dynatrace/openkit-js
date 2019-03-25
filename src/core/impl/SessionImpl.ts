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
    LoggerFactory,
    Session,
    WebRequestTracer,
} from '../../api';
import { PayloadBuilderHelper } from './PayloadBuilderHelper';
import { OpenKitConfiguration, PrivacyConfiguration } from '../config/Configuration';
import { PayloadBuilder } from '../payload.v2/PayloadBuilder';
import { removeElement } from '../utils/Utils';
import { ActionImpl } from './ActionImpl';
import { defaultNullAction } from './null/NullAction';
import { defaultNullWebRequestTracer } from './null/NullWebRequestTracer';
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
    ) {
        this.logger = config.loggerFactory.createLogger('SessionImpl');

        this.sessionId = sessionId;

        this.payloadData = new PayloadBuilderHelper(payloadBuilder, sessionStartTime);

        this.payloadData.startSession();

        this.logger.debug(`Created Session id=${sessionId}`);
    }

    /**
     * @inheritDoc
     */
    public end(): void {
        this.endSession();
    }

    /**
     * @inheritDoc
     */
    public identifyUser(userTag: string): void {
        // Only capture userTag if we track everything.
        if (this.isShutdown() ||
            this.config.dataCollectionLevel !== DataCollectionLevel.UserBehavior) {

            return;
        }

        // Only allow non-empty strings as userTag
        if (typeof userTag !== 'string' || userTag.length === 0) {
            return;
        }

        this.logger.debug(`Identify User ${userTag} in session`, this.sessionId);
        this.payloadData.identifyUser(userTag);
    }

    /**
     * @inheritDoc
     */
    public enterAction(actionName: string): Action {
        if (this.isShutdown() || this.config.dataCollectionLevel === DataCollectionLevel.Off) {
            return defaultNullAction;
        }

        const action = new ActionImpl(this, actionName, this.payloadData, this.config);

        this.openActions.push(action);

        return action;
    }

    /**
     * @inheritDoc
     */
    public reportError(name: string, code: number, message: string): void {
        if (this.isShutdown() || this.config.dataCollectionLevel === DataCollectionLevel.Off) {
            return;
        }

        if (typeof name !== 'string' || name.length === 0) {
            this.logger.warn('reportError', `session id=${this.sessionId}`, 'Invalid name', name);
            return;
        }

        if (typeof code !== 'number') {
            this.logger.warn('reportError', `session id=${this.sessionId}`, 'Invalid error code', name);
            return;
        }

        this.logger.debug('reportError', `session id=${this.sessionId}`, {name, code, message});

        this.payloadData.reportError(0, name, code, String(message));
    }

    /**
     * @inheritDoc
     */
    public endAction(action: Action): void {
        removeElement(this.openActions, action);
    }

    /**
     * @inheritDoc
     */
    public reportCrash(name: string, message: string, stacktrace: string): void {
        if (typeof name !== 'string') {
            this.logger.warn('reportCrash', 'name is not a string', name);

            return;
        }

        if (this.isShutdown() || this.config.crashReportingLevel !== CrashReportingLevel.OptInCrashes || name.length === 0) {
            return;
        }

        this.logger.debug('reportCrash', {name, reason: message, stacktrace});

        this.payloadData.reportCrash(name, String(message), String(stacktrace));
    }

    public traceWebRequest(url: string): WebRequestTracer {
        if (typeof url !== 'string' || url.length === 0) {
            return defaultNullWebRequestTracer;
        }

        if (this.isShutdown()) {
            return defaultNullWebRequestTracer;
        }

        if (this.config.dataCollectionLevel === DataCollectionLevel.Off) {
            return defaultNullWebRequestTracer;
        }

        const { deviceId, applicationId, loggerFactory } = this.config;

        return new WebRequestTracerImpl(
            this.payloadData, 0, url, loggerFactory, deviceId, applicationId, this.sessionId,
        );
    }

    public isShutdown(): boolean {
        return this._isShutdown === true;
    }

    /**
     * Ends the session.
     * If the session is initialized, all data is flushed before shutting the session down.
     */
    private endSession(): void {
        if (this.config.dataCollectionLevel === DataCollectionLevel.Off) {
            // We only send the end-session event if the user enabled monitoring.
            return;
        }

        this.logger.debug(`Ending Session (${this.sessionId})`);

        this.openActions.slice(0).forEach((action) => action.leaveAction());

        this.payloadData.endSession();

        this._isShutdown = true;
    }
}
