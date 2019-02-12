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

import { RandomNumberProvider } from '../../api/RandomNumberProvider';

/**
 * Default RandomNumberProvider
 */
export class DefaultRandomNumberProvider implements RandomNumberProvider {

    /**
     * @inheritDoc
     */
    public nextPositiveInteger(): number {
            return this.randomInteger(0, 2 ** 31);
    }

    public randomInteger(low: number, high: number): number {
        return Math.floor(this.random(low, high));
    }

    public random(low: number, high: number): number {
        return Math.random() * (high - low) + low;
    }
}
