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

import { Action } from '../../api/Action';
import { CommunicationChannel } from '../../api/communication/CommunicationChannel';
import { CaptureMode, defaultInvalidStatusResponse, StatusResponse } from '../../api/communication/StatusResponse';
import { Session } from '../../api/Session';
import { CrashReportingLevel } from '../../CrashReportingLevel';
import { DataCollectionLevel } from '../../DataCollectionLevel';
import { PayloadData } from '../beacon/PayloadData';
import { PayloadSender } from '../beacon/PayloadSender';
import { removeElement } from '../utils/Utils';
import { ActionImpl } from './ActionImpl';
import { defaultNullAction } from './NullAction';
import { OpenKitImpl } from './OpenKitImpl';
import { OpenKitObject, Status } from './OpenKitObject';
import { StatusRequestImpl } from './StatusRequestImpl';

export class SessionImpl extends OpenKitObject implements Session {
    public readonly payloadData: PayloadData;
    public readonly sessionId: number;

    private readonly openKit: OpenKitImpl;
    private readonly openActions: Action[] = [];
    private readonly payloadSender: PayloadSender;
    private readonly communicationChannel: CommunicationChannel;

    constructor(openKit: OpenKitImpl, clientIp: string, sessionId: number) {
        super(openKit.state.clone(), openKit.state.config.loggerFactory.createLogger(`SessionImpl`));

        this.sessionId = sessionId;
        this.openKit = openKit;
        this.communicationChannel = this.state.config.communicationChannel;

        this.payloadData = new PayloadData(this.state, clientIp, sessionId);
        this.payloadSender = new PayloadSender(this.state, this.payloadData);

        this.payloadData.startSession();

        this.logger.debug(`Created Session id=${sessionId} with ip=${clientIp}`);
    }

    /**
     * @inheritDoc
     */
    public end(): void {
        this.waitForInit(() => {
            this.endSession();
        });
    }

    /**
     * @inheritDoc
     */
    public identifyUser(userTag: string): void {
        // Only capture userTag if we track everything.
        if (this.status === Status.Shutdown ||
            this.state.config.dataCollectionLevel !== DataCollectionLevel.UserBehavior) {

            return;
        }

        // Only allow non-empty strings as userTag
        if (typeof userTag !== 'string' || userTag.length === 0) {
            return;
        }

        this.logger.debug(`Identify User ${userTag} in session`, this.sessionId);
        this.payloadData.identifyUser(userTag);

        // Send immediately as we can not be sure that the session has a correct 'end'
        this.flush();
    }

    /**
     * @inheritDoc
     */
    public enterAction(actionName: string): Action {
        if (!this.mayEnterAction()) {
            return defaultNullAction;
        }

        const action = new ActionImpl(this, actionName, this.payloadData);

        this.openActions.push(action);

        return action;
    }

    /**
     * @inheritDoc
     */
    public endAction(action: Action): void {
        removeElement(this.openActions, action);
        this.flush();
    }

    /**
     * @inheritDoc
     */
    public reportCrash(name: string, message: string, stacktrace: string): void {
        if (typeof name !== 'string') {
            this.logger.warn('reportCrash', 'name is not a string', name);

            return;
        }

        if (!this.mayReportCrash() || name.length === 0) {

            return;
        }

        this.logger.debug('reportCrash', {name, reason: message, stacktrace});

        this.payloadData.reportCrash(name, String(message), String(stacktrace));
    }

    public init(): void {
        this.openKit.waitForInit(() => {
            if (this.openKit.status === Status.Initialized) {
                this.initialize();
            }
        });
    }

    public flush(): void {
        this.waitForInit(() => {
            if (this.status === Status.Initialized) {
                this.payloadSender.flush();
            }
        });
    }

    private async initialize(): Promise<void> {
        if (this.openKit.status !== Status.Initialized) {
            return;
        }

        // our state may be outdated, update it
        this.state.updateFromState(this.openKit.state);

        let response: StatusResponse;
        try {
            response = await this.communicationChannel.sendNewSessionRequest(
                this.state.config.beaconURL, StatusRequestImpl.from(this.state));
        } catch (exception) {
            this.logger.warn('Initialization failed with exception', exception);
            response = defaultInvalidStatusResponse;
        }

        this.finishInitialization(response);
        this.logger.debug('Successfully initialized Session', this.sessionId);
    }

    private mayReportCrash(): boolean {
        return this.status !== Status.Shutdown &&
            !this.state.isCaptureDisabled() &&
            this.state.config.crashReportingLevel === CrashReportingLevel.OptInCrashes &&
            this.state.captureCrashes === CaptureMode.On;
    }

    private mayEnterAction(): boolean {
        return this.status !== Status.Shutdown &&
            this.state.isCaptureDisabled() === false &&
            this.state.config.dataCollectionLevel !== DataCollectionLevel.Off;
    }

    /**
     * Ends the session.
     * If the session is initialized, all data is flushed before shutting the session down.
     */
    private endSession(): void {
        if (this.state.config.dataCollectionLevel === DataCollectionLevel.Off) {
            // We only send the end-session event if the user enabled monitoring.
            return;
        }

        this.logger.debug(`Ending Session (${this.sessionId}`);

        this.openActions.slice().forEach((action) => action.leaveAction());

        if (this.status === Status.Initialized) {
            this.payloadData.endSession();
        }

        this.openKit.removeSession(this);
        this.shutdown();
    }
}
