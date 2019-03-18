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
import { Configuration } from '../config/Configuration';
import { State } from './State';

const defaultServerId = 1;
const defaultMaxBeaconSize = 30720; // 30 * 1024
const defaultMultiplicity = 1;
const defaultCaptureErrors = CaptureMode.On;
const defaultCrashReportingMode = CaptureMode.On;

export class StateImpl implements State {
    public readonly config: Readonly<Configuration>;

    public serverId: number = defaultServerId;
    public maxBeaconSize: number = defaultMaxBeaconSize;
    public multiplicity: number = defaultMultiplicity;
    public captureCrashes: CaptureMode = defaultCrashReportingMode;
    public captureErrors: CaptureMode = defaultCaptureErrors;

    private isCaptureEnabled = true;
    private serverIdLocked = false;

    constructor(config: Readonly<Configuration>) {
        this.config = config;
    }

    public setServerIdLocked(): void {
        this.serverIdLocked = true;
    }

    public isCaptureDisabled(): boolean {
        return !this.isCaptureEnabled;
    }

    public disableCapture(): void {
        this.isCaptureEnabled = false;
    }

    public clone(): State {
        const clonedState = new StateImpl(this.config);
        clonedState.updateFromState(this);

        return clonedState;
    }

    public updateFromResponse(response: StatusResponse): void {

        // Check validity
        if (response.valid === false || response.captureMode === CaptureMode.Off) {
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

        // Server id
        if (response.serverId !== undefined && this.serverIdLocked === false) {
            this.serverId = response.serverId >= 0 ? response.serverId : defaultServerId;
        }

        // Max beacon size
        if (response.maxBeaconSizeInKb !== undefined) {
            this.maxBeaconSize = response.maxBeaconSizeInKb >= 0 ? response.maxBeaconSizeInKb * 1024 : defaultMaxBeaconSize;
        }

        // Capture Errors
        if (response.captureErrors !== undefined) {
            this.captureErrors = response.captureErrors;
        }

        // Crash reporting level
        if (response.captureCrashes !== undefined) {
            this.captureCrashes = response.captureCrashes;
        }
    }

    public updateFromState(state: State): void {
        if (this.serverIdLocked === false) {
            this.serverId = state.serverId;
        }

        this.multiplicity = state.multiplicity;
        this.maxBeaconSize = state.maxBeaconSize;
    }
}
