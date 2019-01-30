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

import {agentTechnologyType, openKitVersion, platformTypeOpenKit} from '../../PlatformConstants';
import {OpenKitState} from '../OpenKitState';
import {HttpClient} from '../http/HttpClient';
import {QueryBuilder} from '../QueryBuilder';
import {StatusResponse} from './StatusResponse';

export const enum QueryKey {
    Type = 'type',
    ServerId = 'srvid',
    Application = 'app',
    Version = 'va',
    PlatformType = 'pt',
    AgentTechnologyType = 'tt',
}

export class BeaconSender {
    private readonly http: HttpClient;
    private readonly state: OpenKitState;

    constructor(state: OpenKitState) {
        this.http = new HttpClient();
        this.state = state;
    }

    public async sendStatusRequest(): Promise<StatusResponse> {
        const response = await this.http.send(this.buildMonitorURL());

        return new StatusResponse(response);
    }

    private buildMonitorURL() {
        return new QueryBuilder()
            .add(QueryKey.Type, 'm')
            .add(QueryKey.ServerId, this.state.serverId)
            .add(QueryKey.Application, this.state.config.applicationId)
            .add(QueryKey.Version, openKitVersion)
            .add(QueryKey.PlatformType, platformTypeOpenKit)
            .add(QueryKey.AgentTechnologyType, agentTechnologyType)
            .buildUrl(this.state.config.beaconURL);
    }
}
