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

import { CommunicationChannel, Logger, LoggerFactory, StatusRequest, StatusResponse } from '../../../../api';
import { HttpClient } from '../HttpClient';
import { SendingState } from './SendingState';
import { StateContext } from './StateContext';

export class HttpCommunicationChannel implements CommunicationChannel {
    private readonly context: StateContext;
    private readonly logger: Logger;

    private state: CommunicationChannel;

    constructor(client: HttpClient, loggerFactory: LoggerFactory) {

        this.logger = loggerFactory.createLogger('HttpCommunicationChannel');

        this.context = {
            stateMachine: this,
            loggerFactory,
            client,
        };

        this.state = new SendingState(this.context);
    }

    public sendNewSessionRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return this.state.sendNewSessionRequest(url, request);
    }

    public sendPayloadData(url: string, request: StatusRequest, query: string): Promise<StatusResponse> {
        return this.state.sendPayloadData(url, request, query);
    }

    public async sendStatusRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return this.state.sendStatusRequest(url, request);
    }

    public setNextState(channel: CommunicationChannel): void {
        this.state = channel;
    }
}
