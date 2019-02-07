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

import {instance, mock, reset, verify, when} from 'ts-mockito';
import {PayloadData} from '../../../src/core/beacon/PayloadData';
import {ActionImpl} from '../../../src/core/impl/ActionImpl';
import {SessionImpl} from '../../../src/core/impl/SessionImpl';
import {TimestampProvider} from '../../../src/core/utils/TimestampProvider';

describe('ActionImpl', () => {
    const sessionMock = mock(SessionImpl);
    const payloadDataMock = mock(PayloadData);
    const timestampProviderMock = mock(TimestampProvider);

    let action: ActionImpl;

    beforeEach(() => {
        reset(sessionMock);
        reset(payloadDataMock);

        when(payloadDataMock.createSequenceNumber()).thenReturn(5, 6, 7);
        when(payloadDataMock.createId()).thenReturn(3);
        when(timestampProviderMock.getCurrentTimestamp()).thenReturn(1, 2, 3);

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

        verify(sessionMock.removeAction(action)).once();
        verify(sessionMock.flush()).once();
        verify(payloadDataMock.addAction(action)).once();
    });

    it('if leaveAction() was already called, do not process it again', () => {
        action.leaveAction();
        action.leaveAction();

        expect(action.endSequenceNumber).toBe(6);
        expect(action.endTime).toBe(2);

        verify(sessionMock.removeAction(action)).once();
        verify(sessionMock.flush()).once();
        verify(payloadDataMock.addAction(action)).once();
    });
});
