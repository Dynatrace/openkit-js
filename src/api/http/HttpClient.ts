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

export interface HttpResponse {
    status: number;
    payload: string;
}

export interface HttpClient {
    /**
     * Executes a status request to the server.
     *
     * @param url The target URL for the status request
     * @returns A Promise of a {@see HttpResponse}
     */
    sendStatusRequest(url: string): Promise<HttpResponse>;

    /**
     * Executes a HTTP POST-request to the specified url and the specified payload. Returns a {@see HttpResponse} as a
     * Promise.
     *
     * @param url The target URL for the POST-request
     * @param payload A Promise of a {@see HttpResponse}
     */
    sendPayloadData(url: string, payload: string): Promise<HttpResponse>;
}
