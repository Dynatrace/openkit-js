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

import { HttpResponse } from '../http/HttpClient';
import { ResponseKey } from '../protocol/ResponseKey';

export const enum CaptureMode {
    Off = 0,
    On = 1,
}

export enum HttpStatus {
    OK = 200,
    UNKNOWN = -1,
}

export const parsePayload = (body: string): Record<string, string> => {
    const pairs: {[key: string]: string} = {};

    body
        .split('&')
        .map((entry) => entry.split('=') as [string, string])
        .forEach((pair: [string, string]) => pairs[pair[0]] = pair[1]);

    return pairs;
};

/**
 * Holds the status information after a request.
 * Most of the settings can be configured in the Dynatrace UI.
 *
 * Ignored flags:
 * * si (Send Interval)
 * * cl (Capture lifecycle)
 *
 */
export class StatusResponse {
    private readonly _status: HttpStatus;

    private _captureMode?: CaptureMode;
    private _monitorName?: string;
    private _serverID?: number;
    private _maxBeaconSize?: number;
    private _captureErrors?: boolean;
    private _captureCrashes?: boolean;
    private _multiplicity?: number;

    private _valid = true;

    public get captureMode(): CaptureMode | undefined {
        return this._captureMode;
    }

    public get monitorName(): string | undefined {
        return this._monitorName;
    }

    public get serverID(): number | undefined {
        return this._serverID;
    }

    public get maxBeaconSize(): number | undefined {
        return this._maxBeaconSize;
    }

    public get captureErrors(): boolean | undefined {
        return this._captureErrors;
    }

    public get captureCrashes(): boolean | undefined {
        return this._captureCrashes;
    }

    public get multiplicity(): number | undefined {
        return this._multiplicity;
    }

    /**
     * A StatusResponse is valid, if the type=m and the status code is 200.
     */
    public get valid(): boolean {
        return this._valid;
    }

    public get status(): HttpStatus {
        return this._status;
    }

    constructor(response: Readonly<HttpResponse>) {
        this._status = response.status === 200 ? HttpStatus.OK : HttpStatus.UNKNOWN;
        this.parseResponse(response);
    }

    private parseResponse(response: Readonly<HttpResponse>): void {
        const keyValueEntries = parsePayload(response.payload);

        // tslint:disable-next-line:no-string-literal
        if (keyValueEntries['type'] !== 'm' || response.status !== HttpStatus.OK) {
            this._valid = false;
            return;
        }

        Object
            .keys(keyValueEntries)
            .forEach((key) => this.parseEntry(key, keyValueEntries[key]));
    }

    private parseEntry(key: string, value: string): void {
        switch (key) {
            case ResponseKey.Capture:
                // 1 is on, 0 is off. If another value is passed, we disable it to be on the safe side.
                this._captureMode = parseInt(value, 10) === 1 ? CaptureMode.On : CaptureMode.Off;
                break;
            case ResponseKey.CaptureCrashes:
                // 1 (always on) and 2 (only on WiFi) are treated the same
                this._captureCrashes = parseInt(value, 10) !== 0;
                break;
            case ResponseKey.CaptureErrors:
                // 1 (always on) and 2 (only on WiFi) are treated the same
                this._captureErrors = parseInt(value, 10) !== 0;
                break;
            case ResponseKey.MaxBeaconSize:
                this._maxBeaconSize = parseInt(value, 10);
                break;
            case ResponseKey.MonitorName:
                this._monitorName = value;
                break;
            case ResponseKey.Multiplicity:
                this._multiplicity = parseInt(value, 10);
                break;
            case ResponseKey.ServerId:
                this._serverID = parseInt(value, 10);
        }
    }
}
