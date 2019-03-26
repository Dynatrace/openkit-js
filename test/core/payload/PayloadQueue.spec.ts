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

import { PayloadQueue } from '../../../src/core/payload/PayloadQueue';

describe('PayloadQueue', () => {
    let queue: PayloadQueue;

    beforeEach(() => {
        queue = new PayloadQueue();
    });

    it('should be empty at creation', () => {
        expect(queue.isEmpty()).toBeTruthy();
    });

    it('should append multiple payloads', () => {
        // given
        const p1 = 'payload-1';
        const p2 = 'payload-2';

        // when
        queue.push(p1);
        queue.push(p2);

        // then
        expect(queue.isEmpty()).toBeFalsy();
        expect(queue._getCurrentQueue().length).toBe(2);
        expect(queue._getCurrentQueue()).toEqual([p1, p2]);
    });

    it('should return the first element, but not remove it on peek', () => {
        // given
        const p1 = 'payload-1';
        const p2 = 'payload-2';
        queue.push(p1);
        queue.push(p2);

        // when
        const e1 = queue.peek();
        const e2 = queue.peek();

        // then
        expect(queue.isEmpty()).toBeFalsy();
        expect(queue._getCurrentQueue().length).toBe(2);
        expect(queue._getCurrentQueue()).toEqual([p1, p2]);
        expect(e1).toEqual(p1);
        expect(e2).toEqual(p1);
    });

    it('should return undefined on peek, if no elements are in the queue', () => {
        // when
        const e1 = queue.peek();
        const e2 = queue.peek();

        // then
        expect(e1).toBeUndefined();
        expect(e2).toBeUndefined();
    });

    it('should return the first element and remove it on pop', () => {
        // given
        const p1 = 'payload-1';
        const p2 = 'payload-2';
        queue.push(p1);
        queue.push(p2);

        // when
        const e1 = queue.pop();
        const e2 = queue.pop();

        // then
        expect(queue.isEmpty()).toBeTruthy();
        expect(e1).toEqual(p1);
        expect(e2).toEqual(p2);
    });

    it('should return undefined on pop if the queue is empty', () => {
        // when
        const e1 = queue.pop();
        const e2 = queue.pop();

        // then
        expect(queue.isEmpty())
            .toBeTruthy();
        expect(e1)
            .toBeUndefined();
        expect(e2)
            .toBeUndefined();
    });
});
