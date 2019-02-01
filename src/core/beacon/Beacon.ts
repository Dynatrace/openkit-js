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

import {agentTechnologyType, openKitVersion, platformTypeOpenKit, protocolVersion} from '../../PlatformConstants';
import {State} from '../impl/State';
import {QueryBuilder} from '../QueryBuilder';
import {SequenceIdProvider} from '../SequenceIdProvider';
import {PayloadKeys} from './PayloadKeys';

const enum EventType {
    SessionStart = 18,
    SessionEnd = 19,
}

const now = () => {
    return new Date().getTime();
};

export class Beacon {
    private readonly _payloadPrefix: string;
    private readonly _state: State;
    private readonly _payloads: string[] = [];
    private readonly _sequenceIdProvider = new SequenceIdProvider();
    private readonly _sessionStartTime = now();

    constructor(state: State, clientIp: string, sessionId: number) {
        this._state = state;
        this._payloadPrefix = this.buildPayloadPrefix(clientIp, sessionId);
    }

    public startSession(): void {
        const payload = new QueryBuilder()
            .add(PayloadKeys.EventType, EventType.SessionStart)
            .add(PayloadKeys.ParentActionId, 0)
            .add(PayloadKeys.StartSequenceNumber, this._sequenceIdProvider.getNextId())
            .add(PayloadKeys.Time0, 0)
            .add(PayloadKeys.ThreadId, 1)
            .buildQueryString();

        this._payloads.push(payload);
    }

    public endSession() {
        const payload = new QueryBuilder()
            .add(PayloadKeys.EventType, EventType.SessionEnd)
            .add(PayloadKeys.ParentActionId, 0)
            .add(PayloadKeys.StartSequenceNumber, this._sequenceIdProvider.getNextId())
            .add(PayloadKeys.ThreadId, 1)
            .add(PayloadKeys.Time0, (now() - this._sessionStartTime))
            .buildQueryString();

        this._payloads.push(payload);
    }

    /**
     * Get the next payload to send to the server.
     * Builds the beacon prefix, and then adds at least one payload to it. After that, we add payloads as long
     * as we have spaces to do so.
     *
     * If no payload to send is left, we return undefined to mark the end.
     */
    public getNextPayload(): string | undefined {
        if (this._payloads.length === 0) {
            return undefined;
        }

        let currentPayload = `${this._payloadPrefix}&${this.getMutableBeaconData()}`;

        let remainingLength;
        do {
            currentPayload += `&${this._payloads.shift()}`;

            remainingLength = this._state.maxBeaconSize - currentPayload.length;
        }while (this._payloads.length !== 0 && (remainingLength - this._payloads[0].length) > 0);

        return currentPayload;
    }

    private getMutableBeaconData(): string {
        return new QueryBuilder()
            .add(PayloadKeys.SessionStartTime, this._sessionStartTime)
            .add(PayloadKeys.Multiplicity, this._state.multiplicity)
            .buildQueryString();
    }

    public buildPayloadPrefix(clientIpAddress: string, sessionId: number): string {
        const config = this._state.config;

        return new QueryBuilder()
            .add(PayloadKeys.ProtocolVersion, protocolVersion)
            .add(PayloadKeys.OpenKitVersion, openKitVersion)
            .add(PayloadKeys.ApplicationId, config.applicationId)
            .add(PayloadKeys.ApplicationName, config.applicationName)
            .addIfDefined(PayloadKeys.ApplicationVersion, config.applicationVersion)
            .add(PayloadKeys.PlatformType, platformTypeOpenKit)
            .add(PayloadKeys.AgentTechnologyType, agentTechnologyType)

            .add(PayloadKeys.VisitorId, config.deviceId)
            .add(PayloadKeys.SessionNumber, sessionId)
            .add(PayloadKeys.ClientIpAddress, clientIpAddress)

            .add(PayloadKeys.DataCollectionLevel, config.dataCollectionLevel)
            .add(PayloadKeys.CrashReportingLevel, config.crashReportingLevel)
            .buildQueryString();
    }
}
