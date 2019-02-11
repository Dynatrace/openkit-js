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

import {removeElement} from '../../../src/core/utils/Utils';

describe('Utils', () => {
   describe('removeElement', () => {
       it('should remove the element if it is in the array', () => {
           const array = [1,2,3,4];
           removeElement(array, 3);

           expect(array).toEqual([1,2,4]);
       });
       it('should not remove any element if it is not in the array', () => {
           const array = [1,2,3,4];
           removeElement(array, 6);

           expect(array).toEqual([1,2,3,4]);
       });
   });
});