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

import { anything, instance, mock, reset, verify, when } from 'ts-mockito';
import { DataCollectionLevel } from '../../../src';
import { CaptureMode } from '../../../src/api/communication/StatusResponse';
import { PayloadData } from '../../../src/core/beacon/PayloadData';
import { Configuration } from '../../../src/core/config/Configuration';
import { ActionImpl } from '../../../src/core/impl/ActionImpl';
import { SessionImpl } from '../../../src/core/impl/SessionImpl';
import { State } from '../../../src/core/impl/State';
import { TimestampProvider } from '../../../src/core/provider/TimestampProvider';

describe('ActionImpl', () => {
    const sessionMock = mock(SessionImpl);
    const payloadDataMock = mock(PayloadData);
    const timestampProviderMock = mock(TimestampProvider);

    let state: State;
    let action: ActionImpl;
    let config: Partial<Configuration>;

    beforeEach(() => {
        config = {
            dataCollectionLevel: DataCollectionLevel.UserBehavior,
        };

        state = new State(config as Configuration);

        reset(sessionMock);
        reset(payloadDataMock);
        reset(timestampProviderMock);

        when(payloadDataMock.createSequenceNumber()).thenReturn(5, 6, 7);
        when(payloadDataMock.createId()).thenReturn(3);
        when(timestampProviderMock.getCurrentTimestamp()).thenReturn(1, 2, 3);
        when(sessionMock.state).thenReturn(state);

        action = new ActionImpl(
            instance(sessionMock),
            'my action',
            instance(payloadDataMock),
            instance(timestampProviderMock));
    });

    it('should create the action', () => {
       expect(action.name).toEqual('my action');
       expect(action.startSequenceNumber).toBe(5);
       expect(action.actionId).toBe(3);
       expect(action.startTime).toEqual(1);
    });

    it('should set properties after leaving the action', () => {
        action.leaveAction();

        expect(action.endSequenceNumber).toBe(6);
        expect(action.endTime).toBe(2);

        verify(sessionMock.endAction(action)).once();
        verify(payloadDataMock.addAction(action)).once();
    });

    it('if leaveAction() was already called, do not process it again', () => {
        action.leaveAction();
        action.leaveAction();

        expect(action.endSequenceNumber).toBe(6);
        expect(action.endTime).toBe(2);

        verify(sessionMock.endAction(action)).once();
        verify(payloadDataMock.addAction(action)).once();
    });

    describe('reportValue', () => {
        describe('invalid values', () => {
            it('should not report a value if the action already ended', () => {
                // given
                action.leaveAction();

                // when
                action.reportValue('Some Name', 'Some Value');

                // then
                verify(payloadDataMock.reportValue(anything(), anything(), anything())).never();
            });

            it('should not report a value if DCL = Off', () => {
                // given
                config.dataCollectionLevel = DataCollectionLevel.Off;

                // when
                action.reportValue('Some Name', 'Some Value');

                // then
                verify(payloadDataMock.reportValue(anything(), anything(), anything())).never();
            });

            it('should not report a value if DCL = Performance', () => {
                // given
                config.dataCollectionLevel = DataCollectionLevel.Performance;

                // when
                action.reportValue('Some Name', 'Some Value');

                // then
                verify(payloadDataMock.reportValue(anything(), anything(), anything())).never();
            });

            it('should not report a value if the name is not a string', () => {
                action.reportValue(undefined as unknown as string, '');
                verify(payloadDataMock.reportValue(anything(), anything(), anything())).never();
            });

            it('should not report a value if the name is empty', () => {
                action.reportValue('',  '');
                verify(payloadDataMock.reportValue(anything(), anything(), anything())).never();
            });

            it('should not report a value if the value not a string, number, null or undefined', () => {
                action.reportValue('Name',  {} as unknown as undefined);
                verify(payloadDataMock.reportValue(anything(), anything(), anything())).never();
            });

            it('should not report a value if the multiplicity = 0', () => {
                state.updateState({valid: true, captureMode: CaptureMode.Off});
                action.reportValue('Name',  'Value');
                verify(payloadDataMock.reportValue(anything(), anything(), anything())).never();
            });
        });

        describe('valid values', () => {
            it('should report a value if the value is string', () => {
                action.reportValue('Name', 'Value');

                verify(payloadDataMock.reportValue(action, 'Name', 'Value')).once();
            });

            it('should report a value if the value is a number', () => {
                action.reportValue('Name', 1234);

                verify(payloadDataMock.reportValue(action, 'Name', 1234)).once();
            });

            it('should report a value if the value is undefined', () => {
                action.reportValue('Name', undefined);

                verify(payloadDataMock.reportValue(action, 'Name', undefined)).once();
            });

            it('should report a value if the value is null', () => {
                action.reportValue('Name', null);

                verify(payloadDataMock.reportValue(action, 'Name', null)).once();
            });
        });

    });
});
