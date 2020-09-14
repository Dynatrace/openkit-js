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
    CommunicationChannel,
    StatusRequest,
    StatusResponse,
} from '../../../../api';
import { timeout } from '../../../utils/Utils';
import { defaultInvalidHttpResponse, HttpResponse } from '../HttpClient';
import { HttpStatusResponse } from '../HttpStatusResponse';
import { buildHttpUrl } from '../HttpUrlBuilder';
import { OverloadPreventionState } from './OverloadPreventionState';
import { StateContext } from './StateContext';

const timeouts = [1000, 2000];
const httpTooManyRequests = 429;

export class SendingState implements CommunicationChannel {
    constructor(private readonly context: StateContext) {}

    public async sendNewSessionRequest(
        url: string,
        request: StatusRequest,
    ): Promise<StatusResponse> {
        const httpUrl = buildHttpUrl(url, request, true);

        return this.retry(() => this.context.client.get(httpUrl));
    }

    public async sendPayloadData(
        url: string,
        request: StatusRequest,
        query: string,
    ): Promise<StatusResponse> {
        const httpUrl = buildHttpUrl(url, request, false);

        return this.retry(() => this.context.client.post(httpUrl, query));
    }

    public async sendStatusRequest(
        url: string,
        request: StatusRequest,
    ): Promise<StatusResponse> {
        const httpUrl = buildHttpUrl(url, request, false);

        return this.retry(() => this.context.client.get(httpUrl));
    }

    /**
     * Retry the current request multiple times, and wait between retries.
     * If a status response with code 429 comes, change into the http429 - state.
     *
     * @param callback
     */
    private async retry(
        callback: () => Promise<HttpResponse>,
    ): Promise<StatusResponse> {
        {
            let response: HttpResponse;
            let i = -1;

            do {
                if (i !== -1) {
                    // Wait some milliseconds before retrying
                    await timeout(timeouts[i]);
                }

                response = await this.tryExecute(callback);

                if (response.status === httpTooManyRequests) {
                    return this.handleHttpToManyRequests(response);
                }

                i++;
            } while (response.status !== 200 && i < timeouts.length);

            return new HttpStatusResponse(response, this.context.loggerFactory);
        }
    }

    private handleHttpToManyRequests(response: HttpResponse): StatusResponse {
        this.context.stateMachine.setNextState(
            new OverloadPreventionState(this.context, response),
        );

        // Return a valid response, but do not disable capturing, because this would shutdown the complete session,
        // and could not recover
        return { valid: true };
    }

    private async tryExecute(
        callback: () => Promise<HttpResponse>,
    ): Promise<HttpResponse> {
        try {
            // We have to await here, in case the promise throws an exception
            return await callback();
        } catch {
            return defaultInvalidHttpResponse;
        }
    }
}
