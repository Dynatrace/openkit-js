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

import {State} from '../impl/State';
import {BeaconSender} from './BeaconSender';
import {PayloadData} from './PayloadData';

/**
 * Responsible for building and sending payloads to the beacon.
 */
export class PayloadSender {
    private readonly state: State;
    private readonly sender: BeaconSender;
    private readonly beacon: PayloadData;

    private flushing = false;

    constructor(state: State, payloadData: PayloadData) {
        this.state = state;
        this.sender = new BeaconSender(state);
        this.beacon = payloadData;
    }

    /**
     * Flushes all data to the server, with multiplicity in mind
     */
    public async flush(): Promise<void> {
        if (this.flushing === true) {
            return;
        }

        this.flushing = true;

        await this.sendPayloads();

        this.flushing = false;
    }

    private async sendPayloads() {
        while (this.state.multiplicity !== 0 && this.beacon.hasPayloadsLeft()) {
            await this.sendPayload();
        }
    }

    private async sendPayload() {
        const payload = this.beacon.getNextPayload();
        if (payload === undefined) {
            return;
        }

        const response = await this.sender.sendPayload(payload);

        if (response.valid) {
            this.state.updateState(response);
        } else {
            this.state.stopCommunication();
        }
    }
}
