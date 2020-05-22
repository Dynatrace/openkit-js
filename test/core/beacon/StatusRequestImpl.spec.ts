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

import { createStatusRequest } from '../../../src/core/beacon/StatusRequestImpl';
import { agentTechnologyType, openKitVersion, platformTypeOpenKit } from '../../../src/core/PlatformConstants';

const APP_ID = 'app-id';
const SERVER_ID = 8;

describe('createStatusRequest', () => {
    it('should contain the correct base information, with the additional information passed into', () => {
        const request = createStatusRequest(APP_ID, SERVER_ID);

        // Constant values
        expect(request.agentTechnologyType).toEqual(agentTechnologyType);
        expect(request.openKitVersion).toEqual(openKitVersion);
        expect(request.platformType).toEqual(platformTypeOpenKit);

        // Variable values
        expect(request.applicationId).toEqual(APP_ID);
        expect(request.serverId).toBe(SERVER_ID);
    });
});
