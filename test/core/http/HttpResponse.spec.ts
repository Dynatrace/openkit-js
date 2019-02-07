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

import {HttpResponse, HttpStatus} from '../../../src/core/http/HttpResponse';

describe('HttpResponse', () => {
    it('should parse the http status 200', () => {
       const response = new HttpResponse(200, '');

       expect(response.getStatus()).toBe(HttpStatus.OK);
    });

    it('should parse all other http status as unknown', () => {
       const response = new HttpResponse(404, '');

       expect(response.getStatus()).toBe(HttpStatus.UNKNOWN);
    });

    it('should parse the body to a key-value object', () => {
       const response = new HttpResponse(500, 'a=b&c=d');

       expect(response.getValues()).toEqual({
           a: 'b',
           c: 'd'
       });
    });

    it('should not crash with an invalid result', () => {
       const response = new HttpResponse(500, 'this is an invalid response');

       expect(response.getValues()).toEqual({
           'this is an invalid response': undefined,
       });
    });
});
