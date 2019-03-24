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
import { Configuration } from '../../../src/core/config/Configuration';
import { CommunicationStateImpl } from '../../../src/core/beacon.v2/CommunicationStateImpl';
import { StatusRequestImpl } from '../../../src/core/impl/StatusRequestImpl';
import { agentTechnologyType, openKitVersion, platformTypeOpenKit } from '../../../src/core/PlatformConstants';

describe('StatusRequestImpl', () => {
    let request: StatusRequest;

    beforeEach(() => {
        request = new StatusRequestImpl('agentTechnology', 'app-id', 'version', 7, 42);
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

    it('should create the request from a state', () => {
       const state = new CommunicationStateImpl({applicationId: '1.2.3'} as Configuration);
       state.updateFromResponse({valid: true, serverId: 8});

       const request = StatusRequestImpl.from(state);

       expect(request.agentTechnologyType).toEqual(agentTechnologyType);
       expect(request.applicationId).toEqual('1.2.3');
       expect(request.openKitVersion).toEqual(openKitVersion);
       expect(request.platformType).toEqual(platformTypeOpenKit);
       expect(request.serverId).toBe(8);
    });
});
