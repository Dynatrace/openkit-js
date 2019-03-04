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
import { LoggerFactory } from '../../../api/logging/LoggerFactory';
import { Logger } from './../../../api/logging/Logger';
import { HttpClient } from './HttpClient';

export interface HttpResponse {
    status: number;
    payload: string;
}

export class AxiosHttpClient implements HttpClient {
    private readonly logger: Logger;

    constructor(loggerFactory: LoggerFactory) {
        this.logger = loggerFactory.createLogger('AxiosHttpClient');
    }

    public async get(url: string): Promise<HttpResponse> {
        this.logger.debug('GET', url);
        const response = await Axios.get<string>(url);

        return this.parseAxiosResponse(response);
    }

    public async post(url: string, payload: string): Promise<HttpResponse> {
        this.logger.debug('POST', url, payload);
        const response = await Axios.post<string>(url, payload);

        return this.parseAxiosResponse(response);
    }

    private parseAxiosResponse(response: AxiosResponse<string>): HttpResponse {
        this.logger.debug('RESPONSE', {status: response.status, payload: response.data});

        return {
            status: response.status,
            payload: response.data,
        };
    }
}
