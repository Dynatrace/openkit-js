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

import { Logger } from '../../api';

/**
 * Logger implementation to discard all messages.
 *
 * @see {@link defaultNullLogger}
 */
export class NullLogger implements Logger {
    public debug(...msg: any[]): void {
        // Stub
    }

    public info(...msg: any[]): void {
        // Stub
    }

    public warn(...msg: any[]): void {
        // Stub
    }

    public error(...msg: any[]): void {
        // Stub
    }
}

export const defaultNullLogger = new NullLogger();
