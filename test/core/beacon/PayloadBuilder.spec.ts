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

import { instance, mock, when } from 'ts-mockito';
import { PayloadBuilder } from '../../../src/core/beacon/PayloadBuilder';
import { Configuration } from '../../../src/core/config/Configuration';
import { ActionImpl } from '../../../src/core/impl/ActionImpl';
import { EventType } from '../../../src/core/protocol/EventType';
import { PayloadKey } from '../../../src/core/protocol/PayloadKey';
import { PayloadDecoder } from '../../../src/core/utils/PayloadDecoder';
import { CrashReportingLevel } from '../../../src/CrashReportingLevel';
import { DataCollectionLevel } from '../../../src/DataCollectionLevel';
import arrayContaining = jasmine.arrayContaining;

const parse = (payload: string) => {
    // We misuse in this test the HttpResponse, for easily checking values
    const pairs = new PayloadDecoder(payload).getEntries();

    return {
        keys: Object.keys(pairs),
        pairs: pairs,
    }
};

const payloadExpect = (pairs: {[key: string]: string}, key: string, expected: string | undefined) => {
  expect(pairs[key]).toEqual(expected);
};

describe('PayloadBuilder', () => {
    describe('startSession', () => {
        it('should build the correct payload', () => {
            const payload = PayloadBuilder.startSession(5);

            const {keys, pairs} = parse(payload);
            expect(keys).toEqual(arrayContaining([PayloadKey.EventType, PayloadKey.ParentActionId, PayloadKey.StartSequenceNumber, PayloadKey.Time0, PayloadKey.ThreadId]));
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
            expect(keys).toEqual(arrayContaining([PayloadKey.EventType, PayloadKey.ParentActionId, PayloadKey.StartSequenceNumber, PayloadKey.ThreadId, PayloadKey.Time0]));
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
            expect(keys).toEqual(arrayContaining([PayloadKey.EventType, PayloadKey.KeyName, PayloadKey.ThreadId, PayloadKey.ActionId, PayloadKey.ParentActionId, PayloadKey.StartSequenceNumber, PayloadKey.EndSequenceNumber, PayloadKey.Time0, PayloadKey.Time1]));

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
            const partialConfig = {
                applicationName: 'appName',
                dataCollectionLevel: DataCollectionLevel.UserBehavior,
                crashReportingLevel: CrashReportingLevel.OptOutCrashes,
                deviceId: '654',
                applicationId: 'app-id',
                beaconURL: 'https://example.com',
            };

            config = partialConfig as Configuration;
        });

        it('should build the correct payload', () => {
            const payload = PayloadBuilder.prefix(config, 678, '');

            const {keys, pairs} = parse(payload);
            expect(keys).toEqual(arrayContaining([PayloadKey.ProtocolVersion, PayloadKey.OpenKitVersion, PayloadKey.ApplicationId, PayloadKey.ApplicationName, PayloadKey.PlatformType, PayloadKey.AgentTechnologyType, PayloadKey.VisitorId, PayloadKey.SessionNumber, PayloadKey.ClientIpAddress, PayloadKey.DataCollectionLevel, PayloadKey.CrashReportingLevel]));

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
            expect(keys).toEqual(arrayContaining([PayloadKey.SessionStartTime, PayloadKey.Multiplicity, PayloadKey.TransmissionTime]));
            payloadExpect(pairs, PayloadKey.SessionStartTime, '123456');
            payloadExpect(pairs, PayloadKey.Multiplicity, '765');
            payloadExpect(pairs, PayloadKey.TransmissionTime, '98765');
        });
    });

    describe('identifyUser', () => {
        it('should build the correct payload', () => {
            const payload = PayloadBuilder.identifyUser('Dynatrace Power User', 6, 100, 40);

            const {keys, pairs} = parse(payload);
            expect(keys).toEqual(arrayContaining([PayloadKey.EventType, PayloadKey.ThreadId, PayloadKey.KeyName, PayloadKey.ParentActionId, PayloadKey.StartSequenceNumber, PayloadKey.Time0]));

            payloadExpect(pairs, PayloadKey.EventType, EventType.IdentifyUser.toString());
            payloadExpect(pairs, PayloadKey.ThreadId, '1');
            payloadExpect(pairs, PayloadKey.KeyName, 'Dynatrace Power User');
            payloadExpect(pairs, PayloadKey.StartSequenceNumber, '6');
            payloadExpect(pairs, PayloadKey.ParentActionId, '0');
            payloadExpect(pairs, PayloadKey.Time0, '60');
        });
    });

    describe('reportValue', () => {
        let action: ActionImpl;
        const str250 = Array(250 + 1).join('a');

        beforeEach(() => {
            const actionMock = mock(ActionImpl);
            when(actionMock.actionId).thenReturn(7);

            action = instance(actionMock);
        });

        it('should build a correct string-reportValue', () => {
            const payload = PayloadBuilder.reportValue(action, 'My String Value', 'Some String value', 6, 600, 100);

            const {keys, pairs} = parse(payload);

            expect(keys).toEqual(arrayContaining([PayloadKey.EventType, PayloadKey.ThreadId, PayloadKey.KeyName, PayloadKey.ParentActionId, PayloadKey.StartSequenceNumber, PayloadKey.Time0, PayloadKey.Value]));

            payloadExpect(pairs, PayloadKey.EventType, EventType.ValueString.toString());
            payloadExpect(pairs, PayloadKey.ThreadId, '1');
            payloadExpect(pairs, PayloadKey.KeyName, 'My String Value');
            payloadExpect(pairs, PayloadKey.ParentActionId, '7');
            payloadExpect(pairs, PayloadKey.StartSequenceNumber, '6');
            payloadExpect(pairs, PayloadKey.Time0, '500');
            payloadExpect(pairs, PayloadKey.Value, 'Some String value');
        });


        it('should build a correct double-reportValue', () => {
            const payload = PayloadBuilder.reportValue(action, 'My int value', 456.321, 6, 600, 100);

            const {keys, pairs} = parse(payload);

            expect(keys).toEqual(arrayContaining([PayloadKey.EventType, PayloadKey.ThreadId, PayloadKey.KeyName, PayloadKey.ParentActionId, PayloadKey.StartSequenceNumber, PayloadKey.Time0, PayloadKey.Value]));

            payloadExpect(pairs, PayloadKey.EventType, EventType.ValueDouble.toString());
            payloadExpect(pairs, PayloadKey.ThreadId, '1');
            payloadExpect(pairs, PayloadKey.KeyName, 'My int value');
            payloadExpect(pairs, PayloadKey.ParentActionId, '7');
            payloadExpect(pairs, PayloadKey.StartSequenceNumber, '6');
            payloadExpect(pairs, PayloadKey.Time0, '500');
            payloadExpect(pairs, PayloadKey.Value, '456.321');
        });

        it('should build a correct double-reportValue with +Inf', () => {
            const payload = PayloadBuilder.reportValue(action, 'My int value', +Infinity, 6, 600, 100);

            const {pairs} = parse(payload);

            payloadExpect(pairs, PayloadKey.Value, 'Infinity');
        });

        it('should build a correct double-reportValue with -Inf', () => {
            const payload = PayloadBuilder.reportValue(action, 'My int value', -Infinity, 6, 600, 100);

            const {pairs} = parse(payload);

            payloadExpect(pairs, PayloadKey.Value, '-Infinity');
        });

        it('should build a correct double-reportValue with NaN', () => {
            const payload = PayloadBuilder.reportValue(action, 'My int value', NaN, 6, 600, 100);

            const {pairs} = parse(payload);

            payloadExpect(pairs, PayloadKey.Value, 'NaN');
        });

        it('should build a correct string-reportValue with empty-string', () => {
            const payload = PayloadBuilder.reportValue(action, 'My int value', '', 6, 600, 100);
            const {pairs} = parse(payload);

            payloadExpect(pairs, PayloadKey.EventType, EventType.ValueString.toString());
            payloadExpect(pairs, PayloadKey.Value, '');
        });

        it('should build a correct string-reportValue with null', () => {
            const payload = PayloadBuilder.reportValue(action, 'My int value', null, 6, 600, 100);
            const {pairs} = parse(payload);

            payloadExpect(pairs, PayloadKey.EventType, EventType.ValueString.toString());
            payloadExpect(pairs, PayloadKey.Value, undefined);
        });

        it('should build a correct string-reportValue with undefined', () => {
            const payload = PayloadBuilder.reportValue(action, 'My int value', undefined, 6, 600, 100);
            const {pairs} = parse(payload);

            payloadExpect(pairs, PayloadKey.EventType, EventType.ValueString.toString());
            payloadExpect(pairs, PayloadKey.Value, undefined);
        });

        it('should truncate a key longer than 250 characters', () => {
            const str = str250 + 'z'; // 251 characters

            const payload = PayloadBuilder.reportValue(action, str, '', 6, 600, 100);
            const {pairs} = parse(payload);

            payloadExpect(pairs, PayloadKey.EventType, EventType.ValueString.toString());
            payloadExpect(pairs, PayloadKey.KeyName, str250);
        });

        it('should truncate a value longer than 250 characters', () => {
            const str = str250 + 'z'; // 251 characters

            const payload = PayloadBuilder.reportValue(action, 'Key', str, 6, 600, 100);
            const {pairs} = parse(payload);

            payloadExpect(pairs, PayloadKey.EventType, EventType.ValueString.toString());
            payloadExpect(pairs, PayloadKey.Value, str250);
        });
    });
});
