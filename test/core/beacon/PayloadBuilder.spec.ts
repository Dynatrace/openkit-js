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

import {instance, mock, when} from 'ts-mockito';
import {PayloadBuilder} from '../../../src/core/beacon/PayloadBuilder';
import {parsePayload} from '../../../src/core/beacon/StatusResponse';
import {Configuration} from '../../../src/core/config/Configuration';
import {ActionImpl} from '../../../src/core/impl/ActionImpl';
import {EventType} from '../../../src/core/protocol/EventType';
import {PayloadKey} from '../../../src/core/protocol/PayloadKey';
import {CrashReportingLevel} from '../../../src/CrashReportingLevel';
import {DataCollectionLevel} from '../../../src/DataCollectionLevel';
import {mockHttpClient} from '../../MockValues';

const parse = (payload: string) => {
    // We misuse in this test the HttpResponse, for easily checking values
    const pairs = parsePayload(payload);

    return {
        keys: Object.keys(pairs),
        pairs: pairs,
    }
};

const payloadExpect = (pairs: {[key: string]: string}, key: string, expected: string) => {
  expect(pairs[key]).toEqual(expected);
};

describe('PayloadBuilder', () => {
    describe('startSession', () => {
        it('should build the correct payload', () => {
            const payload = PayloadBuilder.startSession(5);

            const {keys, pairs} = parse(payload);
            expect(keys).toEqual([PayloadKey.EventType, PayloadKey.ParentActionId, PayloadKey.StartSequenceNumber, PayloadKey.Time0, PayloadKey.ThreadId]);
            payloadExpect(pairs, PayloadKey.EventType, EventType.SessionStart.toString());
            payloadExpect(pairs, PayloadKey.ParentActionId, '0');
            payloadExpect(pairs, PayloadKey.StartSequenceNumber, '5');
            payloadExpect(pairs, PayloadKey.Time0, '0');
            payloadExpect(pairs, PayloadKey.ThreadId, '1');
        });
    });

    describe('endSession', () => {
        it('should build the correct payload', () => {
            const payload = PayloadBuilder.endSession(6000, 50000000);

            const {keys, pairs} = parse(payload);
            expect(keys).toEqual([PayloadKey.EventType, PayloadKey.ParentActionId, PayloadKey.StartSequenceNumber, PayloadKey.ThreadId, PayloadKey.Time0]);
            payloadExpect(pairs, PayloadKey.EventType, EventType.SessionEnd.toString());
            payloadExpect(pairs, PayloadKey.ParentActionId, '0');
            payloadExpect(pairs, PayloadKey.StartSequenceNumber, '6000');
            payloadExpect(pairs, PayloadKey.ThreadId, '1');
            payloadExpect(pairs, PayloadKey.Time0, '50000000');
        });
    });

    describe('action', () => {
        const actionMock: ActionImpl = mock(ActionImpl);
        when(actionMock.name).thenReturn('name');
        when(actionMock.actionId).thenReturn(6);
        when(actionMock.startSequenceNumber).thenReturn(12345);
        when(actionMock.endSequenceNumber).thenReturn(98765);
        when(actionMock.startTime).thenReturn(543);
        when(actionMock.endTime).thenReturn(545);

        const actionInstance = instance(actionMock);

        it('should build the correct payload', () => {
            const payload = PayloadBuilder.action(actionInstance, 123);

            const {keys, pairs} = parse(payload);
            expect(keys).toEqual([PayloadKey.EventType, PayloadKey.KeyName, PayloadKey.ThreadId, PayloadKey.ActionId, PayloadKey.ParentActionId, PayloadKey.StartSequenceNumber, PayloadKey.EndSequenceNumber, PayloadKey.Time0, PayloadKey.Time1]);

            payloadExpect(pairs, PayloadKey.EventType, EventType.ManualAction.toString());
            payloadExpect(pairs, PayloadKey.KeyName, 'name');
            payloadExpect(pairs, PayloadKey.ThreadId, '1');
            payloadExpect(pairs, PayloadKey.ActionId, '6');
            payloadExpect(pairs, PayloadKey.ParentActionId, '0');
            payloadExpect(pairs, PayloadKey.StartSequenceNumber, '12345');
            payloadExpect(pairs, PayloadKey.EndSequenceNumber, '98765');
            payloadExpect(pairs, PayloadKey.Time0, '420');
            payloadExpect(pairs, PayloadKey.Time1, '2');

        });
    });

    describe('prefix', () => {
        let config: Configuration;

        beforeEach(() => {
            config = {
                applicationName: 'appName',
                dataCollectionLevel: DataCollectionLevel.UserBehavior,
                crashReportingLevel: CrashReportingLevel.OptOutCrashes,
                deviceId: '654',
                applicationId: 'app-id',
                beaconURL: 'https://example.com',
                httpClient: mockHttpClient,
            };
        });

        it('should build the correct payload', () => {
            const payload = PayloadBuilder.prefix(config, 678, '');

            const {keys, pairs} = parse(payload);
            expect(keys).toEqual([PayloadKey.ProtocolVersion, PayloadKey.OpenKitVersion, PayloadKey.ApplicationId, PayloadKey.ApplicationName, PayloadKey.PlatformType, PayloadKey.AgentTechnologyType, PayloadKey.VisitorId, PayloadKey.SessionNumber, PayloadKey.ClientIpAddress, PayloadKey.DataCollectionLevel, PayloadKey.CrashReportingLevel]);

            payloadExpect(pairs, PayloadKey.ProtocolVersion, '3');
            payloadExpect(pairs, PayloadKey.OpenKitVersion, '7.0.0000');
            payloadExpect(pairs, PayloadKey.ApplicationId, config.applicationId);
            payloadExpect(pairs, PayloadKey.ApplicationName, config.applicationName);
            payloadExpect(pairs, PayloadKey.PlatformType, '1');
            payloadExpect(pairs, PayloadKey.AgentTechnologyType, 'okjs');
            payloadExpect(pairs, PayloadKey.VisitorId, config.deviceId.toString());
            payloadExpect(pairs, PayloadKey.ClientIpAddress, '');
            payloadExpect(pairs, PayloadKey.DataCollectionLevel, DataCollectionLevel.UserBehavior.toString());
            payloadExpect(pairs, PayloadKey.CrashReportingLevel, CrashReportingLevel.OptOutCrashes.toString());
        });
    });

    describe('mutable', () => {
        it('should build the correct payload', () => {
            const payload = PayloadBuilder.mutable(123456, 765, 98765);

            const {keys, pairs} = parse(payload);
            expect(keys).toEqual([PayloadKey.SessionStartTime, PayloadKey.Multiplicity, PayloadKey.TimesyncTime, PayloadKey.TransmissionTime]);
            payloadExpect(pairs, PayloadKey.SessionStartTime, '123456');
            payloadExpect(pairs, PayloadKey.Multiplicity, '765');
            payloadExpect(pairs, PayloadKey.TimesyncTime, '123456');
            payloadExpect(pairs, PayloadKey.TransmissionTime, '98765');
        });
    });
});
