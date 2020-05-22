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

import { decodePayload } from '../../../src/core/utils/PayloadDecoder';

describe('PayloadDecoder', () => {
    it('should decode a single value', () => {
        const entities = decodePayload('a=b');

        expect(entities.a).toEqual('b');
    });

    it('should decode multiple values', () => {
        const entities = decodePayload('a=b&c=d');

        expect(entities.a).toEqual('b');
        expect(entities.c).toEqual('d');
    });

    it('should decode a single value which is encoded', () => {
        const entities = decodePayload('c=d%20e');

        expect(entities.c).toEqual('d e');
    });

    it('should decode a multiple values which may be encoded', () => {
        const entities = decodePayload('a=b&c=d%20e');

        expect(entities.a).toEqual('b');
        expect(entities.c).toEqual('d e');
    });
});
