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

import { InitCallback, OpenKit } from '../../api/OpenKit';
import { Session } from '../../api/Session';
import { defaultNullSession } from './NullSession';

export class NullOpenKit implements OpenKit {
    public createSession(clientIp?: string): Session {
        return defaultNullSession;
    }

    public isInitialized(): boolean {
        return false;
    }

    public shutdown(): void {
        // stub
    }

    public waitForInit(callback: InitCallback, timeout?: number): void {
        callback(false);
    }
}

export const defaultNullOpenKit = new NullOpenKit();
