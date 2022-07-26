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

import { Configuration } from '../config/Configuration';
import {
    agentTechnologyType,
    errorTechnologyType,
    openKitVersion,
    platformTypeOpenKit,
    protocolVersion,
} from '../PlatformConstants';
import { EventType } from '../protocol/EventType';
import { PayloadKey } from '../protocol/PayloadKey';
import { combinePayloads, Payload } from './Payload';
import { PayloadQueryBuilder } from './PayloadQueryBuilder';

/**
 * Maximum size of a stacktrace passed to Dynatrace.
 */
const MAX_STACKTRACE_LENGTH = 128_000;

export class StaticPayloadBuilder {
    public static reportCrash(
        errorName: string,
        reason: string,
        stacktrace: string,
        sequenceNumber: number,
        timeSinceSessionStart: number,
    ): Payload {
        return StaticPayloadBuilder.basicEventData(EventType.Crash, errorName)
            .add(PayloadKey.ParentActionId, 0)
            .add(PayloadKey.StartSequenceNumber, sequenceNumber)
            .add(PayloadKey.Time0, timeSinceSessionStart)
            .add(PayloadKey.Reason, reason)
            .add(PayloadKey.Stacktrace, stacktrace, MAX_STACKTRACE_LENGTH)
            .add(PayloadKey.ErrorTechnologyType, errorTechnologyType)
            .build();
    }

    public static startSession(sequenceNumber: number): Payload {
        return StaticPayloadBuilder.basicEventData(EventType.SessionStart)
            .add(PayloadKey.ParentActionId, 0)
            .add(PayloadKey.StartSequenceNumber, sequenceNumber)
            .add(PayloadKey.Time0, 0)
            .build();
    }

    public static endSession(
        sequenceNumber: number,
        duration: number,
    ): Payload {
        return StaticPayloadBuilder.basicEventData(EventType.SessionEnd)
            .add(PayloadKey.ParentActionId, 0)
            .add(PayloadKey.StartSequenceNumber, sequenceNumber)
            .add(PayloadKey.Time0, duration)
            .build();
    }

    public static action(
        name: string,
        actionId: number,
        startSequenceNumber: number,
        endSequenceNumber: number,
        timeSinceSessionStart: number,
        duration: number,
    ): Payload {
        return StaticPayloadBuilder.basicEventData(EventType.ManualAction, name)
            .add(PayloadKey.ActionId, actionId)
            .add(PayloadKey.ParentActionId, 0)
            .add(PayloadKey.StartSequenceNumber, startSequenceNumber)
            .add(PayloadKey.EndSequenceNumber, endSequenceNumber!)
            .add(PayloadKey.Time0, timeSinceSessionStart)
            .add(PayloadKey.Time1, duration)
            .build();
    }

    public static reportNamedEvent(
        name: string,
        parentActionId: number,
        startSequenceNumber: number,
        timeSinceSessionStart: number,
    ): Payload {
        return StaticPayloadBuilder.basicEventData(EventType.NamedEvent, name)
            .add(PayloadKey.ParentActionId, parentActionId)
            .add(PayloadKey.StartSequenceNumber, startSequenceNumber)
            .add(PayloadKey.Time0, timeSinceSessionStart)
            .build();
    }

    public static sendEvent(jsonPayload: string): Payload {
        return new PayloadQueryBuilder()
            .add(PayloadKey.EventType, EventType.Event)
            .addWithoutTruncate(PayloadKey.EventPayload, jsonPayload)
            .build();
    }

    public static applicationWidePrefix(config: Configuration): Payload {
        const { openKit, device, privacy, meta } = config;

        return new PayloadQueryBuilder()
            .add(PayloadKey.ProtocolVersion, protocolVersion)
            .add(PayloadKey.OpenKitVersion, openKitVersion)
            .add(PayloadKey.ApplicationId, openKit.applicationId)
            .add(
                PayloadKey.ApplicationName,
                meta.applicationName === undefined ? '' : meta.applicationName,
            )
            .addIfDefined(
                PayloadKey.ApplicationVersion,
                meta.applicationVersion,
            )
            .addIfDefined(PayloadKey.DeviceOs, meta.operatingSystem)
            .add(PayloadKey.PlatformType, platformTypeOpenKit)
            .add(PayloadKey.AgentTechnologyType, agentTechnologyType)

            .add(PayloadKey.VisitorId, openKit.deviceId)

            .add(PayloadKey.DataCollectionLevel, privacy.dataCollectionLevel)
            .add(PayloadKey.CrashReportingLevel, privacy.crashReportingLevel)

            .addIfDefined(PayloadKey.DeviceManufacturer, device.manufacturer)
            .addIfDefined(PayloadKey.DeviceModel, device.modelId)
            .addIfDefined(PayloadKey.ScreenWidth, device.screenWidth)
            .addIfDefined(PayloadKey.ScreenHeight, device.screenHeight)
            .addIfDefined(PayloadKey.UserLanguage, device.userLanguage)
            .addIfDefined(PayloadKey.Orientation, device.orientation)
            .build();
    }

