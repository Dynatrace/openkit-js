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

import { CaptureMode, StatusResponse } from '../../api/communication/StatusResponse';
import { Configuration } from '../config/Configuration';

/**
 * Represents the state of the current OpenKit Object.
 */
export interface State {
    /**
     * Readonly reference to the OpenKit configuration
     */
    readonly config: Readonly<Configuration>;

    /**
     * The server id which should be used for the next request.
     */
    readonly serverId: number;

    /**
     * The maximum beacon size in bytes.
     */
    readonly maxBeaconSize: number;

    /**
     * The multiplicity which should be send to the server.
     */
    readonly multiplicity: number;

    /**
     * The crash reporting mode
     */
    readonly captureCrashes: CaptureMode;

    /**
     * Locks the server id so it can't change.
     */
    setServerIdLocked(): void;

    /**
     * Update the state with the values from another state.
     *
     * @param state The state which properties should be copied.
     */
    updateFromState(state: State): void;

    /**
     * Update the state with a status response.
     *
     * @param response The status response
     */
    updateFromResponse(response: StatusResponse): void;

    /**
     * Disables all capturing of data.
     */
    disableCapture(): void;

    /**
     * Checks if capturing is enabled
     */
    isCaptureDisabled(): boolean;

    /**
     * Clones the object. Does not clone whether the server id is locked or not, or if capturing is disabled.
     */
    clone(): State;
}
