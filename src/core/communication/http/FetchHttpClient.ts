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

import { Logger, LoggerFactory } from '../../../api';
import { openKitVersion } from '../../PlatformConstants';
import { HttpClient, HttpResponse } from './HttpClient';

export class FetchHttpClient implements HttpClient {
    private readonly logger: Logger;

    constructor(loggerFactory: LoggerFactory) {
        this.logger = loggerFactory.createLogger('FetchHttpClient');
    }

    public async get(url: string): Promise<HttpResponse> {
        this.logger.debug('GET', url);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'OpenKit/' + openKitVersion,
            },
        });

        return this.parseFetchResponse(response);
    }

    public async post(url: string, payload: string): Promise<HttpResponse> {
        this.logger.debug('POST', url, payload);

        const response = await fetch(url, {
            method: 'POST',
            body: payload,
            headers: {
                'User-Agent': 'OpenKit/' + openKitVersion,
            },
        });

        return this.parseFetchResponse(response);
    }

    private async parseFetchResponse(
        response: Response,
    ): Promise<HttpResponse> {
        const responseString = await response.text();

        this.logger.debug('RESPONSE', {
            status: response.status,
            payload: responseString,
        });

        const headers: Record<string, string> = {};

        Object.entries(response.headers).forEach(([key, value]) => {
            if (value != null) {
                headers[key] = value.toString();
            }
        });

        return {
            status: response.status,
            payload: responseString,
            headers,
        };
    }
}
