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
import { RandomNumberProvider } from '../../../src';
import { CommunicationChannelFactory } from '../../../src/api/communication/CommunicationChannelFactory';
import { PayloadBuilder } from '../../../src/core/beacon/PayloadBuilder';
import { PayloadData } from '../../../src/core/beacon/PayloadData';
import { Configuration } from '../../../src/core/config/Configuration';
import { ActionImpl } from '../../../src/core/impl/ActionImpl';
import { State } from '../../../src/core/impl/State';
import { StateImpl } from '../../../src/core/impl/StateImpl';
import { defaultTimestampProvider } from '../../../src/core/provider/TimestampProvider';
import { CrashReportingLevel } from '../../../src/CrashReportingLevel';
import { DataCollectionLevel } from '../../../src/DataCollectionLevel';

const baseConfiguration: Readonly<Configuration> = {
    beaconURL: 'https://example.com',
    deviceId: '42',
    applicationName: 'app-name',
    applicationId: 'app-id',
    crashReportingLevel: CrashReportingLevel.OptOutCrashes,
    dataCollectionLevel: DataCollectionLevel.Performance,

    communicationFactory: {} as CommunicationChannelFactory,
    random: {} as RandomNumberProvider,
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
        state = new StateImpl(baseConfiguration);
    });

    it('should create', () => {
        expect(new PayloadData(state, '', 5, defaultTimestampProvider)).toBeTruthy();
    });

    it('should create the prefix after creation', () => {
        const prefixSpy = jest.spyOn(PayloadBuilder, 'prefix');
        new PayloadData(state, '', 5, defaultTimestampProvider);

        expect(prefixSpy).toHaveBeenCalledTimes(1);
    });

    it('should fetch the payload after a created session', () => {
        // given
        const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);
        const spiedPayloads = (payloadData as any).payloadQueue;
        const startSessionSpy = jest.spyOn(PayloadBuilder, 'startSession');

        // when
        payloadData.startSession();

        // then
        expect(spiedPayloads.length).toBe(1);
        expect(startSessionSpy).toHaveBeenCalledTimes(1);
    });

    it('should fetch the payload after a ending a session', () => {
        // given
        const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);
        const spiedPayloads = (payloadData as any).payloadQueue;
        const endSessionSpy = jest.spyOn(PayloadBuilder, 'endSession');

        // when
        payloadData.endSession();

        // then
        expect(spiedPayloads.length).toBe(1);
        expect(endSessionSpy).toHaveBeenCalledTimes(1);
    });

    it('should fetch the payload after adding an action', () => {
        // given
        const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);
        const spiedPayloads = (payloadData as any).payloadQueue;
        const addActionSpy = jest.spyOn(PayloadBuilder, 'action');

        // when
        payloadData.addAction(actionInstance);

        // then
        expect(spiedPayloads.length).toBe(1);
        expect(addActionSpy).toHaveBeenCalledTimes(1);
    });

    it('should fetch the payload after identifying a user', () => {
        // given
        const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);
        const spiedPayloads = (payloadData as any).payloadQueue;
        const identifyUserSpy = jest.spyOn(PayloadBuilder, 'identifyUser');

        // when
        payloadData.identifyUser('userTag');

        // then
        expect(spiedPayloads.length).toBe(1);
        expect(identifyUserSpy).toHaveBeenCalledTimes(1);
    });

    it('should fetch the payload after reporting a value', () => {
        // given
        const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);
        const spiedPayloads = (payloadData as any).payloadQueue;
        const reportValueSpy = jest.spyOn(PayloadBuilder, 'reportValue');

        // when
        payloadData.reportValue(actionInstance, 'name', 'value');

        // then
        expect(spiedPayloads.length).toBe(1);
        expect(reportValueSpy).toHaveBeenCalledTimes(1);
    });

    it('should return undefined if getNextPayload is called without any payloads', () => {
        const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);

        expect(payloadData.getNextPayload()).toBeUndefined();
    });

    it('should not have payloads left if queue is empty', () => {
        const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);

        expect(payloadData.hasPayloadsLeft()).toBeFalsy();
    });

    describe('getNextPayload', () => {

        it('should return undefined if queue is empty', () => {
            const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);

            expect(payloadData.getNextPayload()).toBeUndefined();
        });

        it('should return a payload', () => {
            // given
            const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);
            payloadData.startSession();

            // when
            const payload = payloadData.getNextPayload();

            // then
            expect(payload).toBeDefined();
            expect(payloadData.hasPayloadsLeft()).toBe(false);
        });

        it('should have created the prefix with mutable part', () => {
            // given
            const mutableSpy = jest.spyOn(PayloadBuilder, 'mutable');
            const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);
            payloadData.startSession();

            // when
            const payload = payloadData.getNextPayload();

            // then
            expect(payload).toBeDefined();
            expect(mutableSpy).toHaveBeenCalledTimes(1);
        });

        it('should split up payloads in multiple if maxBeaconSize is to small', () => {
            // given
            state.updateFromResponse({ valid: true, maxBeaconSize: 0 });
            const payloadData = new PayloadData(state, '', 5, defaultTimestampProvider);
            payloadData.startSession();
            payloadData.identifyUser('userTag');


            // when
            const payload1 = payloadData.getNextPayload();
            expect(payloadData.hasPayloadsLeft()).toBe(true);
            const payload2 = payloadData.getNextPayload();
            expect(payloadData.hasPayloadsLeft()).toBe(false);
            const payload3 = payloadData.getNextPayload();

            // then
            expect(payload1).toBeDefined();
            expect(payload2).toBeDefined();
            expect(payload3).toBeUndefined();
        });
    });
});
