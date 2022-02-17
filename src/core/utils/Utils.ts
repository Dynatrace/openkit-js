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
 * Interface which represents the version used for OpenKit.
 */
export interface OpenKitVersion {
    major: number;
    minor: number;
    build: number;
}

/**
 * Maximum size of all values passed to Dynatrace.
 */
const MAX_VALUE_LENGTH = 250;

/**
 * Maxium payload size for sending an event
 */
export const EVENT_MAX_PAYLOAD = 16 * 1024;

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

export const truncate = (str: string, maxLength = MAX_VALUE_LENGTH): string =>
    str.substr(0, maxLength);

export const timeout = (milliseconds: number): Promise<void> =>
    new Promise<void>((res) => {
        setTimeout(res, milliseconds);
    });

export const isFinite = (n: number) =>
    typeof n === 'number' && n !== Infinity && n !== -Infinity && !isNaN(n);

/**
 * Calculate the size of the string in bytes and returns if it is to
 * big for the event payload
 *
 * @param str string which should be used for event payload
 * @returns true if the payload is too big
 */
export const isEventPayloadTooBig = (str: string): boolean => {
    let s = str.length;

    for (let i = str.length - 1; i >= 0; i--) {
        const code = str.charCodeAt(i);

        if (code > 0x7f && code <= 0x7ff) {
            s++;
        } else if (code > 0x7ff && code <= 0xffff) {
            s += 2;
        }

        if (code >= 0xdc00 && code <= 0xdfff) {
            i--; // trail surrogate
        }
    }

    return s > EVENT_MAX_PAYLOAD;
};

/**
 * Returns the correct version string for OpenKit that is used in the basic data
 *
 * @param major Major version which should be reported
 * @param sprint Sprint version which should be reported
 * @param version Current OK version which should be used for calculating version string
 * @returns Version string which will be used in basic data e.g. 8.205.20100
 */
export const getVersionNumber = (
    major: number,
    sprint: number,
    version: OpenKitVersion,
): string => {
    const versionString =
        version.major * 10000 + version.minor * 100 + version.build;
    return `${major}.${sprint}.${versionString}`;
};
