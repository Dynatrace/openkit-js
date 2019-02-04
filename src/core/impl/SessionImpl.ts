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

import {Session} from '../../api/Session';
import {Beacon} from '../beacon/Beacon';
import {OpenKitImpl} from './OpenKitImpl';
import {OpenKitObject, Status} from './OpenKitObject';

export class SessionImpl extends OpenKitObject implements Session {
    private readonly beaconData: Beacon;
    private readonly ok: OpenKitImpl;

    constructor(openKit: OpenKitImpl, clientIp: string, sessionId: number) {
        super(openKit.state.clone());

        this.ok = openKit;
        this.beaconData = new Beacon(this.state, clientIp, sessionId);

        this.beaconData.startSession();

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

        console.debug('[SessionImpl]', 'Successfully initialized Session', this);
    }

    /**
     * Flush all remaining data
     */
    private async flush() {
        let payload = this.beaconData.getNextPayload();

        while (payload !== undefined && this.status !== Status.Shutdown) {
            await this.flushSingle(payload);

            payload = this.beaconData.getNextPayload();
        }
    }

    /**
     * Flush single payload. If the response is invalid, the session is shutdown.
     *
     * @param payload The payload to send.
     */
    private async flushSingle(payload: string): Promise<void> {
        if (this.state.multiplicity === 0) {
           return;
        }

        const response = await this.sender.sendPayload(payload);

        if (response.valid) {
            this.state.updateState(response);
        } else {
            this.shutdown();
        }
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
        if (this.status === Status.Initialized) {
            this.beaconData.endSession();
            await this.flush();
        }
        this.ok.removeSession(this);
        this.shutdown();
    }
}
