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

import { Action, WebRequestTracer } from '../../../api';
import { defaultNullWebRequestTracer } from './NullWebRequestTracer';

export class NullAction implements Action {
    public reportValue(name: string, value: number | string): void {
        // stub
    }

    public leaveAction(): null {
        return null;
    }

    public reportEvent(name: string): void {
        // stub
    }

    public reportError(name: string, code: number, message: string): void {
        // stub
    }

    public traceWebRequest(url: string): WebRequestTracer {
        return defaultNullWebRequestTracer;
    }
}

export const defaultNullAction = new NullAction();
