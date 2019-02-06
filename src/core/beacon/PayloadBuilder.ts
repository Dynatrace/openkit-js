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
import {PayloadQueryBuilder} from '../builder/PayloadQueryBuilder';
import {Configuration} from '../config/Configuration';
import {ActionImpl} from '../impl/ActionImpl';
import {EventType} from '../protocol/EventType';
import {PayloadKey} from '../protocol/PayloadKey';
import {now} from '../Utils';

export class PayloadBuilder {
    private constructor() {}

    public static startSession(sequenceNumber: number): string {
        return new PayloadQueryBuilder()
            .add(PayloadKey.EventType, EventType.SessionStart)
            .add(PayloadKey.ParentActionId, 0)
            .add(PayloadKey.StartSequenceNumber, sequenceNumber)
            .add(PayloadKey.Time0, 0)
            .add(PayloadKey.ThreadId, 1)
            .build();
    }

    public static endSession(sequenceNumber: number, duration: number): string {
        return new PayloadQueryBuilder()
            .add(PayloadKey.EventType, EventType.SessionEnd)
            .add(PayloadKey.ParentActionId, 0)
            .add(PayloadKey.StartSequenceNumber, sequenceNumber)
            .add(PayloadKey.ThreadId, 1)
            .add(PayloadKey.Time0, duration)
            .build();
    }

    public static action(action: ActionImpl, sessionStartTime: number): string {
        return new PayloadQueryBuilder()
            .add(PayloadKey.EventType, EventType.ManualAction)
            .add(PayloadKey.KeyName, action.name)
            .add(PayloadKey.ThreadId, 1)
            .add(PayloadKey.ActionId, action.actionId)
            .add(PayloadKey.ParentActionId, 0)
            .add(PayloadKey.StartSequenceNumber, action.startSequenceNumber)
            .add(PayloadKey.EndSequenceNumber, action.endSequenceNumber!)
            .add(PayloadKey.Time0, action.startTime - sessionStartTime)
            .add(PayloadKey.Time1, action.duration)
            .build();
    }

    public static prefix(config: Configuration, sessionId: number, clientIpAddress: string): string {
        return new PayloadQueryBuilder()
            .add(PayloadKey.ProtocolVersion, protocolVersion)
            .add(PayloadKey.OpenKitVersion, openKitVersion)
            .add(PayloadKey.ApplicationId, config.applicationId)
            .add(PayloadKey.ApplicationName, config.applicationName)
            .addIfDefined(PayloadKey.ApplicationVersion, config.applicationVersion)
            .add(PayloadKey.PlatformType, platformTypeOpenKit)
            .add(PayloadKey.AgentTechnologyType, agentTechnologyType)

            .add(PayloadKey.VisitorId, config.deviceId)
            .add(PayloadKey.SessionNumber, sessionId)
            .add(PayloadKey.ClientIpAddress, clientIpAddress)

            .add(PayloadKey.DataCollectionLevel, config.dataCollectionLevel)
            .add(PayloadKey.CrashReportingLevel, config.crashReportingLevel)
            .build();
    }

    public static mutable(sessionStartTime: number, multiplicity: number): string {
        return new PayloadQueryBuilder()
            .add(PayloadKey.SessionStartTime, sessionStartTime)
            .add(PayloadKey.Multiplicity, multiplicity)
            .add(PayloadKey.TimesyncTime, sessionStartTime)
            .add(PayloadKey.TransmissionTime, now())
            .build();
    }
}
