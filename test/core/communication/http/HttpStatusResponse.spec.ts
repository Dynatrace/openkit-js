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

import { CaptureMode } from '../../../../src/api/communication/StatusResponse';
import { HttpStatusResponse } from '../../../../src/core/communication/http/HttpStatusResponse';

describe('HttpStatusResponse', () => {

    describe('validity', () => {
        it('should be valid if status = 200, and type=m is set', () => {
            const response = new HttpStatusResponse({status: 200, payload: 'type=m'});

            expect(response.valid).toBe(true);
        });

        it('should not be valid if type is not "m", even if status=200', () => {
            const response = new HttpStatusResponse({status: 200, payload: 'type=d'});

            expect(response.valid).toBe(false);
        });

        it('should not be valid if type is not set, even if status=200', () => {
            const response = new HttpStatusResponse({status: 200, payload: ''});

            expect(response.valid).toBe(false);
        });

        it('should not be valid if status = 200, even if type=m', () => {
            const response = new HttpStatusResponse({status: 201, payload: 'type=m'});

            expect(response.valid).toBe(false);
        });
    });

    describe('entries', () => {
        describe('captureMode', () => {
            it('should be On iff value=1', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&cp=1'});
                expect(response.captureMode).toBe(CaptureMode.On);
            });

            it('should be On if value!=1', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&cp=0'});
                expect(response.captureMode).toBe(CaptureMode.Off);
            });
        });
        describe('captureCrashes', () => {
            it('should be On iff value=1', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&cr=1'});
                expect(response.captureCrashes).toBe(CaptureMode.On);
            });

            it('should be On if value!=1', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&cr=0'});
                expect(response.captureCrashes).toBe(CaptureMode.Off);
            });
        });
        describe('captureErrors', () => {
            it('should be On iff value=1', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&er=1'});
                expect(response.captureErrors).toBe(CaptureMode.On);
            });

            it('should be On if value!=1', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&er=0'});
                expect(response.captureErrors).toBe(CaptureMode.Off);
            });
        });
        describe('MaxBeaconSize', () => {
            it('should be the value passed in', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&bl=6'});
                expect(response.maxBeaconSize).toBe(6);
            });

            it('should be 0 if a value smaller 0 passed in', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&bl=-14'});
                expect(response.maxBeaconSize).toBe(0);
            });
        });

        describe('MonitorName', () => {
            it('should be the values passed in', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&bn=Hello%20World'});
                expect(response.monitorName).toBe('Hello World');
            });
        });

        describe('Mulitplicity', () => {
            it('should be 0 if the value is smaller or equal to 0', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&mp=-5'});
                expect(response.multiplicity).toBe(0);
            });

            it('should be 0 if the value is NaN', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&mp=l33t'});
                expect(response.multiplicity).toBe(0);
            });

            it('should be the value passed in', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&mp=5'});
                expect(response.multiplicity).toBe(5);
            });

        });

        describe('ServerId', () => {
            it('should be 1 if the value is smaller or equal to 0', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&id=-5'});
                expect(response.serverId).toBe(1);
            });

            it('should be 1 if the value is NaN', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&id=l33t'});
                expect(response.serverId).toBe(1);
            });

            it('should be the value passed in', () => {
                const response = new HttpStatusResponse({status: 200, payload: 'type=m&id=5'});
                expect(response.serverId).toBe(5);
            });
        });
    });
});
