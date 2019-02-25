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

import { CallbackHolder } from '../../../src/core/utils/CallbackHolder';

describe('CallbackHolder', () => {
    let holder: CallbackHolder<boolean>;

    beforeEach(() => {
       holder = new CallbackHolder<boolean>();
    });

    it('should be able to add and resolve callbacks', () => {
        let value = undefined;

        holder.add(tf => value = tf);

        holder.resolve(true);

        expect(value).toBe(true);
    });

    it('should be able to remove a callback which should not be called', () => {
       let value = undefined;

       const cb = (tf: boolean) => value = tf;

       holder.add(cb);
       holder.remove(cb);

       holder.resolve(true);

       expect(value).toBe(undefined);
    });

    it('should be able to add multiple cb and remove some', () => {
        // given
       let value1 = undefined;
       let value2 = undefined;

       const cb1 = (tf: boolean) => value1 = tf;

       holder.add(cb1);
       holder.add(tf => value2 = tf);

       // when
       holder.remove(cb1);
       holder.resolve(true);

       // then
       expect(value1).toBeUndefined();
       expect(value2).toBe(true);
    });

    it('should not resolve callbacks twice', () => {
       let value = undefined;

       holder.add(tf => value = tf);

       holder.resolve(true);
       holder.resolve(false);

       expect(value).toBe(true);
    });
});
