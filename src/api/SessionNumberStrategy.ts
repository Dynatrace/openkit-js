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

/**
 * Enum which defines the strategy which can be configured for generating a new session number
 */
export const enum SessionNumberStrategy {
    /**
     * Generates a session number which will always start with 0. Sessions coming afterwards will be incremented,
     * that means the next session number would be 1.
     */
    Default = 0,

    /**
     * Generates a session number which will always start with a random number. Sessions coming afterwards will be incremented,
     * that means the next session number would be random number + 1. If a RandomNumberProvider was provided in OpenKitBuilder,
     * it will also be used here.
     *
     * If the next session number would be outside of the value range, we will generate another random number and start from there.
     */
    Random = 1,
}
