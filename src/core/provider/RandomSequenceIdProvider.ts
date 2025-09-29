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

import { RandomNumberProvider } from '../../api/RandomNumberProvider';
import { IdProvider } from './IdProvider';

/**
 * Javascript is accurate up to 15 digits.
 * We use 10 digits with our max value of 2^31, so we are safe without rounding.
 */
const MAX_ID_VALUE = 2 ** 31;

/**
 * Random Sequence identification number generator.
 * The lowest number generated is 1, the highest 2**31.
 */
export class RandomSequenceIdProvider implements IdProvider {
    private _currentId: number = -1;
    private readonly randomNumberProvider: RandomNumberProvider;

    /**
     * Create a new RandomSequenceIdProvider with a random start id.
     */
    constructor(randomNumberProvider: RandomNumberProvider) {
        this.randomNumberProvider = randomNumberProvider;
    }

    /**
     * @inheritDoc
     */
    public next(): number {
        if (this._currentId !== -1) {
            // Initialized already, so we just count up
            this._currentId++;
        }

        while (this._currentId >= MAX_ID_VALUE || this._currentId < 0) {
            this._currentId = this.randomNumberProvider.nextPositiveInteger();
        }

        return this._currentId;
    }
}
