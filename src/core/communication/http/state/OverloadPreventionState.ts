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

import { CommunicationChannel } from '../../../../api/communication/CommunicationChannel';
import { StatusRequest } from '../../../../api/communication/StatusRequest';
import { StatusResponse } from '../../../../api/communication/StatusResponse';
import { HttpResponse } from '../HttpClient';
import { SendingState } from './SendingState';
import { StateContext } from './StateContext';

const headerKeyRetryAfter = 'retry-after';
const defaultRetryAfterInMilliseconds = 600000; // 10 * 60 * 1000ms = 10m

export class OverloadPreventionState implements CommunicationChannel {
    constructor(
        private readonly context: StateContext,
        response: HttpResponse,
    ) {
        const retryAfter = this.parseRetryHeader(response.headers);

        setInterval(() => {
            context.stateMachine.setNextState(new SendingState(context));
        }, retryAfter);
    }

    public async sendNewSessionRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return { valid: true };
    }

    public async sendPayloadData(url: string, request: StatusRequest, query: string): Promise<StatusResponse> {
        return { valid: true };
    }

    public async sendStatusRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return { valid: true };
    }

    private parseRetryHeader(headers: Record<string, string>): number {
        const value = headers[headerKeyRetryAfter];

        const retryTimeout = parseInt(value, 10) * 1000;

        return isNaN(retryTimeout) ? defaultRetryAfterInMilliseconds : retryTimeout;
    }
}
