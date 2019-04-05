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

/**
 * Flag to check if capturing for certain parts is enabled or not.
 */
export enum CaptureMode {
    On = 1,
    Off = 0,
}

/**
 * Represents a status response from dynatrace which will update the state of the current OpenKit application.
 */
export interface StatusResponse {
    /**
     * If captureMode = Off, all communication should be stopped and no further communication is allowed.
     */
    readonly captureMode?: CaptureMode;

    /**
     * The server id where the next request should be send to.
     */
    readonly serverId?: number;

    /**
     * The maximum beacon size in kilobyte.
     */
    readonly maxBeaconSizeInKb?: number;

    /**
     * Flag if errors should be captured.
     */
    readonly captureErrors?: CaptureMode;

    /**
     * Flag if crashes should be captured.
     */
    readonly captureCrashes?: CaptureMode;

    /**
     * The multiplicity which should be send back to the server.
     */
    readonly multiplicity?: number;

    /**
     * Flag if the response is valid. If it is not, all communication stops immediately for the current session.
     */
    readonly valid: boolean;
}

export const defaultInvalidStatusResponse: StatusResponse = { valid: false };
