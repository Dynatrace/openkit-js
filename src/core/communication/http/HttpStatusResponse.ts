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
    CaptureMode,
    Logger,
    LoggerFactory,
    StatusResponse,
} from '../../../api';
import { ResponseKey } from '../../protocol/ResponseKey';
import { PayloadDecoder } from '../../utils/PayloadDecoder';
import { HttpResponse } from './HttpClient';

const parsePositiveInt = (str: string, defaultValue: number): number => {
    const parsed = parseInt(str, 10);

    return parsed >= 0 ? parsed : defaultValue;
};

export class HttpStatusResponse implements StatusResponse {
    public captureCrashes: CaptureMode | undefined;
    public captureErrors: CaptureMode | undefined;
    public captureMode: CaptureMode | undefined;
    public maxBeaconSizeInKb: number | undefined;
    public multiplicity: number | undefined;
    public serverId: number | undefined;

    public valid = true;

    private readonly logger: Logger;

    constructor(response: HttpResponse, loggerFactory: LoggerFactory) {
        this.logger = loggerFactory.createLogger('HttpStatusResponse');

        if (response.status !== 200) {
            this.valid = false;
            this.logger.debug('Invalid response status:', response.status);

            return;
        }

        const entries = new PayloadDecoder(response.payload).getEntries();
        if (entries.type !== 'm') {
            this.valid = false;
            this.logger.debug('Invalid response type:', entries.type);

            return;
        }

        this.decodeEntries(entries);
    }

    private decodeEntries(entries: Readonly<Record<string, string>>): void {
        Object.keys(entries).forEach((key) =>
            this.decodeEntry(key, entries[key]),
        );
    }

    private decodeEntry(key: string, value: string): void {
        switch (key) {
            case ResponseKey.Capture:
                // 1 is on, 0 is off. If another value is passed, we disable it to be on the safe side.
                this.captureMode =
                    value === '1' ? CaptureMode.On : CaptureMode.Off;
                break;

            case ResponseKey.CaptureCrashes:
                // 1 (always on) and 2 (only on WiFi) are treated the same
                this.captureCrashes =
                    value === '1' ? CaptureMode.On : CaptureMode.Off;
                break;

            case ResponseKey.CaptureErrors:
                // 1 (always on) and 2 (only on WiFi) are treated the same
                this.captureErrors =
                    value === '1' ? CaptureMode.On : CaptureMode.Off;
                break;

            case ResponseKey.MaxBeaconSize:
                this.maxBeaconSizeInKb = parsePositiveInt(value, 0);
                break;

            case ResponseKey.Multiplicity:
                this.multiplicity = parsePositiveInt(value, 0);
                break;

            case ResponseKey.ServerId:
                this.serverId = parsePositiveInt(value, 1);
                break;
        }
    }
}
