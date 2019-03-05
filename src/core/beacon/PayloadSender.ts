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
import { Logger } from '../../api/logging/Logger';
import { State } from '../impl/State';
import { StatusRequestImpl } from '../impl/StatusRequestImpl';
import { PayloadData } from './PayloadData';

/**
 * Responsible for building and sending payloads to the beacon.
 */
export class PayloadSender {
    private readonly logger: Logger;
    private readonly state: State;
    private readonly channel: CommunicationChannel;
    private readonly payloadData: PayloadData;

    private flushing = false;

    constructor(state: State, payloadData: PayloadData) {
        this.logger = state.config.loggerFactory.createLogger('PayloadSender');
        this.state = state;
        this.channel = state.config.communicationChannel;
        this.payloadData = payloadData;
    }

    /**
     * Triggers flushing all data in the payload queue.
     *
     * Multiple calls trigger it only once at a time and return immediately.
     */
    public flush(): void {
        if (this.flushing) {
            return;
        }
        this.flushing = true;

        this.sendPayloads().then(
            () => this.flushing = false,
        );
    }

    private async sendPayloads(): Promise<void> {
        while (this.state.isCaptureDisabled() === false && this.payloadData.hasPayloadsLeft()) {
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
            this.logger.warn('Failed to send payload data with exception', exception);
            response = defaultInvalidStatusResponse;
        }

        if (response.valid) {
            this.state.updateFromResponse(response);
        } else {
            this.state.disableCapture();
        }
    }
}
