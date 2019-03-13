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

import { anyString, instance, mock, spy, verify, when } from 'ts-mockito';
import { CommunicationChannel, StatusRequest } from '../../../../src/api';
import { HttpClient, HttpResponse } from '../../../../src/core/communication/http/HttpClient';
import { HttpCommunicationChannel } from '../../../../src/core/communication/http/state/HttpCommunicationChannel';
import { OverloadPreventionState } from '../../../../src/core/communication/http/state/OverloadPreventionState';
import { SendingState } from '../../../../src/core/communication/http/state/SendingState';
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
        return {status: 200, payload: 'type=m', headers: {}};
    }

    public async post(url: string, payload: string): Promise<HttpResponse> {
        return {status: 200, payload: 'type=m', headers: {}};
    }
}

describe('HttpCommunicationChannel', () => {
    let channel: CommunicationChannel;
    let clientMock: HttpClient = mock(StubHttpClient);

    beforeEach(() => {
        channel = new HttpCommunicationChannel(instance(clientMock), defaultNullLoggerFactory);
    });

    describe('state changes', () => {
        it('should have the initial state Sending', () => {
            expect((channel as any).state).toBeInstanceOf(SendingState);
        });

        it('should switch to OverloadPreventionState if a request returns 429', async() => {
            // given
            when(clientMock.get(anyString())).thenResolve({status: 429, headers: {}, payload: ''});

            // when
            await channel.sendStatusRequest('https://example.com', request);

            // then
            expect((channel as any).state).toBeInstanceOf(OverloadPreventionState);
        });

        [400, 404, 500].forEach(status => {
            it('should not switch to OverloadPreventionState if a request returns ' + status, async() => {
                // given
                when(clientMock.get(anyString())).thenResolve({status, headers: {}, payload: ''});

                // when
                await channel.sendStatusRequest('https://example.com', request);

                // then
                expect((channel as any).state).toBeInstanceOf(SendingState);
            })
        });

        it('should switch back to SendingState after the retry timeout ran out', (done) => {
            // given
            when(clientMock.get(anyString())).thenResolve({status: 429, headers: { 'retry-after': '1'}, payload: ''});

            // when
            channel.sendStatusRequest('https://example.com', request);

            // then
            setTimeout(() => {
                // We expect it after a second to return to SendingState (+500ms margin)
                expect((channel as any).state).toBeInstanceOf(SendingState);

                done();
            }, 1500);
        });
    });

    describe('redirecting requests', () => {
        it('should redirect sendStatusRequest requests to the current state', async() => {
            // given
            when(clientMock.get(anyString())).thenResolve({status: 200, payload: 'type=m', headers: {}});
            const stateSpy = spy((channel as any).state) as CommunicationChannel;

            // when
            await channel.sendStatusRequest('https://example.com', request);

            // then
            verify(stateSpy.sendStatusRequest('https://example.com', request)).once();
        });

        it('should redirect sendStatusRequest requests to the current state', async() => {
            // given
            when(clientMock.get(anyString())).thenResolve({status: 200, payload: 'type=m', headers: {}});
            const stateSpy = spy((channel as any).state) as CommunicationChannel;

            // when
            await channel.sendNewSessionRequest('https://example.com', request);

            // then
            verify(stateSpy.sendNewSessionRequest('https://example.com', request)).once();
        });

        it('should redirect sendStatusRequest requests to the current state', async() => {
            // given
            when(clientMock.post(anyString(), anyString())).thenResolve({status: 200, payload: 'type=m', headers: {}});
            const stateSpy = spy((channel as any).state) as CommunicationChannel;

            // when
            await channel.sendPayloadData('https://example.com', request, 'query');

            // then
            verify(stateSpy.sendPayloadData('https://example.com', request, 'query')).once();
        });
    });
});
