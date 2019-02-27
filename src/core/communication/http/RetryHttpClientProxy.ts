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

import { timeout } from '../../utils/Utils';
import { defaultInvalidHttpResponse, HttpClient, HttpResponse } from './HttpClient';

/**
 * Proxy for any http client to retry multiple times with timeouts in between.
 */
export class RetryHttpClientProxy implements HttpClient {
    /**
     * Creates a new RetryHttpClientProxy
     *
     * @param proxy The httpClient which should be proxied. The methods might be called multiple times.
     * @param timeouts The timeouts in milliseconds which should be used if a request failed.
     */
    constructor(
        private readonly proxy: HttpClient,
        private readonly timeouts: number[] = [2000, 5000],
    ) {}

    /**
     * @inheritDoc
     */
    public get(url: string): Promise<HttpResponse> {
        return this.retry(() => {
            return this.proxy.get(url);
        });
    }

    /**
     * @inheritDoc
     */
    public post(url: string, payload: string): Promise<HttpResponse> {
        return this.retry(() => {
            return this.proxy.post(url, payload);
        });
    }

    private async retry(callback: () => Promise<HttpResponse>): Promise<HttpResponse> {
        let response: HttpResponse = await this.tryExecute(callback);

        // As long as the status is not 200, and we have timeouts left, retry
        for (let i = 0; i < this.timeouts.length && response.status !== 200; i++) {

            // Wait some milliseconds before retrying
            await timeout(this.timeouts[i]);

            response = await this.tryExecute(callback);
        }

        return response;
    }

    private async tryExecute(callback: () => Promise<HttpResponse>): Promise<HttpResponse> {
        try {
            // We have to await here, in case the promise throws an exception
            return await callback();
        } catch {
            return defaultInvalidHttpResponse;
        }
    }
}
