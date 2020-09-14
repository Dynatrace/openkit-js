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

import { EventType } from '../protocol/EventType';

export type Payload = string;

export const combinePayloads = (p1: Payload, p2: Payload): Payload =>
    `${p1}&${p2}`;

export const getEventType = (payload: Payload): EventType | undefined => {
    if (!payload.startsWith('et')) {
        return undefined;
    }

    const value = payload.substring(
        payload.indexOf('=') + 1,
        payload.indexOf('&'),
    );

    return parseInt(value, 10);
};
