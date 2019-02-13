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
import { Session } from '../../api/Session';
import { DataCollectionLevel } from '../../DataCollectionLevel';
import { PayloadData } from '../beacon/PayloadData';
import { PayloadSender } from '../beacon/PayloadSender';
import { createLogger } from '../utils/Logger';
import { removeElement } from '../utils/Utils';
import { ActionImpl } from './ActionImpl';
import { defaultNullAction } from './NullAction';
import { OpenKitImpl } from './OpenKitImpl';
import { OpenKitObject, Status } from './OpenKitObject';

const log = createLogger('SessionImpl');

export class SessionImpl extends OpenKitObject implements Session {

    public readonly payloadData: PayloadData;
    private readonly openKit: OpenKitImpl;
    private readonly openActions: Action[] = [];
    private readonly payloadSender: PayloadSender;

    constructor(openKit: OpenKitImpl, clientIp: string, sessionId: number) {
        super(openKit.state.clone());

        this.openKit = openKit;
        this.payloadData = new PayloadData(this.state, clientIp, sessionId);
        this.payloadSender = new PayloadSender(this.state, this.payloadData);

        this.payloadData.startSession();

        openKit.registerOnInitializedCallback((status) => {
           if (status === Status.Initialized) {
               this.init();
           }
        });
    }

    /**
     * Flush all remaining data
     */
    public flush(): void {
        this.registerOnInitializedCallback(() => this.payloadSender.flush());
    }

    /**
     * @inheritDoc
     */
    public end(): void {
        this.registerOnInitializedCallback(() => {
            this.endSession();
        });
    }

    public enterAction(actionName: string): Action {
        if (!this.mayEnterAction()) {
            return defaultNullAction;
        }

        const action = new ActionImpl(this, actionName, this.payloadData);

        this.openActions.push(action);

        return action;
    }

    public removeAction(action: Action): void {
        removeElement(this.openActions, action);
    }

    private mayEnterAction(): boolean {
        return this.status !== Status.Shutdown &&
            this.state.multiplicity !== 0 &&
            this.state.config.dataCollectionLevel !== DataCollectionLevel.Off;
    }

    /**
     * Ends the session.
     * If the session is initialized, all data is flushed before shutting the session down.
     */
    private endSession(): void {
        this.openActions.forEach((action) => action.leaveAction());

        if (this.status === Status.Initialized) {
            this.payloadData.endSession();
            this.flush();
        }

        this.openKit.removeSession(this);
        this.shutdown();
    }

    private async init(): Promise<void> {
        const response = await this.sender.sendNewSessionRequest();

        this.finishInitialization(response);
        this.state.setServerIdLocked();

        log.debug('Successfully initialized Session', this);
    }
}
