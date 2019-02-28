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

import { defaultTimestampProvider, TimestampProvider } from '../../provider/TimestampProvider';
import { timeout } from '../../utils/Utils';
import { HttpClient, HttpResponse } from './HttpClient';

const httpTooManyRequests = 429;
const headerKeyRetryAfter = 'retry-after';
const defaultRetryAfterInMilliseconds = 600000; // 10 * 60 * 1000;

export class Http429ClientProxy implements HttpClient {
    private timeoutUntil: number = -1;

    constructor(
        private readonly proxy: HttpClient,
        private readonly timestampProvider: TimestampProvider = defaultTimestampProvider,
    ) {}

    public get(url: string): Promise<HttpResponse> {
        return this.execute(() => this.proxy.get(url));
    }

    public post(url: string, payload: string): Promise<HttpResponse> {
        return this.execute(() => this.proxy.post(url, payload));
    }

    private async execute(callback: () => Promise<HttpResponse>): Promise<HttpResponse> {
        if (this.timeoutUntil === -1) {
            const response = await callback();

            if (response.status === httpTooManyRequests) {
                const retryTimeout = this.parseRetryHeader(response.headers);

                this.timeoutUntil = this.timestampProvider.getCurrentTimestamp() + retryTimeout;

                return this.retry(() => this.execute(callback));
            }

            return response;
        }

        return this.retry(() => this.execute(callback));
    }

    private getTimeoutLeft(): number {
        return this.timeoutUntil - this.timestampProvider.getCurrentTimestamp();
    }

    private async retry(callback: () => Promise<HttpResponse>): Promise<HttpResponse> {
        await timeout(this.getTimeoutLeft());

        this.timeoutUntil = -1;

        return callback();
    }

    private parseRetryHeader(headers: Record<string, string>): number {
        const value = headers[headerKeyRetryAfter];

        const retryTimeout = parseInt(value, 10) * 1000;

        return isNaN(retryTimeout) ? defaultRetryAfterInMilliseconds : retryTimeout;
    }
}
