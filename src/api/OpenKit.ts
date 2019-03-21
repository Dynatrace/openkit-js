/*
 * Copyright 2019 Dynatrace LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { Session } from './Session';

export type InitCallback = (success: boolean) => void;

/**
 * OpenKit public interface
 */
export interface OpenKit {
    /**
     * Creates a new session and returns its instance.
     *
     * @param clientIp the client's ip
     */
    createSession(clientIp?: string): Session;

    /**
     * Shutdown OpenKit.
     * All open session are closed and send to the Beacon.
     */
    shutdown(): void;
}
