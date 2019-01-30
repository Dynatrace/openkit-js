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

import {defaultMaxBeaconSize, defaultServerId} from '../PlatformConstants';
import {StatusResponse} from './beacon/StatusResponse';
import {Configuration} from './config/Configuration';
import {Status} from './http/HttpResponse';

export class OpenKitState {
    private readonly _config: Readonly<Configuration>;
    public get config(): Readonly<Configuration> {
        return this._config;
    }

    private _serverId: number = defaultServerId;
    public get serverId(): number {
        return this._serverId;
    }

    private _maxBeaconSize: number = defaultMaxBeaconSize;
    public get maxBeaconSize(): number {
        return this._maxBeaconSize;
    }

    constructor(config: Readonly<Configuration>) {
        this._config = config;
    }

    public updateState(response: StatusResponse) {
        if (response.status !== Status.OK) {
            return;
        }

        if (response.serverID !== undefined) {
           this._serverId = response.serverID;
        }

        if (response.maxBeaconSize !== undefined) {
            this._maxBeaconSize = response.maxBeaconSize;
        }
    }
}
