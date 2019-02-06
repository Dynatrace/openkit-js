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

import {Action} from '../../api/Action';
import {Session} from '../../api/Session';
import {PayloadData} from '../beacon/PayloadData';
import {PayloadSender} from '../beacon/PayloadSender';
import {createLogger} from '../utils/Logger';
import {removeElement} from '../utils/Utils';
import {ActionImpl} from './ActionImpl';
import {OpenKitImpl} from './OpenKitImpl';
import {OpenKitObject, Status} from './OpenKitObject';

const log = createLogger('SessionImpl');

export class SessionImpl extends OpenKitObject implements Session {
    private readonly openKit: OpenKitImpl;
    private readonly openActions: Action[] = [];
    private readonly payloadSender: PayloadSender;

    public readonly payloadData: PayloadData;

    constructor(openKit: OpenKitImpl, clientIp: string, sessionId: number) {
        super(openKit.state.clone());

        this.openKit = openKit;
        this.payloadData = new PayloadData(this, clientIp, sessionId);
        this.payloadSender = new PayloadSender(this.state, this.payloadData);

        this.payloadData.startSession();

        openKit.registerOnInitializedCallback(status => {
           if (status === Status.Initialized) {
               this.init();
           }
        });
    }

    private async init() {
        const response = await this.sender.sendNewSessionRequest();

        this.finishInitialization(response);
        this.state.setServerIdLocked();

        log.debug('Successfully initialized Session', this);
    }

    /**
     * Flush all remaining data
     */
    public async flush() {
        this.payloadSender.flush();
    }

    /**
     * @inheritDoc
     */
    public end(): void {
        this.registerOnInitializedCallback(() => {
            this.endSession();
        });
    }

    /**
     * Ends the session.
     * If the session is initialized, all data is flushed before shutting the session down.
     */
    private async endSession() {
        this.openActions.forEach(action => action.leaveAction());

        if (this.status === Status.Initialized) {
            this.payloadData.endSession();
            await this.flush();
        }

        this.openKit.removeSession(this);
        this.shutdown();
    }

    public enterAction(actionName: string): Action {
        const action = new ActionImpl(this, actionName, this.payloadData);

        this.openActions.push(action);

        return action;
    }

    public removeAction(action: Action) {
        removeElement(this.openActions, action);
    }
}
