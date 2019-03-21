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

import { WebRequestTracer } from '../../../api';

class NullWebRequestTracer implements  WebRequestTracer {
    public getTag(): string {
        return '';
    }

    public setBytesReceived(bytesReceived: number): this {
        return this;
    }

    public setBytesSent(bytesSent: number): this {
        return this;
    }

    public start(): this {
        return this;
    }

    public stop(responseCode?: number): void {
        // stub
    }
}

export const defaultNullWebRequestTracer = new NullWebRequestTracer();
