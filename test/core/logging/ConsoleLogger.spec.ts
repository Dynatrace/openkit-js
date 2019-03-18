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

import { LogLevel } from '../../../src/api';
import { ConsoleLogger } from '../../../src/core/logging/ConsoleLogger';

describe('ConsoleLogger', () => {
    beforeEach(() => {
        console.info = jest.fn();
        console.warn = jest.fn();
        console.debug = jest.fn();
    });

   it('should log a debug-message with a given name and level = Debug', () => {
       // given
       const spy = jest.spyOn(console, 'debug');
       const log = new ConsoleLogger('test-name', LogLevel.Debug);

       // when
       log.debug('Test');

       // then
       expect(spy).toHaveBeenCalledTimes(1);
   });

   it('should log a info-message with a given name and level = Info', () => {
       // given
       const spy = jest.spyOn(console, 'info');
       const log = new ConsoleLogger('test-name', LogLevel.Info);
       log.info('Test');

       expect(spy).toHaveBeenCalledTimes(1);
   });

   it('should log a warn-message with a given name and level = Warn', () => {
       // given
       const spy = jest.spyOn(console, 'warn');
       const log = new ConsoleLogger('test-name', LogLevel.Warn);
       log.warn('Test');

       expect(spy).toHaveBeenCalledTimes(1);
   });

   it('should not log a debug-message if level = Info', () =>{
       // given
       const spy = jest.spyOn(console, 'debug');
       const log = new ConsoleLogger('test-name', LogLevel.Info);

       // when
       log.debug('Test');

       // then
       expect(spy).toHaveBeenCalledTimes(0);
   });

   it('should not log a debug-message if level = Warn', () =>{
       // given
       const spy = jest.spyOn(console, 'debug');
       const log = new ConsoleLogger('test-name', LogLevel.Warn);

       // when
       log.debug('Test');

       // then
       expect(spy).toHaveBeenCalledTimes(0);
   });

   it('should not log a info-message if level = Warn', () =>{
       // given
       const spy = jest.spyOn(console, 'info');
       const log = new ConsoleLogger('test-name', LogLevel.Warn);

       // when
       log.info('Test');

       // then
       expect(spy).toHaveBeenCalledTimes(0);
   });

   it('should log a warn-message if level = Debug', () =>{
       // given
       const spy = jest.spyOn(console, 'warn');
       const log = new ConsoleLogger('test-name', LogLevel.Debug);

       // when
       log.warn('Test');

       // then
       expect(spy).toHaveBeenCalledTimes(1);
   });

   it('should log a warn-message if level = Info', () =>{
       // given
       const spy = jest.spyOn(console, 'warn');
       const log = new ConsoleLogger('test-name', LogLevel.Info);

       // when
       log.warn('Test');

       // then
       expect(spy).toHaveBeenCalledTimes(1);
   });
});
