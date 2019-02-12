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

import { CaptureMode, HttpStatus, StatusResponse } from '../beacon/StatusResponse';
import { Configuration } from '../config/Configuration';

const defaultServerId = 1;
const defaultMaxBeaconSize = 30720; // 30 * 1024
const defaultMultiplicity = 1;

/**
 * State received from the server, which can be updated with every response.
 *
 * If multiplicity is set to 0, no data for this session will be send to the server anymore.
 */
export class State {
    private readonly _config: Readonly<Configuration>;
    public get config(): Readonly<Configuration> {
        return this._config;
    }

    private _serverIdLocked = false;
    private _serverId: number = defaultServerId;
    public get serverId(): number {
        return this._serverId;
    }

    private _maxBeaconSize: number = defaultMaxBeaconSize;
    public get maxBeaconSize(): number {
        return this._maxBeaconSize;
    }

    private _multiplicity: number = defaultMultiplicity;
    public get multiplicity(): number {
        return this._multiplicity;
    }

    constructor(config: Readonly<Configuration>) {
        this._config = config;
    }

    public setServerIdLocked(): void {
        this._serverIdLocked = true;
    }

    public stopCommunication(): void {
        this._multiplicity = 0;
    }

    public updateState(response: StatusResponse): void {

        if (response.status !== HttpStatus.OK) {
            return;
        }

        if (response.serverID !== undefined && this._serverIdLocked === false) {
            this._serverId = response.serverID >= 0 ? response.serverID : defaultServerId;
        }

        if (response.maxBeaconSize !== undefined) {
            this._maxBeaconSize = response.maxBeaconSize >= 0 ? response.maxBeaconSize * 1024 : defaultMaxBeaconSize;
        }

        if (response.multiplicity !== undefined) {
            // if multiplicity is invalid, we disable it completely
            this._multiplicity = response.multiplicity >= 0 ? response.multiplicity : 0;
        }

        if (response.captureMode !== undefined && response.captureMode === CaptureMode.Off) {
            this.stopCommunication();
        }
    }

    public clone(): State {
        const clonedState = new State(this._config);

        clonedState._maxBeaconSize = this._maxBeaconSize;
        clonedState._serverId = this._serverId;
        clonedState._multiplicity = this._multiplicity;

        return clonedState;
    }
}
