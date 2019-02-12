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
 *
 */

import { HttpClient } from '../../api/http/HttpClient';
import { agentTechnologyType, openKitVersion, platformTypeOpenKit } from '../../PlatformConstants';
import { State } from '../impl/State';
import { QueryKey } from '../protocol/QueryKey';
import { UrlBuilder } from './builder/UrlBuilder';
import { StatusResponse } from './StatusResponse';

/**
 * Wrapper class for the {@see HttpClient}.
 * It abstracts the calls the the HttpClient, which then sends the actual requests to the server.
 */
export class BeaconSender {
    private readonly http: HttpClient;
    private readonly state: State;

    /**
     * Creates the BeaconSender.
     * @param state The State of the Object which wants to send data.
     */
    constructor(state: State) {
        this.state = state;
        this.http = state.config.httpClient;
    }

    /**
     * Sends a status request to the server.
     *
     * @returns The {@see StatusResponse} from the server.
     */
    public async sendStatusRequest(): Promise<StatusResponse> {
        const monitorUrl = this.buildMonitorUrlQueries().build();
        const response = await this.http.sendStatusRequest(monitorUrl);

        return new StatusResponse(response);
    }

    /**
     * Sends a new session request to the server.
     *
     * @returns The {@see StatusResponse} for the new session.
     */
    public async sendNewSessionRequest(): Promise<StatusResponse> {
        const monitorUrl = this.buildMonitorUrlQueries()
            .add(QueryKey.NewSession, 1)
            .build();

        const response = await this.http.sendStatusRequest(monitorUrl);

        return new StatusResponse(response);
    }

    /**
     * Sends a payload to the server.
     *
     * @param payload The payload to send in UTF8-encoding.
     * @returns The {@see StatusResponse} for the request.
     */
    public async sendPayload(payload: string): Promise<StatusResponse> {
        const monitorUrl = this.buildMonitorUrlQueries().build();
        const response = await this.http.sendPayloadData(monitorUrl, payload);

        return new StatusResponse(response);
    }

    private buildMonitorUrlQueries(): UrlBuilder {
        return new UrlBuilder(this.state.config.beaconURL)
            .add(QueryKey.Type, 'm')
            .add(QueryKey.ServerId, this.state.serverId)
            .add(QueryKey.Application, this.state.config.applicationId)
            .add(QueryKey.Version, openKitVersion)
            .add(QueryKey.PlatformType, platformTypeOpenKit)
            .add(QueryKey.AgentTechnologyType, agentTechnologyType);
    }
}
