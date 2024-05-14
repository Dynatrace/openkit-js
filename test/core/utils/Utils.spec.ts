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
    getVersionNumber,
    isInteger,
    removeElement,
} from '../../../src/core/utils/Utils';

describe('Utils', () => {
    describe('removeElement', () => {
        it('should remove the element if it is in the array', () => {
            const array = [1, 2, 3, 4];
            removeElement(array, 3);

            expect(array).toEqual([1, 2, 4]);
        });
        it('should not remove any element if it is not in the array', () => {
            const array = [1, 2, 3, 4];
            removeElement(array, 6);

            expect(array).toEqual([1, 2, 3, 4]);
        });
    });

    describe('getVersionNumber', () => {
        it('should return version number', () => {
            expect(
                getVersionNumber(8, 237, { major: 1, minor: 3, build: 0 }),
            ).toBe('8.237.10300');
        });
    });

    describe('isInteger', () => {
        it('should identify a number as decimal', () => {
            expect(isInteger(0)).toBe(true);
            expect(isInteger(1)).toBe(true);
            expect(isInteger(-100000)).toBe(true);
            // String(n) is removing the .0
            expect(isInteger(5.0)).toBe(true);

            // Too huge and losing precision
            expect(isInteger(5.0000000000000001)).toBe(true);
            expect(isInteger(4500000000000000.1)).toBe(true);
        });

        it('should identify a number as non decimal', () => {
            expect(isInteger(99999999999999999999999)).toBe(false);
            expect(isInteger(0.1)).toBe(false);
            expect(isInteger(Math.PI)).toBe(false);

            expect(isInteger(NaN)).toBe(false);
            expect(isInteger(Infinity)).toBe(false);
            expect(isInteger(-Infinity)).toBe(false);
            // @ts-expect-error
            expect(isInteger('10')).toBe(false);
            // @ts-expect-error
            expect(isInteger(true)).toBe(false);
            // @ts-expect-error
            expect(isInteger(false)).toBe(false);
            // @ts-expect-error
            expect(isInteger([1])).toBe(false);
            // @ts-expect-error
            expect(isInteger(null)).toBe(false);
            // @ts-expect-error
            expect(isInteger(undefined)).toBe(false);
            // @ts-expect-error
            expect(isInteger({})).toBe(false);

            expect(isInteger(5.000000000000001)).toBe(false);
        });
    });
});
