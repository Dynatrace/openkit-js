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
 * Status of configuration
 */
export enum Status {
    Error = 'ERROR',
    Ok = 'OK',
}

/**
 * Represents a status response from dynatrace which will update the state of the current OpenKit application.
 */
export interface StatusResponseJson {
    /**
     * Open Kit related configuration
     */
    readonly mobileAgentConfig?: MobileAgentConfig;

    /**
     * Application related configuration
     */
    readonly appConfig?: AppConfig;

    /**
     * Dynamic configuration
     */
    readonly dynamicConfig?: DynamicConfig;

    /**
     * timestamp of this configuration
     */
    readonly timestamp?: number;
}

export interface MobileAgentConfig {
    /**
     * The maximum beacon size in kilobyte.
     */
    readonly maxBeaconSizeKb?: number;
}

export interface AppConfig {
    /**
     * If capture = Off, all communication should be stopped and no further communication is allowed.
     */
    readonly capture?: number;

    /**
     * Flag if errors should be captured.
     */
    readonly reportErrors?: number;

    /**
     * Flag if crashes should be captured.
     */
    readonly reportCrashes?: number;

    /**
     * The application which this configuration applies to.
     */
    readonly applicationId?: string;
}

export interface DynamicConfig {
    /**
     * The server id where the next request should be send to.
     */
    readonly serverId?: number;

    /**
     * The multiplicity which should be send back to the server.
     */
    readonly multiplicity?: number;

    /**
     * status of configuration request "OK" or "ERROR"
     */
    readonly status?: Status;
}
