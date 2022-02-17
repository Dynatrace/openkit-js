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

import { CaptureMode, StatusResponse } from '../../api';
import { defaultServerId } from '../PlatformConstants';
import { CommunicationState } from './CommunicationState';

const defaultMaxBeaconSize = 30720; // 30 * 1024
const defaultMultiplicity = 1;
const defaultCaptureErrors = CaptureMode.On;
const defaultCrashReportingMode = CaptureMode.On;

export class CommunicationStateImpl implements CommunicationState {
    public serverId: number = defaultServerId;
    public maxBeaconSize: number = defaultMaxBeaconSize;
    public multiplicity: number = defaultMultiplicity;
    public captureCrashes: CaptureMode = defaultCrashReportingMode;
    public captureErrors: CaptureMode = defaultCaptureErrors;
    public capture: CaptureMode = CaptureMode.On;
    public timestamp: number = 0;
    private serverIdLocked: boolean;

    constructor(private readonly applicationId: string) {
        this.serverIdLocked = false;
    }

    public setServerIdLocked(): void {
        this.serverIdLocked = true;
    }

    public disableCapture(): void {
        this.capture = CaptureMode.Off;
    }

    public updateFromResponse(response: StatusResponse): void {
        // Check validity
        if (
            response.valid === false ||
            response.captureMode === CaptureMode.Off
        ) {
            this.disableCapture();

            return;
        }

        // Multiplicity
        if (response.multiplicity !== undefined) {
            if (response.multiplicity <= 0) {
                this.disableCapture();
            } else {
                this.multiplicity = response.multiplicity;
            }
        }

        // Application Id
        if (
            response.applicationId !== undefined &&
            response.applicationId !== this.applicationId
        ) {
            this.disableCapture();
        }

        // Server id
        if (response.serverId !== undefined && this.serverIdLocked === false) {
            this.serverId =
                response.serverId >= 0 ? response.serverId : defaultServerId;
        }

        // Max beacon size
        if (response.maxBeaconSizeInKb !== undefined) {
            this.maxBeaconSize =
                response.maxBeaconSizeInKb >= 0
                    ? response.maxBeaconSizeInKb * 1024
                    : defaultMaxBeaconSize;
        }

        // Capture Errors
        if (response.captureErrors !== undefined) {
            this.captureErrors = response.captureErrors;
        }

        // Crash reporting level
        if (response.captureCrashes !== undefined) {
            this.captureCrashes = response.captureCrashes;
        }

        // Timestap
        if (response.timestamp !== undefined) {
            this.timestamp = response.timestamp;
        }
    }

    public setServerId(id: number): void {
        if (!this.serverIdLocked) {
            this.serverId = id;
        }
    }
}
