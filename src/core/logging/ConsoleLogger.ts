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
import { LogLevel } from '../../api/logging/LogLevel';

// tslint:disable:no-console
export class ConsoleLogger implements Logger {
    private readonly name: string;
    private readonly level: LogLevel;

    constructor(name: string, logLevel: LogLevel) {
        this.name = `[${name}]`;
        this.level = logLevel;
    }

    public debug(...msg: any[]): void {
        if (this.isEnabled(LogLevel.Debug)) {
            console.debug(this.name, ...msg);
        }
    }

    public info(...msg: any[]): void {
        if (this.isEnabled(LogLevel.Info)) {
            console.info(this.name, ...msg);
        }
    }

    public warn(...msg: any[]): void {
        if (this.isEnabled(LogLevel.Warn)) {
            console.warn(this.name, ...msg);
        }
    }

    private isEnabled(level: LogLevel): boolean {
        return this.level <= level;
    }
}
