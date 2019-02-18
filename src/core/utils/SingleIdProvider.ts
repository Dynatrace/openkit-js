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

import { IdProvider } from './IdProvider';

/**
 * Provides an IdProvider which a fixed identification number.
 */
export class SingleIdProvider implements IdProvider {

    /**
     * Create a new singleIdProvider with a fixed identification number.
     *
     * @param id The fixed identification number.
     */
    constructor(private readonly id: number) {}

    /**
     * Returns a fixed id.
     */
    public next(): number {
        return this.id;
    }
}
