/*
 * Copyright 2025 Dynatrace LLC
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
import { RandomSequenceIdProvider } from '../../../src/core/provider/RandomSequenceIdProvider';

describe('RandomSequenceIdProvider', () => {
    it('id is determined by random id provider', () => {
        const random = new DefaultRandomNumberProvider();
        const provider = new RandomSequenceIdProvider(random);

        const fn = jest.fn();
        fn.mockReturnValue(0.5);
        Math.random = fn;

        const next = 1073741824; // .5 * 2 ** 31 + 0;

        expect(provider.next()).toBe(next);
    });

    it('initial id is at maximum', () => {
        const random = new DefaultRandomNumberProvider();
        const nextNumberSpy = jest.spyOn(random, 'nextPositiveInteger');
        nextNumberSpy.mockReturnValueOnce(2 ** 31);
        nextNumberSpy.mockReturnValueOnce(42);

        const provider = new RandomSequenceIdProvider(random);

        expect(provider.next()).toBe(42);
        expect(nextNumberSpy).toBeCalledTimes(2);
    });

    it('initial id is maximum - 1', () => {
        const random = new DefaultRandomNumberProvider();
        const nextNumberSpy = jest.spyOn(random, 'nextPositiveInteger');
        nextNumberSpy.mockReturnValueOnce(2 ** 31 - 1);
        nextNumberSpy.mockReturnValueOnce(42);

        const provider = new RandomSequenceIdProvider(random);

        expect(provider.next()).toBe(2 ** 31 - 1);
        expect(nextNumberSpy).toBeCalledTimes(1);
        expect(provider.next()).toBe(42);
        expect(nextNumberSpy).toBeCalledTimes(2);
    });

    it('initial id is -1', () => {
        const random = new DefaultRandomNumberProvider();
        const nextNumberSpy = jest.spyOn(random, 'nextPositiveInteger');
        nextNumberSpy.mockReturnValueOnce(-1);
        nextNumberSpy.mockReturnValueOnce(42);

        const provider = new RandomSequenceIdProvider(random);

        expect(provider.next()).toBe(42);
        expect(nextNumberSpy).toBeCalledTimes(2);
    });
});
