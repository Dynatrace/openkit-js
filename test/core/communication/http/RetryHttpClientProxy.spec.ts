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
import { HttpClient, HttpResponse } from '../../../../src/core/communication/http/HttpClient';
import { RetryHttpClientProxy } from '../../../../src/core/communication/http/RetryHttpClientProxy';

class HttpClientStub implements HttpClient {
    public async get(url: string): Promise<HttpResponse> {
        return {status: 200, payload: ''};
    }

    public async post(url: string, payload: string): Promise<HttpResponse> {
        return {status: 200, payload: ''};
    }
}

const invalidHttpResponse: HttpResponse = { status: 400, payload: '' };
const validHttpResponse: HttpResponse = { status: 200, payload: '' };

describe('RetryHttpClientProxy', () => {
    let httpClientMock: HttpClient = mock(HttpClientStub);

    beforeEach(() => {
        reset(httpClientMock);
    });

    describe('GET', () => {
        it('should not retry if a valid response is returned', async() => {
            // given
            when(httpClientMock.get(anything())).thenResolve(validHttpResponse);
            const client = instance(httpClientMock);
            const retryClient: HttpClient = new RetryHttpClientProxy(client, [0, 0]);

            // when
            const response = await retryClient.get('https://example.com');

            // then
            verify(httpClientMock.get('https://example.com')).once();
            expect(response.status).toBe(200);
        });

        it('should call multiple times if the response is not valid', async() => {
            // given
            when(httpClientMock.get(anything())).thenReturn(
                Promise.resolve(invalidHttpResponse),
                Promise.resolve(validHttpResponse)
            );
            const client = instance(httpClientMock);
            const retryClient: HttpClient = new RetryHttpClientProxy(client, [0, 0]);

            // when
            const response = await retryClient.get('https://example.com');

            // then
            verify(httpClientMock.get(anyString())).twice();
            expect(response.status).toBe(200);
        });

        it('should call multiple times if the proxied client throws an exception', async() => {
            // given
            when(httpClientMock.get(anything())).thenReturn(
                new Promise(() => { throw new Error('Some generic error'); }),
                Promise.resolve(validHttpResponse)
            );
            const client = instance(httpClientMock);
            const retryClient: HttpClient = new RetryHttpClientProxy(client, [0, 0]);

            // when
            const response = await retryClient.get('https://example.com');

            // then
            verify(httpClientMock.get('https://example.com')).twice();
            expect(response.status).toBe(200);
        });

        it('should return an invalid response, after all retries failed', async() => {
            // given
            when(httpClientMock.get(anything())).thenResolve({status: 404, payload: ''});
            const client = instance(httpClientMock);
            const retryClient: HttpClient = new RetryHttpClientProxy(client, [0, 0]);

            // when
            const response = await retryClient.get('https://example.com');

            // then
            verify(httpClientMock.get('https://example.com')).thrice();
            expect(response.status).toBe(404);
        });

        it('should use the timeouts to wait between requests', async() => {
            // given
            when(httpClientMock.get(anything())).thenReturn(
                Promise.resolve(invalidHttpResponse),
                Promise.resolve(validHttpResponse)
            );
            const client = instance(httpClientMock);
            const retryClient: HttpClient = new RetryHttpClientProxy(client, [500, 1000]);

            // when
            const startTime = new Date().getTime();
            const response = await retryClient.get('https://example.com');
            const timeNeeded = new Date().getTime() - startTime;

            // then
            verify(httpClientMock.get('https://example.com')).twice();
            expect(response.status).toBe(200);
            expect(timeNeeded).not.toBeLessThan(500);
        });
    });

    describe('POST', () => {
        it('should not retry if a valid response is returned', async() => {
            // given
            when(httpClientMock.post(anything(), anything())).thenResolve(validHttpResponse)
            const client = instance(httpClientMock);
            const retryClient: HttpClient = new RetryHttpClientProxy(client, [0, 0]);

            // when
            const response = await retryClient.post('https://example.com', 'somePayload');

            // then
            verify(httpClientMock.post('https://example.com', 'somePayload')).once();
            expect(response.status).toBe(200);
        });

        it('should call multiple times if the response is not valid', async() => {
            // given
            when(httpClientMock.post(anything(), anything())).thenReturn(
                Promise.resolve(invalidHttpResponse),
                Promise.resolve(validHttpResponse)
            );
            const client = instance(httpClientMock);
            const retryClient: HttpClient = new RetryHttpClientProxy(client, [0, 0]);

            // when
            const response = await retryClient.post('https://example.com', 'somePayload');

            // then
            verify(httpClientMock.post('https://example.com', 'somePayload')).twice();
            expect(response.status).toBe(200);
        });

        it('should call multiple times if the proxied client throws an exception', async() => {
            // given
            when(httpClientMock.post(anything(), anything())).thenReturn(
                new Promise(() => { throw new Error('Some generic error'); }),
                Promise.resolve(validHttpResponse)
            );
            const client = instance(httpClientMock);
            const retryClient: HttpClient = new RetryHttpClientProxy(client, [0, 0]);

            // when
            const response = await retryClient.post('https://example.com', 'somePayload');

            // then
            verify(httpClientMock.post('https://example.com', 'somePayload')).twice();
            expect(response.status).toBe(200);
        });

        it('should return an invalid response, after all retries failed', async() => {
            // given
            when(httpClientMock.post(anything(), anything())).thenResolve({status: 404, payload: ''});
            const client = instance(httpClientMock);
            const retryClient: HttpClient = new RetryHttpClientProxy(client, [0, 0]);

            // when
            const response = await retryClient.post('https://example.com', 'somePayload');

            // then
            verify(httpClientMock.post('https://example.com', 'somePayload')).thrice();
            expect(response.status).toBe(404);
        });

        it('should use the timeouts to wait between requests', async() => {
            // given
            when(httpClientMock.post(anything(), anything())).thenReturn(
                Promise.resolve(invalidHttpResponse),
                Promise.resolve(validHttpResponse)
            );
            const client = instance(httpClientMock);
            const retryClient: HttpClient = new RetryHttpClientProxy(client, [500, 1000]);

            // when
            const startTime = new Date().getTime();
            const response = await retryClient.post('https://example.com', 'somePayload');
            const timeNeeded = new Date().getTime() - startTime;

            // then
            verify(httpClientMock.post('https://example.com', 'somePayload')).twice();
            expect(response.status).toBe(200);
            expect(timeNeeded).not.toBeLessThan(500);
        });
    });

    describe('defaults', () => {
       it('sets the correct default timeouts of 2s and 5s', () => {
          const client = new RetryHttpClientProxy(new HttpClientStub());
          const timeouts = (client as any).timeouts;

          expect(timeouts).toEqual([2000, 5000]);
       });
    });
});
