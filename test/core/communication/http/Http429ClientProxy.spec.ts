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

import { anyString, anything, instance, mock, reset, verify, when } from 'ts-mockito';
import { Http429ClientProxy } from '../../../../src/core/communication/http/Http429ClientProxy';
import { HttpClient, HttpResponse } from '../../../../src/core/communication/http/HttpClient';

const invalidHttpResponse: HttpResponse = { status: 400, payload: '', headers: {} };
const validHttpResponse: HttpResponse = { status: 200, payload: '', headers: {} };
const validHttpResponseWithHttp429: HttpResponse = { status: 429, payload: '', headers: { 'retry-after': '1'} };

class HttpClientStub implements HttpClient {
    public async get(url: string): Promise<HttpResponse> {
        return validHttpResponse;
    }

    public async post(url: string, payload: string): Promise<HttpResponse> {
        return validHttpResponse;
    }
}

describe('Http429ClientProxy', () => {
    describe('GET', () => {
        it('should pass the request to the client and return the response if it is 200', async() => {
            // given
            const httpClientMock: HttpClient = mock(HttpClientStub);
            when(httpClientMock.get(anyString())).thenResolve(validHttpResponse);
            const client = new Http429ClientProxy(instance(httpClientMock));

            // when
            const response = await client.get('https://example.com');

            // then
            expect(response.status).toBe(200);
            verify(httpClientMock.get('https://example.com')).once();
        });

        it('should pass the request to the client and return the response immediately if it is any other status except 429', async() => {
            // given
            const httpClientMock: HttpClient = mock(HttpClientStub);
            when(httpClientMock.get(anyString())).thenResolve(invalidHttpResponse);
            const client = new Http429ClientProxy(instance(httpClientMock));

            // when
            const response = await client.get('https://example.com');

            // then
            expect(response.status).toBe(400);
            verify(httpClientMock.get('https://example.com')).once();
        });


        it('should pass the request to the client and retry if the status = 429 and pass the header correctly with timeout=1s', async() => {
            jest.setTimeout(5000);

            // given
            const httpClientMock: HttpClient = mock(HttpClientStub);
            when(httpClientMock.get(anyString())).thenReturn(
                Promise.resolve(validHttpResponseWithHttp429),
                Promise.resolve(validHttpResponse),
            );
            const client = new Http429ClientProxy(instance(httpClientMock));

            // when
            let startTime = new Date().getTime();
            const response = await client.get('https://example.com');
            const timeDiff = new Date().getTime() - startTime;

            // then
            expect(timeDiff).toBeGreaterThanOrEqual(1000);
            expect(response.status).toBe(200);
            verify(httpClientMock.get('https://example.com')).twice();
        });

        it('should try multiple times if the responses return 429s', async() => {
            jest.setTimeout(5000);

            // given
            const httpClientMock: HttpClient = mock(HttpClientStub);
            when(httpClientMock.get(anyString())).thenReturn(
                Promise.resolve(validHttpResponseWithHttp429),
                Promise.resolve(validHttpResponseWithHttp429),
                Promise.resolve(invalidHttpResponse)
            );
            const client = new Http429ClientProxy(instance(httpClientMock));

            // when
            let startTime = new Date().getTime();
            const response = await client.get('https://example.com');
            const timeDiff = new Date().getTime() - startTime;

            // then
            expect(response.status).toBe(400);
            expect(timeDiff).toBeGreaterThanOrEqual(2000);
            verify(httpClientMock.get('https://example.com')).thrice();
            verify(httpClientMock.get(anything())).thrice();
        });
    });

    describe('POST', () => {
        it('should pass the request to the client and return the response if it is 200', async() => {
            // given
            const httpClientMock: HttpClient = mock(HttpClientStub);
            when(httpClientMock.post(anyString(), anyString())).thenResolve(validHttpResponse);
            const client = new Http429ClientProxy(instance(httpClientMock));

            // when
            const response = await client.post('https://example.com', 'somePayload');

            // then
            expect(response.status).toBe(200);
            verify(httpClientMock.post('https://example.com', 'somePayload')).once();
            verify(httpClientMock.post(anything(), anything())).once();
        });

        it('should pass the request to the client and return the response immediately if it is any other status except 429', async() => {
            // given
            const httpClientMock: HttpClient = mock(HttpClientStub);
            when(httpClientMock.post(anyString(), anyString())).thenResolve(invalidHttpResponse);
            const client = new Http429ClientProxy(instance(httpClientMock));

            // when
            const response = await client.post('https://example.com', 'somePayload');

            // then
            expect(response.status).toBe(400);
            verify(httpClientMock.post('https://example.com', 'somePayload')).once();
            verify(httpClientMock.post(anything(), anything())).once();
        });


        it('should pass the request to the client and retry if the status = 429 and pass the header correctly with timeout=1s', async() => {
            jest.setTimeout(5000);

            // given
            const httpClientMock: HttpClient = mock(HttpClientStub);
            when(httpClientMock.post(anyString(), anyString())).thenReturn(
                Promise.resolve(validHttpResponseWithHttp429),
                Promise.resolve(validHttpResponse)
            );
            const client = new Http429ClientProxy(instance(httpClientMock));

            // when
            let startTime = new Date().getTime();
            const response = await client.post('https://example.com', 'somePayload');
            const timeDiff = new Date().getTime() - startTime;

            // then
            expect(timeDiff).toBeGreaterThanOrEqual(1000);
            expect(response.status).toBe(200);
            verify(httpClientMock.post('https://example.com', 'somePayload')).twice();
            verify(httpClientMock.post(anything(), anything())).twice();
        });

        it('should try multiple times if the responses return 429s', async() => {
            jest.setTimeout(5000);

            // given
            const httpClientMock: HttpClient = mock(HttpClientStub);
            when(httpClientMock.post(anyString(), anyString())).thenReturn(
                Promise.resolve(validHttpResponseWithHttp429),
                Promise.resolve(validHttpResponseWithHttp429),
                Promise.resolve(invalidHttpResponse),
            );
            const client = new Http429ClientProxy(instance(httpClientMock));

            // when
            let startTime = new Date().getTime();
            const response = await client.post('https://example.com', 'somePayload');
            const timeDiff = new Date().getTime() - startTime;

            // then
            expect(response.status).toBe(400);
            expect(timeDiff).toBeGreaterThanOrEqual(2000);
            verify(httpClientMock.post('https://example.com', 'somePayload')).thrice();
            verify(httpClientMock.post(anything(), anything())).thrice();
        });
    });
});
