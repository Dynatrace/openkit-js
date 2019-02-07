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
 *
 */

export enum HttpStatus {
    OK = 200,
    UNKNOWN = -1,
}

export const parsePayload = (body: string): {[key: string]: string} => {
    const pairs: {[key: string]: string} = {};

    body
        .split('&')
        .map((entry) => entry.split('=') as [string, string])
        .forEach((pair: [string, string]) => pairs[pair[0]] = pair[1]);

    return pairs;
};

export class HttpResponse {
    private readonly _statusCode: number;
    private readonly _values: {[key: string]: string};

    constructor(statusCode: number, body: string) {
        this._statusCode = statusCode;
        this._values = parsePayload(body);
    }

    public getStatus(): HttpStatus {
        switch (this._statusCode) {
            case HttpStatus.OK: return HttpStatus.OK;
            default: return HttpStatus.UNKNOWN;
        }
    }

    public getValues(): Readonly<{[key: string]: string}> {
        return this._values;
    }
}
