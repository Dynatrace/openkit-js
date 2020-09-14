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

import { StatusRequest } from './StatusRequest';
import { StatusResponse } from './StatusResponse';

/**
 * Interface for the communication between OpenKit and Dynatrace.
 */
export interface CommunicationChannel {
    /**
     * Send a status request to the dynatrace server.
     *
     * @param url The url for the active gate.
     * @param request The request parameters for the status request.
     * @returns A status response.
     */
    sendStatusRequest(
        url: string,
        request: StatusRequest,
    ): Promise<StatusResponse>;

    /**
     * Send a new session request to the dynatrace server.
     *
     * @param url The url for the active gate.
     * @param request The request parameters for the status request.
     * @returns A status response
     */
    sendNewSessionRequest(
        url: string,
        request: StatusRequest,
    ): Promise<StatusResponse>;

    /**
     * Send payload data to the dynatrace server.
     *
     * @param url The url for the active gate.
     * @param request The request parameters for the status request.
     * @param query The query which should be send to the server.
     * @returns A status response.
     */
    sendPayloadData(
        url: string,
        request: StatusRequest,
        query: string,
    ): Promise<StatusResponse>;
}
