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
 * Represents a status request which should be send to the server.
 */
export interface StatusRequest {
    /**
     * The server id where the request should be send to.
     */
    readonly serverId: number;

    /**
     * The id of the current custom application
     */
    readonly applicationId: string;

    /**
     * The current OpenKit version.
     */
    readonly openKitVersion: string;

    /**
     * The platformType.
     */
    readonly platformType: number;

    /**
     * The agent technology type.
     */
    readonly agentTechnologyType: string;

    /**
     * Timestamp (ms since 1970) of current configuration used by the agent.
     * 0 ms when no configuration was yet received.
     */
    readonly timestamp: number;
}
