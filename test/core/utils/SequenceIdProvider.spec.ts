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

import {SequenceIdProvider} from '../../../src/core/utils/SequenceIdProvider';

describe('SequenceIdProvider', () => {
    it('the first default id is 1', () => {
        const provider = new SequenceIdProvider();

        expect(provider.getNextId()).toBe(1);
    });

    it('if the id exceeds 2^31, the next value is 1 again', () => {
        const provider = new SequenceIdProvider(2 ** 31 - 1);

        expect(provider.getNextId()).toBe(1);
    });

    it('if the initial value exceeds 2^31, the value is calculated modulo', () => {
        const provider = new SequenceIdProvider(2**31 + 1);

        expect(provider.getNextId()).toBe(2);
    })
});