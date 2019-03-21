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

import { combinePayloads, getEventType } from '../../../src/core/payload/Payload';
import { EventType } from '../../../src/core/protocol/EventType';

const makePayload = (type: EventType) => {
    return `et=${type}&some-random=suffix`;
};

describe('Payload', () => {
    describe('combinePayloads', () =>{
        const p1 = makePayload(EventType.ValueString);
        const p2 = makePayload(EventType.WebRequest);

        expect(combinePayloads(p1, p2)).toEqual([p1, p2].join('&'));
    });

    describe('getEventType', () => {
        const types = [EventType.WebRequest, EventType.SessionStart, EventType.ValueString];

        it('should get the correct event types', () => {
            for(const type of types) {
                const pl = makePayload(type);

                expect(getEventType(pl)).toBe(type);
            }
        });

        it('should return undefined if no event type could be found', () => {
            expect(getEventType('somePayload')).toBeUndefined();
        })
    });
});