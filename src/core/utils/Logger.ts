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

export class Logger {
    constructor(private readonly name: string) {}

    public debug(...msg: any[]): void {
        // tslint:disable-next-line:no-console
        console.debug(`[${this.name}]`, ...msg);
    }

    public error(...msg: any[]): void {
        // tslint:disable-next-line:no-console
        console.error(`[${this.name}]`, ...msg);
    }

    public warn(...msg: any[]): void {
        // tslint:disable-next-line:no-console
        console.warn(`[${this.name}]`, ...msg);
    }
}

export const createLogger = (name: string): Logger => new Logger(name);
