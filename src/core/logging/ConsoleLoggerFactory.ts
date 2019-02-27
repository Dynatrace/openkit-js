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

import { Logger } from '../../api/logging/Logger';
import { LoggerFactory } from '../../api/logging/LoggerFactory';
import { LogLevel } from '../../api/logging/LogLevel';
import { ConsoleLogger } from './ConsoleLogger';

export class ConsoleLoggerFactory implements LoggerFactory {
    private readonly logLevel: LogLevel;

    constructor(logLevel: LogLevel) {
        this.logLevel = logLevel;
    }

    public createLogger(name: string): Logger {
        return new ConsoleLogger(name, this.logLevel);
    }
}
