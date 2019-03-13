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

import { defaultNullAction } from '../../../src/core/impl/NullAction';
import { defaultNullWebRequestTracer } from '../../../src/core/impl/NullWebRequestTracer';

describe('NullAction', () => {
    it('should return null on leaveAction', () => {
        expect(defaultNullAction.leaveAction()).toBeNull();
    });

    it('should be able to call reportEvent without an error', () => {
        defaultNullAction.reportEvent('some name');
    });

    it('should be able to call reportValue without an error', () => {
        defaultNullAction.reportValue('name', 'value');
    });

    it('should not crash if an error is reported', () => {
        defaultNullAction.reportError('name', 404, 'message');
    });

    it('should return defaultNullWebRequestTracer on traceWebRequest', () => {
        expect(defaultNullAction.traceWebRequest('any string')).toBe(defaultNullWebRequestTracer);
    })
});
