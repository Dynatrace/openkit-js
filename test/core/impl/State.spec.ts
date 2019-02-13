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
import { HttpClient, RandomNumberProvider } from '../../../src';
import {HttpStatus, StatusResponse} from '../../../src/core/beacon/StatusResponse';
import {Configuration} from '../../../src/core/config/Configuration';
import {State} from '../../../src/core/impl/State';
import {CrashReportingLevel} from '../../../src/CrashReportingLevel';
import {DataCollectionLevel} from '../../../src/DataCollectionLevel';

const config: Readonly<Configuration> = {
    beaconURL: 'https://example.com',
    deviceId: '42',
    applicationName: 'app-name',
    applicationId: 'app-id',
    crashReportingLevel: CrashReportingLevel.OptOutCrashes,
    dataCollectionLevel: DataCollectionLevel.Performance,
    httpClient: {} as HttpClient,
    random: {} as RandomNumberProvider,
};

const mockStatusResponse = (status: HttpStatus, values: { id?: number, size?: number, multiplicity?: number }) => {
    const statusResponse = mock(StatusResponse);
    when(statusResponse.status).thenReturn(status);
    when(statusResponse.serverID).thenReturn(values.id);
    when(statusResponse.maxBeaconSize).thenReturn(values.size);
    when(statusResponse.multiplicity).thenReturn(values.multiplicity);

    return instance(statusResponse);
};

describe('State', () => {
    let state: State;

    beforeEach(() => {
       state = new State(config);
    });

    it('should contain default configuration', () => {
        expect(state.config).toBe(config);
    });

    describe('default values', () => {
        it('should return a default serverId of 1', () => {
            expect(state.serverId).toBe(1);
        });

        it('should return a default multiplicity  of 1', () => {
            expect(state.multiplicity).toBe(1);
        });

        it('should contain a max beacon size of 30 * 1024', () => {
            expect(state.maxBeaconSize).toBe(30720);
        });
    });

    describe('updateState', () => {
        it('should update the serverId', () => {
            state.updateState(mockStatusResponse(HttpStatus.OK, {id: 7}));
            expect(state.serverId).toBe(7);
        });

        it('should update maxBeaconSize with the multiplier of 1024', () => {
            state.updateState(mockStatusResponse(HttpStatus.OK, {size: 10}));
            expect(state.maxBeaconSize).toBe(10240);
        });

        it('should update multiplicity', () => {
            state.updateState(mockStatusResponse(HttpStatus.OK, {multiplicity: 7}));
            expect(state.multiplicity).toBe(7);
        });

        it('should not update any values, if the status is not 200', () => {
           state.updateState(mockStatusResponse(HttpStatus.OK, {id: 5, size: 5, multiplicity: 5}));
           state.updateState(mockStatusResponse(HttpStatus.UNKNOWN,  {id: 1, size: 1, multiplicity: 1}));

           expect(state.multiplicity).toBe(5);
           expect(state.maxBeaconSize).toBe(5120);
           expect(state.serverId).toBe(5);
        });
    });

    describe('switches', () => {
        it('should set multiplicity to 0, after stopCommunication is called', () => {
            state.stopCommunication();
            expect(state.multiplicity).toBe(0);
        });

        it('should make the serverId unmodifiable, after setServerIdLocked is called', () => {
            state.updateState(mockStatusResponse(HttpStatus.OK, {id: 4}));
            state.setServerIdLocked();
            state.updateState(mockStatusResponse(HttpStatus.OK, {id: 7}));

            expect(state.serverId).toBe(4);
        });
    });

    describe('clone', () => {
        it('should return an object with equal values', () => {
            state.updateState(mockStatusResponse(HttpStatus.OK, {id: 5, size: 5, multiplicity: 5}));
            const newState = state.clone();

            expect(newState.multiplicity).toBe(5);
            expect(newState.maxBeaconSize).toBe(5120);
            expect(newState.serverId).toBe(5);
        });

        it('should not copy the server-id lock', () => {
            state.updateState(mockStatusResponse(HttpStatus.OK, {id: 5}));
            state.setServerIdLocked();
            const newState = state.clone();
            newState.updateState(mockStatusResponse(HttpStatus.OK, {id: 7}));

            expect(newState.serverId).toBe(7);
        })
    });
});
