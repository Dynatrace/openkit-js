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

import { PayloadQueryBuilder } from '../../../../src/core/beacon/builder/PayloadQueryBuilder';
import { PayloadKey } from '../../../../src/core/protocol/PayloadKey';

describe('PayloadQueryBuilder', () => {
    let builder: PayloadQueryBuilder;

    beforeEach(() => {
        builder = new PayloadQueryBuilder();
    });

    it('should return an empty string if no values have been set', () => {
        expect(builder.build()).toEqual('');
    });

    it('should return the same instance after add()', () => {
        expect(builder.add(PayloadKey.ActionId, 0)).toBe(builder);
    });

    it('should return the same instance after addIfDefined()', () => {
        expect(builder.addIfDefined(PayloadKey.ActionId, undefined)).toBe(builder);
    });

    describe('add', () => {
        it('should build a query with a single numeric value', () => {
            builder.add(PayloadKey.DeviceOs, 5555);

            expect(builder.build()).toEqual('os=5555');
        });

        it('should build a query with a single string value', () => {
            builder.add(PayloadKey.ActionId, 'actionname');

            expect(builder.build()).toEqual('ca=actionname');
        });

        it('should concat queries with "&" if multiple values are present', () => {
           builder.add(PayloadKey.DeviceModel, 'myModel');
           builder.add(PayloadKey.ApplicationId, '1.0.4');

           expect(builder.build()).toEqual('md=myModel&ap=1.0.4');
        });

        it('should overwrite already set values', () => {
            builder.add(PayloadKey.DeviceOs, 1);
            builder.add(PayloadKey.DeviceOs, 2);

            expect(builder.build()).toEqual('os=2')
        });
    });

    describe('addIfDefined', () => {
        it('should return an empty string, if undefined has been passed in the addIfDefined method', () => {
            builder.addIfDefined(PayloadKey.ApplicationId, undefined);

            expect(builder.build()).toEqual('');
        });

        it('should add the query if the value is defined', () => {
           builder.addIfDefined(PayloadKey.ApplicationId, '1.2.3');

           expect(builder.build()).toEqual('ap=1.2.3');
        });

        it('should add the query with multiple defined values', () => {
            builder.addIfDefined(PayloadKey.ApplicationId, '1.0');
            builder.addIfDefined(PayloadKey.DeviceOs, 'myOs');

            expect(builder.build()).toEqual('ap=1.0&os=myOs')
        });

        it('should add the query with multiple defined and undefined values', () => {
            builder.addIfDefined(PayloadKey.ApplicationId, '1.0');
            builder.addIfDefined(PayloadKey.DeviceOs, 'myOs');
            builder.addIfDefined(PayloadKey.ActionId, undefined);

            expect(builder.build()).toEqual('ap=1.0&os=myOs')
        });

        it('should overwrite already set values, if the value is also defined', () => {
           builder.addIfDefined(PayloadKey.DeviceOs, 1);
           builder.addIfDefined(PayloadKey.DeviceOs, 0);

            expect(builder.build()).toEqual('os=0')
        });

        it('should not overwrite already set values, if the value is not defined', () => {
           builder.addIfDefined(PayloadKey.DeviceOs, 1);
           builder.addIfDefined(PayloadKey.DeviceOs, undefined);

            expect(builder.build()).toEqual('os=1')
        });
    });

    describe('encoding', () => {
        it('should encode spaces', () => {
            builder.add(PayloadKey.DeviceOs, 'My Os');

            expect(builder.build()).toEqual('os=My%20Os');
        });

        it('should encode UTF-16-characters into UTF-8-characters', () => {
            builder.add(PayloadKey.KeyName, '😉');

            expect(builder.build()).toEqual('na=%F0%9F%98%89');
        });
    });
});