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
import { defaultInvalidStatusResponse, StatusResponse } from '../../api/communication/StatusResponse';
import { State } from '../impl/State';
import { StatusRequestImpl } from '../impl/StatusRequestImpl';
import { createLogger } from '../utils/Logger';
import { PayloadData } from './PayloadData';

const log = createLogger('PayloadSender');

/**
 * Responsible for building and sending payloads to the beacon.
 */
export class PayloadSender {
    private readonly state: State;
    private readonly channel: CommunicationChannel;
    private readonly payloadData: PayloadData;

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
    public async flush(): Promise<void> {
        await this.sendPayloads();
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

        let response: StatusResponse;

        try {
            response = await this.channel.sendPayloadData(
                this.state.config.beaconURL, StatusRequestImpl.from(this.state), payload);
        } catch (exception) {
            log.warn('Failed to send payload data with exception', exception);
            response = defaultInvalidStatusResponse;
        }

        if (response.valid) {
            this.state.updateState(response);
        } else {
            this.state.stopCommunication();
        }
    }
}
