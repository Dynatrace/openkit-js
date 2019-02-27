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

import { anyString, spy, verify } from 'ts-mockito';
import { CommunicationChannel } from '../../../../src/api/communication/CommunicationChannel';
import { StatusRequest } from '../../../../src/api/communication/StatusRequest';
import { HttpResponse } from '../../../../src/core/communication/http/AxiosHttpClient';
import { HttpClient } from '../../../../src/core/communication/http/HttpClient';
import { HttpCommunicationChannel } from '../../../../src/core/communication/http/HttpCommunicationChannel';
import { defaultNullLoggerFactory } from '../../../../src/core/logging/NullLoggerFactory';

const request: StatusRequest = {
    serverId: 5,
    platformType: 1,
    openKitVersion: '1.0',
    applicationId: '2.0',
    agentTechnologyType: 'okjs',
};

class StubHttpClient implements HttpClient {
    public async get(url: string): Promise<HttpResponse> {
        return {status: 200, payload: 'type=m'};
    }

    public async post(url: string, payload: string): Promise<HttpResponse> {
        return {status: 200, payload: 'type=m'};
    }
}

describe('HttpCommunicationChannel', () => {
    let channel: CommunicationChannel;
    let clientSpy: HttpClient;

    beforeEach(() => {
        const client = new StubHttpClient();
        clientSpy = spy(client);
        channel = new HttpCommunicationChannel(client, defaultNullLoggerFactory);
    });

    describe('sendPayloadData', () => {
        it('should redirect the request to httpclient GET', async() => {
            await channel.sendStatusRequest('https://example.com', request);

            verify(clientSpy.get(anyString())).once();
        });
    });

    describe('sendNewSessionRequest', () => {
        it('should redirect the request to httpclient GET', async() => {
            await channel.sendNewSessionRequest('https://example.com', request);

            verify(clientSpy.get(anyString())).once();
        });
    });

    describe('sendStatusRequest', () => {
        it('should redirect the request to httpclient GET', async() => {
            await channel.sendPayloadData('https://example.com', request, 'payload=data');

            verify(clientSpy.post(anyString(), 'payload=data')).once();
        });
    });
});

