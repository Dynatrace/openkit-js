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
import { HttpClient, HttpResponse } from './HttpClient';

const httpTooManyRequests = 429;
const headerKeyRetryAfter = 'retry-after';
const defaultRetryAfterInMilliseconds = 600000; // 10 * 60 * 1000ms = 10m

export class Http429ClientProxy implements HttpClient {
    constructor(
        private readonly proxy: HttpClient,
    ) {}

    public get(url: string): Promise<HttpResponse> {
        return this.execute(() => this.proxy.get(url));
    }

    public post(url: string, payload: string): Promise<HttpResponse> {
        return this.execute(() => this.proxy.post(url, payload));
    }

    private async execute(callback: () => Promise<HttpResponse>): Promise<HttpResponse> {
        const response = await callback();

        if (response.status === httpTooManyRequests) {
            const retryTimeout = this.parseRetryHeader(response.headers);

            await timeout(retryTimeout);

            return this.execute(callback);
        }

        return response;
    }

    private parseRetryHeader(headers: Record<string, string>): number {
        const value = headers[headerKeyRetryAfter];

        const retryTimeout = parseInt(value, 10) * 1000;

        return isNaN(retryTimeout) ? defaultRetryAfterInMilliseconds : retryTimeout;
    }
}
