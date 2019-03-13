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
import { defaultNullSession } from '../../../src/core/impl/NullSession';
import { defaultNullWebRequestTracer } from '../../../src/core/impl/NullWebRequestTracer';

describe('NullSession', () => {
    it('should return the defaultNullAction on entering an action', () => {
        expect(defaultNullSession.enterAction('someActionName'))
            .toBe(defaultNullAction);
    });

    it('should return the defaultNullWebRequestTracer on tracing a web request', () =>{
       expect(defaultNullSession.traceWebRequest('https://any.url')).toBe(defaultNullWebRequestTracer);
    });
});
