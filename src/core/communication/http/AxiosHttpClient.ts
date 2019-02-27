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

import Axios, { AxiosResponse } from 'axios';
import { createLogger } from '../../utils/Logger';
import { HttpClient, HttpResponse } from './HttpClient';

const log = createLogger('AxiosHttpClient');

export class AxiosHttpClient implements HttpClient {
    public async get(url: string): Promise<HttpResponse> {
        log.debug('GET', url);
        const response = await Axios.get<string>(url);

        return this.parseAxiosResponse(response);
    }

    public async post(url: string, payload: string): Promise<HttpResponse> {
        log.debug('POST', url, payload);
        const response = await Axios.post<string>(url, payload);

        return this.parseAxiosResponse(response);
    }

    private parseAxiosResponse(response: AxiosResponse<string>): HttpResponse {
        log.debug('RESPONSE', {status: response.status, payload: response.data});

        return {
            status: response.status,
            payload: response.data,
        };
    }
}
