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

import { DefaultRandomNumberProvider } from '../../../src/core/provider/DefaultRandomNumberProvider';

describe('DefaultRandomNumberProvider', () => {
    const random = new DefaultRandomNumberProvider();

    const setupNextRandomValue = (value: number) => {
        const fn = jest.fn();
        fn.mockReturnValue(0.5);
        Math.random = fn;
    };

    it('should return the next random Integer', () => {
        setupNextRandomValue(0.5);
        const next = 1073741824; // .5 * 2 ** 31 + 0;

        expect(random.nextPositiveInteger()).toBe(next);
    });

    it('should return the next random percentage value', () => {
        const next = random.nextPercentageValue();
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThanOrEqual(100);
    });
});
