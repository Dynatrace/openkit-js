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

import { getVersionNumber } from './utils/Utils';

/**
 * The OpenKit-JavaScript version.
 * For now, it must be equal to the mobile agent version.
 */
export const openKitVersion = getVersionNumber(8, 323, {
    major: 4,
    minor: 2,
    build: 0,
});

/**
 * Constant for the OneAgent Mobile Communication Protocol Version 3.
 */
export const protocolVersion = 3;

/**
 * Constant for all OpenKit platforms.
 */
export const platformTypeOpenKit = 1;

/**
 * The OpenKit-JavaScript agent technology type constant.
 */
export const agentTechnologyType = 'okjs';

/**
 * The default server id, if no other has been chosen by the backend.
 */
export const defaultServerId = 1;

/**
 * Error technology type "custom".
 */
export const errorTechnologyType = 'c';
