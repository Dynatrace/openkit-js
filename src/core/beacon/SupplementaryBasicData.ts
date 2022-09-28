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

import { ConnectionType } from '../../api/ConnectionType';

/**
 * Specifies supplementary basic data which will be added to the payload
 */
export interface SupplementaryBasicData {
    readonly carrier?: string;
    readonly networkTechnology?: string;
    readonly connectionType?: ConnectionType;

    /**
     * Sets the network carrier
     * Use undefined to clear the value again and it will not be sent.
     *
     * @param carrier network carrier
     */
    setCarrier(carrier?: string): void;

    /**
     * Sets the network technology
     * Use undefined to clear the value again and it will not be sent.
     *
     * @param networkTechnology network technology
     */
    setNetworkTechnology(networkTechnology?: string): void;

    /**
     * Sets the connection type
     * Use undefined to clear the value again and it will not be sent.
     *
     * @param connectionType connection type
     */
    setConnectionType(connectionType?: ConnectionType): void;
}
