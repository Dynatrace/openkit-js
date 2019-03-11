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
    headers: Record<string, string>;
}

export interface HttpClient {
    get(url: string): Promise<HttpResponse>;
    post(url: string, payload: string): Promise<HttpResponse>;
}

export const defaultInvalidHttpResponse: HttpResponse = { status: -1, payload: '', headers: {} };
