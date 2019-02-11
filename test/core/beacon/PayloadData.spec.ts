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
import {PayloadData} from '../../../src/core/beacon/PayloadData';
import {parsePayload} from '../../../src/core/beacon/StatusResponse';
import {Configuration} from '../../../src/core/config/Configuration';
import {ActionImpl} from '../../../src/core/impl/ActionImpl';
import {State} from '../../../src/core/impl/State';
import {EventType} from '../../../src/core/protocol/EventType';
import {defaultTimestampProvider} from '../../../src/core/utils/TimestampProvider';
import {CrashReportingLevel} from '../../../src/CrashReportingLevel';
import {DataCollectionLevel} from '../../../src/DataCollectionLevel';
import {mockHttpClient} from '../../MockValues';

const baseConfiguration: Readonly<Configuration> = {
    beaconURL: 'https://example.com',
    deviceId: '42',
    applicationName: 'app-name',
    applicationId: 'app-id',
    crashReportingLevel: CrashReportingLevel.OptOutCrashes,
    dataCollectionLevel: DataCollectionLevel.Performance,
    httpClient: mockHttpClient,
};

const actionMock: ActionImpl = mock(ActionImpl);
when(actionMock.name).thenReturn('name');
when(actionMock.actionId).thenReturn(6);
when(actionMock.startSequenceNumber).thenReturn(12345);
when(actionMock.endSequenceNumber).thenReturn(98765);
when(actionMock.startTime).thenReturn(543);
when(actionMock.endTime).thenReturn(545);
const actionInstance = instance(actionMock);

describe('PayloadData', () => {
    let state: State;

    beforeEach(() => {
       state = new State(baseConfiguration);
    });

    it('should create', () => {
        expect(new PayloadData(state, '', 5, defaultTimestampProvider)).toBeTruthy();
    });

    it('should fetch the payload after a created session', () => {
        // given
        const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);
        const spiedPayloads = (payloadData as any).payloadQueue;

        // when
        payloadData.startSession();

        // then
        expect(spiedPayloads.length).toBe(1);

        const payload = payloadData.getNextPayload();
        expect(payload).toBeDefined();

        const parsedPayload = parsePayload(payload!);
        expect(parsedPayload).toEqual(expect.objectContaining({ vv: '3', tx: expect.any(String), et: EventType.SessionStart.toString()}));
    });

    it('should fetch the payload after a ending a session', () => {
        // given
        const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);
        const spiedPayloads = (payloadData as any).payloadQueue;

        // when
        payloadData.endSession();

        // then
        expect(spiedPayloads.length).toBe(1);

        const payload = payloadData.getNextPayload();
        expect(payload).toBeDefined();

        const parsedPayload = parsePayload(payload!);
        expect(parsedPayload).toEqual(expect.objectContaining({ vv: '3', tx: expect.any(String), et: EventType.SessionEnd.toString()}));
    });

    it('should fetch the payload after adding an action', () => {
        // given
        const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);
        const spiedPayloads = (payloadData as any).payloadQueue;

        // when
        payloadData.addAction(actionInstance);

        // then
        expect(spiedPayloads.length).toBe(1);

        const payload = payloadData.getNextPayload();
        expect(payload).toBeDefined();

        const parsedPayload = parsePayload(payload!);
        expect(parsedPayload).toEqual(expect.objectContaining({ vv: '3', tx: expect.any(String), et: EventType.ManualAction.toString()}));
    });

    it('should return undefined if getNextPayload is called without any payloads', () => {
        const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);

        expect(payloadData.getNextPayload()).toBeUndefined();
    });
});
