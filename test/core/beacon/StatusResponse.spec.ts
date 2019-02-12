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
import {CaptureMode, StatusResponse} from '../../../src/core/beacon/StatusResponse';
import {HttpResponse, HttpStatus} from '../../../src/core/http/HttpResponse';

const setupResponse = (status: HttpStatus, values: {[key: string]: string}): StatusResponse => {
    let mockHttpResponse = mock(HttpResponse);
    when(mockHttpResponse.getStatus()).thenReturn(status);
    when(mockHttpResponse.getValues()).thenReturn(values);

    return new StatusResponse(instance(mockHttpResponse));
};

describe('StatusResponse', () => {
    it('should be invalid with no values if no values are passed and status is 200', () => {
        const r = setupResponse(HttpStatus.OK, {});

        expect(r.valid).toBe(false);
        expect(r.status).toBe(HttpStatus.OK);

        expect(r.multiplicity).toBeUndefined();
        expect(r.maxBeaconSize).toBeUndefined();
        expect(r.serverID).toBeUndefined();
        expect(r.captureCrashes).toBeUndefined();
        expect(r.monitorName).toBeUndefined();
        expect(r.captureErrors).toBeUndefined();
        expect(r.captureMode).toBeUndefined();
    });

    it('should be valid with no values except type=m and status 200', () => {
        const r = setupResponse(HttpStatus.OK, {type: 'm'});

        expect(r.valid).toBe(true);
        expect(r.status).toBe(HttpStatus.OK);

        expect(r.multiplicity).toBeUndefined();
        expect(r.maxBeaconSize).toBeUndefined();
        expect(r.serverID).toBeUndefined();
        expect(r.captureCrashes).toBeUndefined();
        expect(r.monitorName).toBeUndefined();
        expect(r.captureErrors).toBeUndefined();
        expect(r.captureMode).toBeUndefined();
    });

    it('should be invalid with type=m but a status code other than 200', () => {
        const r = setupResponse(HttpStatus.UNKNOWN, {type: 'm'});

        expect(r.valid).toBe(false);
        expect(r.status).toBe(HttpStatus.UNKNOWN);

        expect(r.multiplicity).toBeUndefined();
        expect(r.maxBeaconSize).toBeUndefined();
        expect(r.serverID).toBeUndefined();
        expect(r.captureCrashes).toBeUndefined();
        expect(r.monitorName).toBeUndefined();
        expect(r.captureErrors).toBeUndefined();
        expect(r.captureMode).toBeUndefined();
    });

    describe('values', () => {
        it('should return the same multiplicity', () => {
            const r = setupResponse(HttpStatus.OK, {type: 'm', mp: '10'});

            expect(r.multiplicity).toBe(10);
        });

        it('should return the same maxBeaconSize', () => {
            const r = setupResponse(HttpStatus.OK, {type: 'm', bl: '50'});

            expect(r.maxBeaconSize).toBe(50);
        });

        it('should return the same serverId', () => {
            const r = setupResponse(HttpStatus.OK, {type: 'm', id: '6'});

            expect(r.serverID).toBe(6);
        });

        it('should return the same captureCrashes-flag', () => {
            const r = setupResponse(HttpStatus.OK, {type: 'm', cr: '0'});

            expect(r.captureCrashes).toBe(false);
        });

        it('should return the same monitorName', () => {
            const r = setupResponse(HttpStatus.OK, {type: 'm', bn: 'name'});

            expect(r.monitorName).toBe('name');
        });

        it('should return the same captureErrors-fag', () => {
            const r = setupResponse(HttpStatus.OK, {type: 'm', er: '1'});

            expect(r.captureErrors).toBe(true);
        });

        it('should return capturemode=1 with a valid value of "1"', () => {
            const r = setupResponse(HttpStatus.OK, {type: 'm', cp: '1'});

            expect(r.captureMode).toBe(CaptureMode.On);
        });

        it('should return capturemode=off with an invalid value', () => {
            const r = setupResponse(HttpStatus.OK, {type: 'm', cp: '5'});

            expect(r.captureMode).toBe(CaptureMode.Off);
        });

        it('should return capturemode=off with 0', () => {
            const r = setupResponse(HttpStatus.OK, {type: 'm', cp: '5'});

            expect(r.captureMode).toBe(CaptureMode.Off);
        });
    });
});
