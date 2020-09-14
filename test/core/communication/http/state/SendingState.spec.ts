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

import {
    anyOfClass,
    anyString,
    anything,
    instance,
    match,
    mock,
    reset,
    verify,
    when,
} from 'ts-mockito';
import { StatusRequest } from '../../../../../src/api';
import { AxiosHttpClient } from '../../../../../src/core/communication/http/AxiosHttpClient';
import { HttpCommunicationChannel } from '../../../../../src/core/communication/http/state/HttpCommunicationChannel';
import { OverloadPreventionState } from '../../../../../src/core/communication/http/state/OverloadPreventionState';
import { SendingState } from '../../../../../src/core/communication/http/state/SendingState';
import { defaultNullLoggerFactory } from '../../../../../src/core/logging/NullLoggerFactory';

const request: StatusRequest = {
    serverId: 5,
    platformType: 1,
    openKitVersion: '1.0',
    applicationId: '2.0',
    agentTechnologyType: 'okjs',
};

describe('SendingState', () => {
    const httpCommunicationChannelMock = mock(HttpCommunicationChannel);
    const httpClient = mock(AxiosHttpClient);

    let state: SendingState;

    beforeEach(() => {
        reset(httpClient);
        reset(httpCommunicationChannelMock);

        const context = {
            stateMachine: instance(httpCommunicationChannelMock),
            client: instance(httpClient),
            loggerFactory: defaultNullLoggerFactory,
        };

        state = new SendingState(context);
    });

    it(
        'should redirect a status request to the http client ' +
            'and return the response immediately if the request was successful',
        async () => {
            // given
            when(httpClient.get(anyString())).thenResolve({
                status: 200,
                headers: {},
                payload: 'type=m',
            });

            // when
            const response = await state.sendStatusRequest(
                'https://example.com',
                request,
            );

            // then
            expect(response.valid).toBe(true);
            verify(httpClient.get(match(/^https:\/\/example\.com/))).once();
            verify(httpClient.get(anything())).once();
            verify(httpClient.post(anything(), anything())).never();
        },
    );

    it(
        'should redirect a new session request to the http client ' +
            'and return the response immediately if the request was successful',
        async () => {
            // given
            when(httpClient.get(anyString())).thenResolve({
                status: 200,
                headers: {},
                payload: 'type=m',
            });

            // when
            const response = await state.sendNewSessionRequest(
                'https://example.com',
                request,
            );

            // then
            expect(response.valid).toBe(true);
            verify(
                httpClient.get(match(/^https:\/\/example\.com.*ns=1.*/)),
            ).once();
            verify(httpClient.get(anything())).once();
            verify(httpClient.post(anything(), anything())).never();
        },
    );

    it(
        'should redirect a payload request to the http client ' +
            'and return the response immediately if the request was successful',
        async () => {
            // given
            when(httpClient.post(anyString(), anyString())).thenResolve({
                status: 200,
                headers: {},
                payload: 'type=m',
            });

            // when
            const response = await state.sendPayloadData(
                'https://example.com',
                request,
                'payloadData',
            );

            // then
            expect(response.valid).toBe(true);
            verify(
                httpClient.post(
                    match(/^https:\/\/example\.com/),
                    'payloadData',
                ),
            ).once();
            verify(httpClient.post(anything(), anything())).once();
            verify(httpClient.get(anything())).never();
        },
    );

    it('should switch to OverloadPreventionState if the request returns 429', async () => {
        // given
        when(httpClient.get(anyString())).thenResolve({
            status: 429,
            headers: {},
            payload: 'type=m',
        });

        // when
        await state.sendNewSessionRequest('https://example.com', request);

        // then
        verify(
            httpCommunicationChannelMock.setNextState(
                anyOfClass(OverloadPreventionState),
            ),
        ).once();
    });

    it(
        'should retry if a response did not return 200 or 429 ' +
            'and return the response of the second request',
        async () => {
            // given
            when(httpClient.get(anyString())).thenReturn(
                Promise.resolve({
                    status: 400,
                    headers: {},
                    payload: 'type=m',
                }),
                Promise.resolve({
                    status: 200,
                    headers: {},
                    payload: 'type=m',
                }),
            );

            // when
            const startTime = new Date().getTime();
            const response = await state.sendStatusRequest(
                'https://example.com',
                request,
            );
            const endTime = new Date().getTime() - startTime;

            // then
            expect(response.valid).toBe(true);
            expect(endTime).toBeGreaterThanOrEqual(1000);
            verify(httpClient.get(match(/^https:\/\/example\.com/))).twice();
        },
    );

    it(
        'should retry three times if a response did not return 200 or 429 ' +
            'and return the response of the third request',
        async () => {
            // given
            when(httpClient.get(anyString())).thenReturn(
                Promise.resolve({
                    status: 400,
                    headers: {},
                    payload: 'type=m',
                }),
                Promise.resolve({
                    status: 404,
                    headers: {},
                    payload: 'type=m',
                }),
                Promise.resolve({
                    status: 200,
                    headers: {},
                    payload: 'type=m',
                }),
            );

            // when
            const startTime = new Date().getTime();
            const response = await state.sendStatusRequest(
                'https://example.com',
                request,
            );
            const endTime = new Date().getTime() - startTime;

            // then
            expect(response.valid).toBe(true);
            expect(endTime).toBeGreaterThanOrEqual(3000);
            verify(httpClient.get(match(/^https:\/\/example\.com/))).thrice();
        },
    );

    it(
        'should retry three times if a response did not return 200 or 429 ' +
            'and return the response of the third request, even if it failed',
        async () => {
            // given
            when(httpClient.get(anyString())).thenReturn(
                Promise.resolve({
                    status: 400,
                    headers: {},
                    payload: 'type=m',
                }),
                Promise.resolve({
                    status: 404,
                    headers: {},
                    payload: 'type=m',
                }),
                Promise.resolve({
                    status: 404,
                    headers: {},
                    payload: 'type=m',
                }),
                Promise.resolve({
                    status: 200,
                    headers: {},
                    payload: 'type=m',
                }),
            );

            // when
            const startTime = new Date().getTime();
            const response = await state.sendStatusRequest(
                'https://example.com',
                request,
            );
            const endTime = new Date().getTime() - startTime;

            // then
            expect(endTime).toBeGreaterThanOrEqual(3000);
            expect(response.valid).toBe(false);
            verify(httpClient.get(match(/^https:\/\/example\.com/))).thrice();
        },
    );
});