    public static sessionPrefix(
        prefix: Payload,
        sessionId: number,
        clientIpAddress: string,
        sessionStartTime: number,
    ): Payload {
        const sessionPrefix = new PayloadQueryBuilder()
            .add(PayloadKey.SessionNumber, sessionId)
            .add(PayloadKey.ClientIpAddress, clientIpAddress)
            .add(PayloadKey.SessionStartTime, sessionStartTime)
            .build();

        return combinePayloads(prefix, sessionPrefix);
    }

    public static mutable(
        multiplicity: number,
        transmissionTime: number,
    ): Payload {
        return new PayloadQueryBuilder()
            .add(PayloadKey.Multiplicity, multiplicity)
            .add(PayloadKey.TransmissionTime, transmissionTime)
            .build();
    }

    public static reportValue(
        actionId: number,
        name: string,
        value: number | string | null | undefined,
        sequenceNumber: number,
        timeSinceSessionStart: number,
    ): Payload {
        const eventType =
            typeof value === 'number'
                ? EventType.ValueDouble
                : EventType.ValueString;

        return StaticPayloadBuilder.basicEventData(eventType, name)
            .add(PayloadKey.ParentActionId, actionId)
            .add(PayloadKey.StartSequenceNumber, sequenceNumber)
            .add(PayloadKey.Time0, timeSinceSessionStart)
            .addIfDefinedAndNotNull(PayloadKey.Value, value)
            .build();
    }

    public static reportError(
        name: string,
        parentActionId: number,
        startSequenceNumber: number,
        timeSinceSessionStart: number,
        reason: string,
        errorValue: number,
    ): Payload {
        return StaticPayloadBuilder.basicEventData(EventType.Error, name)
            .add(PayloadKey.ParentActionId, parentActionId)
            .add(PayloadKey.StartSequenceNumber, startSequenceNumber)
            .add(PayloadKey.Time0, timeSinceSessionStart)
            .add(PayloadKey.Reason, reason)
            .add(PayloadKey.ErrorValue, errorValue)
            .add(PayloadKey.ErrorTechnologyType, errorTechnologyType)
            .build();
    }

    public static identifyUser(
        userTag: string,
        sequenceNumber: number,
        timeSinceSessionStart: number,
    ): Payload {
        return StaticPayloadBuilder.basicEventData(
            EventType.IdentifyUser,
            userTag,
        )
            .add(PayloadKey.ParentActionId, 0)
            .add(PayloadKey.StartSequenceNumber, sequenceNumber)
            .add(PayloadKey.Time0, timeSinceSessionStart)
            .build();
    }

    public static webRequest(
        url: string,
        parentActionId: number,
        startSequenceNumber: number,
        timeSinceSessionStart: number,
        endSequenceNumber: number,
        duration: number,
        bytesSent: number,
        bytesReceived: number,
        responseCode: number,
    ): Payload {
        return StaticPayloadBuilder.basicEventData(EventType.WebRequest, url)
            .add(PayloadKey.ParentActionId, parentActionId)
            .add(PayloadKey.StartSequenceNumber, startSequenceNumber)
            .add(PayloadKey.Time0, timeSinceSessionStart)
            .add(PayloadKey.EndSequenceNumber, endSequenceNumber)
            .add(PayloadKey.Time1, duration)
            .addIfNotNegative(PayloadKey.BytesSent, bytesSent)
            .addIfNotNegative(PayloadKey.BytesReceived, bytesReceived)
            .addIfNotNegative(PayloadKey.ResponseCode, responseCode)
            .build();
    }

    private static basicEventData(
        eventType: EventType,
        name?: string,
    ): PayloadQueryBuilder {
        return new PayloadQueryBuilder()
            .add(PayloadKey.EventType, eventType)
            .addIfDefined(PayloadKey.KeyName, name)
            .add(PayloadKey.ThreadId, 1);
    }
}
