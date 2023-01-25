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
    anything,
    instance,
    mock,
    reset,
    verify,
} from 'ts-mockito';
import { StatusRequest } from '../../../../../src/api';
import { AxiosHttpClient } from '../../../../../src/core/communication/http/AxiosHttpClient';
import { HttpCommunicationChannel } from '../../../../../src/core/communication/http/state/HttpCommunicationChannel';
import { OverloadPreventionState } from '../../../../../src/core/communication/http/state/OverloadPreventionState';
import { SendingState } from '../../../../../src/core/communication/http/state/SendingState';
import { StateContext } from '../../../../../src/core/communication/http/state/StateContext';
import { NullLoggerFactory } from '../../../../../src/core/logging/NullLoggerFactory';

const request: StatusRequest = {
    serverId: 5,
    platformType: 1,
    openKitVersion: '1.0',
    applicationId: '2.0',
    agentTechnologyType: 'okjs',
    timestamp: 0,
};

describe('OverloadPreventionState', () => {
    let context: StateContext;
    const httpCommunicationChannelMock = mock(HttpCommunicationChannel);
    const httpClientMock = mock(AxiosHttpClient);

    const buildState = (ra?: string) => {
        const headers: Record<string, string> =
            ra !== undefined ? { 'retry-after': ra } : {};

        return new OverloadPreventionState(context, {
            status: 429,
            headers,
            payload: '',
        });
    };

    beforeEach(() => {
        reset(httpCommunicationChannelMock);
        reset(httpClientMock);

        context = {
            loggerFactory: new NullLoggerFactory(),
            client: instance(httpClientMock),
            stateMachine: instance(httpCommunicationChannelMock),
        };

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('should not redirect sendStatusRequest to a httpclient', async () => {
        // when
        await buildState().sendStatusRequest('https://example.com', request);

        // then
        verify(httpClientMock.get(anything())).never();
        verify(httpClientMock.post(anything(), anything())).never();
    });

    it('should not redirect sendNewSessionRequest to a httpclient', async () => {
        // when
        await buildState().sendNewSessionRequest(
            'https://example.com',
            request,
        );

        // then
        verify(httpClientMock.get(anything())).never();
        verify(httpClientMock.post(anything(), anything())).never();
    });

    it('should not redirect sendPayloadData to a httpclient', async () => {
        // when
        await buildState().sendPayloadData('https://example.com', request, '');

        // then
        verify(httpClientMock.get(anything())).never();
        verify(httpClientMock.post(anything(), anything())).never();
    });

    it('should not set another state if retry after did not time out', () => {
        jest.setTimeout(5000);

        // when
        buildState();

        // then
        setTimeout(() => {
            verify(
                httpCommunicationChannelMock.setNextState(anything()),
            ).never();
        }, 4000);
    });

    it('should set next state to sendingState if retry after did time out', () => {
        jest.setTimeout(5000);

        // when
        buildState('1'); // Switch after a second

        // then
        setTimeout(() => {
            verify(
                httpCommunicationChannelMock.setNextState(
                    anyOfClass(SendingState),
                ),
            ).once();
        }, 1500);
    });
});
