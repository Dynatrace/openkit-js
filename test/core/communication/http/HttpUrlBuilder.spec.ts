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

import { StatusRequest } from '../../../../src/api/communication/StatusRequest';
import { buildHttpUrl } from '../../../../src/core/communication/http/HttpUrlBuilder';

const request: StatusRequest = {
    agentTechnologyType: 'okjs',
    applicationId: '7.0.000',
    openKitVersion: '1.0',
    platformType: 1,
    serverId: 5,
};

describe('HttpUrlBuilder', () => {
    it('should build the status request url', () => {
        const url = buildHttpUrl('https://example.com', request, false);

        expect(url).toEqual('https://example.com?type=m&srvid=5&app=7.0.000&va=1.0&pt=1&tt=okjs');
    });
    it('should build the status request url for a new session', () => {
        const url = buildHttpUrl('https://example.com', request, true);

        expect(url).toEqual('https://example.com?type=m&srvid=5&app=7.0.000&va=1.0&pt=1&tt=okjs&ns=1');
    });
});
