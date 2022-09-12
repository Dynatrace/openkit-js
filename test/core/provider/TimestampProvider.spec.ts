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

import {
    defaultTimestampProvider,
    TimestampProvider,
} from '../../../src/core/provider/TimestampProvider';

describe('TimestampProvider', () => {
    it('should provide a defaultTimestampProvider', () => {
        expect(defaultTimestampProvider).toBeInstanceOf(TimestampProvider);
    });

    it('should return the current timestamp in milliseconds', () => {
        jest.spyOn(Date.prototype, 'getTime').mockReturnValue(5000);

        expect(defaultTimestampProvider.getCurrentTimestampMs()).toBe(5000);
    });

    it('should return the current timestamp in nanoseconds', () => {
        jest.spyOn(Date.prototype, 'getTime').mockReturnValue(5000);

        expect(defaultTimestampProvider.getCurrentTimestampNs()).toBe(
            5000000000,
        );
    });
});
