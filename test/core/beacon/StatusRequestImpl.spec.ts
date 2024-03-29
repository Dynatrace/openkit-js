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

import { StatusRequest } from '../../../src/api';
import { StatusRequestImpl } from '../../../src/core/beacon/StatusRequestImpl';
import {
    agentTechnologyType,
    openKitVersion,
    platformTypeOpenKit,
} from '../../../src/core/PlatformConstants';

describe('StatusRequestImpl', () => {
    let request: StatusRequest;

    beforeEach(() => {
        request = new StatusRequestImpl(
            'agentTechnology',
            'app-id',
            'version',
            7,
            42,
            23,
        );
    });

    it('should return the same agentTechnology as passed in the constructor', () => {
        expect(request.agentTechnologyType).toEqual('agentTechnology');
    });

    it('should return the same app-id as passed in the constructor', () => {
        expect(request.applicationId).toEqual('app-id');
    });

    it('should return the same openkit-version as passed in the constructor', () => {
        expect(request.openKitVersion).toEqual('version');
    });

    it('should return the same platform-type as passed in the constructor', () => {
        expect(request.platformType).toEqual(7);
    });

    it('should return the same server-id as passed in the constructor', () => {
        expect(request.serverId).toEqual(42);
    });

    it('should return the same timestamp as passed in the constructor', () => {
        expect(request.timestamp).toEqual(23);
    });

    it('should not return a session identifier when session id is undefined', () => {
        const request = new StatusRequestImpl(
            'agentTechnology',
            'app-id',
            'version',
            7,
            42,
            23,
            'device',
        );

        expect(request.sessionIdentifier).toEqual(undefined);
    });

    it('should not return a session identifier when device id is undefined', () => {
        const request = new StatusRequestImpl(
            'agentTechnology',
            'app-id',
            'version',
            7,
            42,
            23,
            undefined,
            123,
        );

        expect(request.sessionIdentifier).toEqual(undefined);
    });

    it('should return a session identifier when session and device id are set', () => {
        const request = new StatusRequestImpl(
            'agentTechnology',
            'app-id',
            'version',
            7,
            42,
            23,
            '123',
            123,
        );

        expect(request.sessionIdentifier).toEqual('123_123');
    });

    it('should create the request from a state', () => {
        request = StatusRequestImpl.create('app-id', 8, 42);

        expect(request.agentTechnologyType).toEqual(agentTechnologyType);
        expect(request.applicationId).toEqual('app-id');
        expect(request.openKitVersion).toEqual(openKitVersion);
        expect(request.platformType).toEqual(platformTypeOpenKit);
        expect(request.serverId).toBe(8);
        expect(request.timestamp).toBe(42);
        expect(request.sessionIdentifier).toBe(undefined);
    });
});
