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

import { CommunicationChannel } from '../../../api/communication/CommunicationChannel';
import { CommunicationChannelFactory } from '../../../api/communication/CommunicationChannelFactory';
import { LoggerFactory } from '../../../api/logging/LoggerFactory';
import { AxiosHttpClient } from './AxiosHttpClient';
import { Http429ClientProxy } from './Http429ClientProxy';
import { HttpClient } from './HttpClient';
import { HttpCommunicationChannel } from './HttpCommunicationChannel';
import { RetryHttpClientProxy } from './RetryHttpClientProxy';

export class HttpCommunicationChannelFactory implements CommunicationChannelFactory {
    private readonly channel: HttpCommunicationChannel;

    constructor(
        loggerFactory: LoggerFactory,
        client: HttpClient = new RetryHttpClientProxy(new Http429ClientProxy(new AxiosHttpClient(loggerFactory))),
    ) {
        this.channel = new HttpCommunicationChannel(client, loggerFactory);
    }

    public getCommunicationChannel(loggerFactory: LoggerFactory): CommunicationChannel {
        return this.channel;
    }
}
