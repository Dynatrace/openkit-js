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

import { CaptureMode } from '../../../src/api';
import { CommunicationState } from '../../../src/core/beacon/CommunicationState';
import { CommunicationStateImpl } from '../../../src/core/beacon/CommunicationStateImpl';

describe('CommunicationStateImpl', () => {
    let state: CommunicationState;

    beforeEach(() => {
        state = new CommunicationStateImpl();
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

        it('should have captureCrashes = On', () => {
            expect(state.captureCrashes).toBe(CaptureMode.On);
        });

        it('should have captureErrors = On', () => {
            expect(state.captureErrors).toBe(CaptureMode.On);
        });

        it('should have capture = On', () => {
            expect(state.capture).toBe(CaptureMode.On);
        });
    });

    describe('updateState with a status request', () => {
        it('should update the serverId', () => {
            state.updateFromResponse({ valid: true, serverId: 7 });
            expect(state.serverId).toBe(7);
        });

        it('should update maxBeaconSize with the multiplier of 1024', () => {
            state.updateFromResponse({ valid: true, maxBeaconSizeInKb: 10 });
            expect(state.maxBeaconSize).toBe(10240);
        });

        it('should update multiplicity', () => {
            state.updateFromResponse({ valid: true, multiplicity: 7 });
            expect(state.multiplicity).toBe(7);
        });

        it('should not update any values, if the status is not 200', () => {
            state.updateFromResponse({
                valid: true,
                serverId: 5,
                maxBeaconSizeInKb: 5,
                multiplicity: 5,
            });
            state.updateFromResponse({
                valid: false,
                serverId: 1,
                maxBeaconSizeInKb: 1,
                multiplicity: 1,
            });

            expect(state.multiplicity).toBe(5);
            expect(state.maxBeaconSize).toBe(5120);
            expect(state.serverId).toBe(5);
        });

        it('should update captureErrors', () => {
            // when, then
            state.updateFromResponse({
                valid: true,
                captureErrors: CaptureMode.On,
            });
            expect(state.captureErrors).toBe(CaptureMode.On);

            // when, then
            state.updateFromResponse({
                valid: true,
                captureErrors: CaptureMode.Off,
            });
            expect(state.captureErrors).toBe(CaptureMode.Off);

            // when, then
            state.updateFromResponse({
                valid: true,
                captureErrors: CaptureMode.On,
            });
            expect(state.captureErrors).toBe(CaptureMode.On);
        });

        it('should update captureCrashes', () => {
            // when, then
            state.updateFromResponse({
                valid: true,
                captureCrashes: CaptureMode.On,
            });
            expect(state.captureCrashes).toBe(CaptureMode.On);

            // when, then
            state.updateFromResponse({
                valid: true,
                captureCrashes: CaptureMode.Off,
            });
            expect(state.captureCrashes).toBe(CaptureMode.Off);

            // when, then
            state.updateFromResponse({
                valid: true,
                captureCrashes: CaptureMode.On,
            });
            expect(state.captureCrashes).toBe(CaptureMode.On);
        });

        it('should disable capture if multiplicity = 0', () => {
            // when
            state.updateFromResponse({ valid: true, multiplicity: 0 });

            // then
            expect(state.capture).toBe(CaptureMode.Off);
        });
    });

    describe('setServerId', () => {
        it('should update the server id if it is not locked', () => {
            // when
            state.setServerId(500);

            // then
            expect(state.serverId).toBe(500);
        });

        it('should not update the server id if it is locked', () => {
            // given
            state.setServerId(500);

            // when
            state.setServerIdLocked();
            state.setServerId(600);

            // then
            expect(state.serverId).toBe(500);
        });
    });

    describe('switches', () => {
        it('should disable capturing after disableCapture has been called', () => {
            state.disableCapture();

            expect(state.capture).toBe(CaptureMode.Off);
        });

        it('should make the serverId unmodifiable, after setServerIdLocked is called', () => {
            state.updateFromResponse({ valid: true, serverId: 4 });
            state.setServerIdLocked();
            state.updateFromResponse({ valid: true, serverId: 7 });

            expect(state.serverId).toBe(4);
        });
    });
});
