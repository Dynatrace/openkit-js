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

import { UrlBuilder } from '../../../../src/core/communication/http/UrlBuilder';
import { QueryKey } from '../../../../src/core/protocol/QueryKey';

describe('UrlBuilder', () => {
    let builder: UrlBuilder;

    beforeEach(() => {
        builder = new UrlBuilder('https://example.com');
    });

    it('should return the unmodified url if no values have been set', () => {
        expect(builder.build()).toEqual('https://example.com');
    });

    it('should return the same instance after add()', () => {
        expect(builder.add(QueryKey.Version, 0)).toBe(builder);
    });

    it('should return the same instance after addIfDefined()', () => {
        expect(builder.addIfDefined(QueryKey.Version, undefined)).toBe(builder);
    });

    describe('add', () => {
        it('should build a query with a single numeric value', () => {
            builder.add(QueryKey.Version, 5555);

            expect(builder.build()).toEqual('https://example.com?va=5555');
        });

        it('should build a query with a single string value', () => {
            builder.add(QueryKey.Version, 'actionname');

            expect(builder.build()).toEqual('https://example.com?va=actionname');
        });

        it('should concat queries with "&" if multiple values are present', () => {
            builder.add(QueryKey.Version, 'myModel');
            builder.add(QueryKey.AgentTechnologyType, '1.0.4');

            expect(builder.build()).toEqual('https://example.com?va=myModel&tt=1.0.4');
        });

        it('should overwrite already set values', () => {
            builder.add(QueryKey.Version, 1);
            builder.add(QueryKey.Version, 2);

            expect(builder.build()).toEqual('https://example.com?va=2')
        });
    });

    describe('addIfDefined', () => {
        it('should return the url, if undefined has been passed in the addIfDefined method', () => {
            builder.addIfDefined(QueryKey.Version, undefined);

            expect(builder.build()).toEqual('https://example.com');
        });

        it('should add the query if the value is defined', () => {
            builder.addIfDefined(QueryKey.Version, '1.0');

            expect(builder.build()).toEqual('https://example.com?va=1.0');
        });

        it('should add the query with multiple defined values', () => {
            builder.addIfDefined(QueryKey.Version, '1.0');
            builder.addIfDefined(QueryKey.AgentTechnologyType, 'myOs');

            expect(builder.build()).toEqual('https://example.com?va=1.0&tt=myOs')
        });

        it('should add the query with multiple defined and undefined values', () => {
            builder.addIfDefined(QueryKey.Version, '1.0');
            builder.addIfDefined(QueryKey.AgentTechnologyType, 'myOs');
            builder.addIfDefined(QueryKey.Type, undefined);

            expect(builder.build()).toEqual('https://example.com?va=1.0&tt=myOs')
        });

        it('should overwrite already set values, if the value is also defined', () => {
            builder.addIfDefined(QueryKey.Version, 1);
            builder.addIfDefined(QueryKey.Version, 0);

            expect(builder.build()).toEqual('https://example.com?va=0')
        });

        it('should not overwrite already set values, if the value is not defined', () => {
            builder.addIfDefined(QueryKey.Version, 1);
            builder.addIfDefined(QueryKey.Version, undefined);

            expect(builder.build()).toEqual('https://example.com?va=1')
        });
    });

    describe('encoding', () => {
        it('should encode spaces', () => {
            builder.add(QueryKey.Version, '1 2 3');

            expect(builder.build()).toEqual('https://example.com?va=1%202%203');
        });

        it('should encode UTF-16-characters into UTF-8-characters', () => {
            builder.add(QueryKey.Version, '😉');

            expect(builder.build()).toEqual('https://example.com?va=%F0%9F%98%89');
        });
    });
});