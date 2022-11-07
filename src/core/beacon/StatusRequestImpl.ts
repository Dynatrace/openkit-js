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

import { StatusRequest } from '../../api';
import {
    agentTechnologyType,
    openKitVersion,
    platformTypeOpenKit,
} from '../PlatformConstants';

export class StatusRequestImpl implements StatusRequest {
    public readonly agentTechnologyType: string;
    public readonly applicationId: string;
    public readonly openKitVersion: string;
    public readonly platformType: number;
    public readonly serverId: number;
    public readonly timestamp: number;
    public readonly sessionIdentifier?: string;

    constructor(
        agentTechnology: string,
        applicationId: string,
        version: string,
        platformType: number,
        serverId: number,
        timestamp: number,
        deviceId?: string,
        sessionId?: number,
    ) {
        this.agentTechnologyType = agentTechnology;
        this.applicationId = applicationId;
        this.openKitVersion = version;
        this.platformType = platformType;
        this.serverId = serverId;
        this.timestamp = timestamp;

        if (sessionId !== undefined && deviceId !== undefined) {
            this.sessionIdentifier = `${deviceId}_${sessionId}`;
        }
    }

    public static create(
        appId: string,
        serverId: number,
        timestamp: number,
        deviceId?: string,
        sessionId?: number,
    ): StatusRequestImpl {
        return new StatusRequestImpl(
            agentTechnologyType,
            appId,
            openKitVersion,
            platformTypeOpenKit,
            serverId,
            timestamp,
            deviceId,
            sessionId,
        );
    }
}
