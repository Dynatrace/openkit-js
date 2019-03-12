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

import { Action } from './Action';

/**
 * Session public interface
 */
export interface Session {

    /**
     * Enter a new rootAction
     */
    enterAction(actionName: string): Action;

    /**
     * Identify a user
     * @param userTag The tag to identify the user.
     */
    identifyUser(userTag: string): void;

    /**
     * Reports an error with a specified name, error code and reason to Dynatrace.
     *
     * @param name The name of the error.
     * @param code The error code.
     * @param message The message (reason) of the error.
     */
    reportError(name: string, code: number, message: string): void;

    /**
     * Report a crash to Dynatrace.
     *
     * @param name The name of the crash.
     * @param message Why the crash occurred.
     * @param stacktrace The stacktrace of the crash.
     */
    reportCrash(name: string, message: string, stacktrace: string): void;

    /**
     * Ends the session and sends all remaining data.
     */
    end(): void;
}
