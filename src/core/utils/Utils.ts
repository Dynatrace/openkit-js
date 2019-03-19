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

/**
 * Maximum size of all values passed to Dynatrace.
 */
const MAX_VALUE_LENGTH = 250;

/**
 * Removes an element from a given array.
 * If there are multiple elements of the same instance, only the first is removed.
 *
 * @param array The array to search in
 * @param element The element to remove.
 */
export const removeElement = <T>(array: T[], element: T): void => {
    const index = array.indexOf(element);

    if (index < 0) {
        return;
    }

    array.splice(index, 1);
};

export const truncate = (str: string): string => str.substr(0, MAX_VALUE_LENGTH);

export const timeout = (milliseconds: number): Promise<void> => {
   return new Promise<void>((res) => {
       setTimeout(res, milliseconds);
   });
};

export const isFinite = (n: number) => n !== Infinity && n !== -Infinity && !isNaN(n);
