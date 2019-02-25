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

/**
 * Action public interface
 */
export interface Action {

    /**
     * Report a value with given name to Dynatrace.
     * If the name or value is longer than 250 characters, it is truncated to this value.
     *
     * @param name The name of the reported value.
     * @param value The value to report.
     */
    reportValue(name: string, value: number | string): void;

    /**
     * Leave the action.
     */
    leaveAction(): null;
}
