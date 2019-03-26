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
import { ConsoleLoggerFactory } from '../../../src/core/logging/ConsoleLoggerFactory';

describe('ConsoleLoggerFactory', () => {
    let factory: ConsoleLoggerFactory;

    beforeEach(() => {
        factory = new ConsoleLoggerFactory(LogLevel.Error);
    });

    it('should be initialized with the correct log level', () => {
        expect(factory._logLevel).toBe(LogLevel.Error);
    });

    it('should create instances of ConsoleLogger', () => {
        // when
        const logger = factory.createLogger('Logger');

        // then
        expect(logger).toBeInstanceOf(ConsoleLogger);
    });
});
