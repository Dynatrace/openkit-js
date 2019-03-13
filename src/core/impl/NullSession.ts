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

import { Action } from '../../api/Action';
import { Session } from '../../api/Session';
import { defaultNullAction } from './NullAction';

export class NullSession implements Session {
    public enterAction(actionName: string): Action {
        return defaultNullAction;
    }

    public end(): void {
        // stub
    }

    public identifyUser(userTag: string): void {
        // stub
    }

    public reportCrash(errorName: string, reason: string, stacktrace: string): void {
        // stub
    }
}

export const defaultNullSession = new NullSession();
