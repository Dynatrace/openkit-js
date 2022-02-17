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
import { HttpResponse } from './HttpClient';

export abstract class HttpStatusResponseBase implements StatusResponse {
    public captureCrashes: CaptureMode | undefined;
    public captureErrors: CaptureMode | undefined;
    public captureMode: CaptureMode | undefined;
    public maxBeaconSizeInKb: number | undefined;
    public multiplicity: number | undefined;
    public serverId: number | undefined;

    public valid = true;

    protected readonly logger: Logger;

    constructor(response: HttpResponse, loggerFactory: LoggerFactory) {
        this.logger = loggerFactory.createLogger('HttpStatusResponse');

        if (response.status !== 200) {
            this.valid = false;
            this.logger.debug('Invalid response status:', response.status);

            return;
        }

        this.parsePayload(response.payload);
    }

    protected abstract parsePayload(payload: string): void;
}
