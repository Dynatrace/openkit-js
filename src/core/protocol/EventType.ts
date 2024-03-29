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

export const enum EventType {
    ManualAction = 1,

    NamedEvent = 10,
    ValueString = 11,
    ValueDouble = 13,

    SessionStart = 18,
    SessionEnd = 19,

    WebRequest = 30,
    Error = 40,
    Crash = 50,
    IdentifyUser = 60,

    Event = 98,
}
