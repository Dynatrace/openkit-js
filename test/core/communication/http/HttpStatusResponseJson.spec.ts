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

import { CaptureMode } from '../../../../src/api';
import { HttpStatusResponseJson } from '../../../../src/core/communication/http/HttpStatusResponseJson';
import { defaultNullLoggerFactory } from '../../../../src/core/logging/NullLoggerFactory';

describe('HttpStatusResponseJson', () => {
    describe('validity', () => {
        it('should be valid if status = 200, json payload set and status is OK', () => {
            const response = new HttpStatusResponseJson(
                {
                    status: 200,
                    payload: '{ "dynamicConfig": { "status": "OK" } }',
                    headers: {},
                },
                defaultNullLoggerFactory,
            );

            expect(response.valid).toBe(true);
        });

        it('should be valid if status = 200, json payload set and status is missing', () => {
            const response = new HttpStatusResponseJson(
                { status: 200, payload: '{}', headers: {} },
                defaultNullLoggerFactory,
            );

            expect(response.valid).toBe(true);
        });

        it('should not be valid old payload, even if status=200', () => {
            const response = new HttpStatusResponseJson(
                { status: 200, payload: 'type=m', headers: {} },
                defaultNullLoggerFactory,
            );

            expect(response.valid).toBe(false);
        });

        it('should not be valid if status=200, json payload set but status is ERROR', () => {
            const response = new HttpStatusResponseJson(
                {
                    status: 200,
                    payload: '{ "dynamicConfig": { "status": "ERROR" } }',
                    headers: {},
                },
                defaultNullLoggerFactory,
            );

            expect(response.valid).toBe(false);
        });

        it('should not be valid if status = 201, even if json payload set and status is OK', () => {
            const response = new HttpStatusResponseJson(
                {
                    status: 201,
                    payload: '{ "dynamicConfig": { "status": "OK" } }',
                    headers: {},
                },
                defaultNullLoggerFactory,
            );

            expect(response.valid).toBe(false);
        });

        it('should not be valid if invalid json payload set', () => {
            const response = new HttpStatusResponseJson(
                {
                    status: 200,
                    payload: '###',
                    headers: {},
                },
                defaultNullLoggerFactory,
            );

            expect(response.valid).toBe(false);
        });

        it('should not be valid if array json payload set', () => {
            const response = new HttpStatusResponseJson(
                {
                    status: 200,
                    payload: '[]',
                    headers: {},
                },
                defaultNullLoggerFactory,
            );

            expect(response.valid).toBe(false);
        });

        it('should not be valid if string json payload set', () => {
            const response = new HttpStatusResponseJson(
                {
                    status: 200,
                    payload: 'Test',
                    headers: {},
                },
                defaultNullLoggerFactory,
            );

            expect(response.valid).toBe(false);
        });

        it('should not be valid if number json payload set', () => {
            const response = new HttpStatusResponseJson(
                {
                    status: 200,
                    payload: '12345',
                    headers: {},
                },
                defaultNullLoggerFactory,
            );

            expect(response.valid).toBe(false);
        });
    });

    describe('entries', () => {
        describe('captureMode', () => {
            it('should be On if value=1', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "appConfig": { "capture": 1 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.captureMode).toBe(CaptureMode.On);
            });

            it('should be Off if value==0', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "appConfig": { "capture": 0 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.captureMode).toBe(CaptureMode.Off);
            });

            it('should be Off if value!=1', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "appConfig": { "capture": 17 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.captureMode).toBe(CaptureMode.Off);
            });
        });
        describe('captureCrashes', () => {
            it('should be On if value=1', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "appConfig": { "reportCrashes": 1 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.captureCrashes).toBe(CaptureMode.On);
            });

            it('should be Off if value==0', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "appConfig": { "reportCrashes": 0 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.captureCrashes).toBe(CaptureMode.Off);
            });

            it('should be Off if value!=1', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "appConfig": { "reportCrashes": 17 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.captureCrashes).toBe(CaptureMode.Off);
            });
        });
        describe('captureErrors', () => {
            it('should be On if value=1', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "appConfig": { "reportErrors": 1 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.captureErrors).toBe(CaptureMode.On);
            });

            it('should be Off if value==0', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "appConfig": { "reportErrors": 0 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.captureErrors).toBe(CaptureMode.Off);
            });

            it('should be Off if value!=1', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "appConfig": { "reportErrors": 17 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.captureErrors).toBe(CaptureMode.Off);
            });
        });
        describe('MaxBeaconSize', () => {
            it('should be the value passed in', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload:
                            '{ "mobileAgentConfig": { "maxBeaconSizeKb": 17 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.maxBeaconSizeInKb).toBe(17);
            });

            it('should be 0 if a value smaller 0 passed in', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload:
                            '{ "mobileAgentConfig": { "maxBeaconSizeKb": -17 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.maxBeaconSizeInKb).toBe(0);
            });
        });

        describe('Mulitplicity', () => {
            it('should be 0 if the value is smaller or equal to 0', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "dynamicConfig": { "multiplicity": -1 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.multiplicity).toBe(0);
            });

            it('should be 0 if the value is NaN', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload:
                            '{ "dynamicConfig": { "multiplicity": "l33t" } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.multiplicity).toBe(0);
            });

            it('should be the value passed in', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "dynamicConfig": { "multiplicity": 5 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.multiplicity).toBe(5);
            });
        });

        describe('ServerId', () => {
            it('should be 1 if the value is smaller or equal to 0', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "dynamicConfig": { "serverId": -1 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.serverId).toBe(1);
            });

            it('should be 1 if the value is NaN', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "dynamicConfig": { "serverId": "l33t" } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.serverId).toBe(1);
            });

            it('should be the value passed in', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "dynamicConfig": { "serverId": 5 } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.serverId).toBe(5);
            });
        });

        describe('Application Id', () => {
            it('should be the value passed in', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload:
                            '{ "appConfig": { "applicationId" : "Test" } }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.applicationId).toBe('Test');
            });
        });

        describe('Timestamp', () => {
            it('should be 0 if the value is smaller than 0', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "timestamp": -1 }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.timestamp).toBe(0);
            });

            it('should be 0 if the value is NaN', () => {
                const response = new HttpStatusResponseJson(
                    {
                        status: 200,
                        payload: '{ "timestamp": "l33t" }',
                        headers: {},
                    },
                    defaultNullLoggerFactory,
                );
                expect(response.timestamp).toBe(0);
            });

            it('should be the value passed in', () => {
                const response = new HttpStatusResponseJson(
                    { status: 200, payload: '{ "timestamp": 5 }', headers: {} },
                    defaultNullLoggerFactory,
                );
                expect(response.timestamp).toBe(5);
            });
        });
    });
});
