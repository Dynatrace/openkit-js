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
 *
 */

import {HttpResponse} from './HttpResponse';

const debug = (...args: any[]) => {
    console.debug('[HttpClient]', ...args);
};

export class HttpClient {

    public async send(url: string, payload?: string): Promise<HttpResponse> {
        debug('Sending request', {url, payload});

        const result = await fetch(url, HttpClient.getOptions(payload));
        const body = await result.text();

        const response = new HttpResponse(result.status, result.headers, body);

        debug('Finished request, response:', response);

        return response;
    }

    private static getOptions(payload?: string) {
        if (payload === undefined) {
            return {};
        }

        return {
            method: 'POST',
            body: payload,
        };
    }
}
