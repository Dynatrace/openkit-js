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
 * Protocol constants for the data collection level.
 */
export const enum DataCollectionLevel {
    /**
     * Sends only anonymous data about new sessions.
     */
    Off = 0,

    /**
     * Sends only anonymous data about the timing of sessions and actions, but no further data.
     */
    Performance = 1,

    /**
     * Sends everything.
     */
    UserBehavior = 2,
}
