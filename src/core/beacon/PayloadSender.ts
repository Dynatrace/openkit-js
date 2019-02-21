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

import { CommunicationChannel } from '../../api/communication/CommunicationChannel';
import { State } from '../impl/State';
import { StatusRequestImpl } from '../impl/StatusRequestImpl';
import { CallbackHolder } from '../utils/CallbackHolder';
import { PayloadData } from './PayloadData';

/**
 * Responsible for building and sending payloads to the beacon.
 */
export class PayloadSender {
    private readonly state: State;
    private readonly channel: CommunicationChannel;
    private readonly payloadData: PayloadData;
    private readonly callbackHolder = new CallbackHolder<void>();

    private flushing = false;

    constructor(state: State, payloadData: PayloadData) {
        this.state = state;
        this.channel = state.config.communicationFactory.getCommunicationChannel();
        this.payloadData = payloadData;
    }

    /**
     * Flushes all data in the payloadData to the server.
     *
     * Multiple calls to flush only execute it once, but all resolve at the same time after it finished.
     */
    public flush(): Promise<void> {

        return new Promise<void>((res) => {
            this.callbackHolder.add(res);

            if (this.flushing  === true) {
                return;
            }
            this.flushing = true;

            this.sendPayloads().then(() => {
                this.callbackHolder.resolve();
                this.flushing = false;
            });
        });
    }

    private async sendPayloads(): Promise<void> {
        while (this.state.multiplicity !== 0 && this.payloadData.hasPayloadsLeft()) {
            await this.sendPayload();
        }
    }

    private async sendPayload(): Promise<void> {
        const payload = this.payloadData.getNextPayload();
        if (payload === undefined) {
            return;
        }

        const response = await this.channel.sendPayloadData(
            this.state.config.beaconURL, StatusRequestImpl.from(this.state), payload);

        if (response.valid) {
            this.state.updateState(response);
        } else {
            this.state.stopCommunication();
        }
    }
}
