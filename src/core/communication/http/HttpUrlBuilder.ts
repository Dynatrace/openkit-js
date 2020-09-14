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

import { StatusRequest } from '../../../api';
import { QueryKey } from '../../protocol/QueryKey';
import { UrlBuilder } from './UrlBuilder';

export const buildHttpUrl = (
    url: string,
    statusRequest: StatusRequest,
    newSession: boolean,
) =>
    new UrlBuilder(url)
        .add(QueryKey.Type, 'm')
        .add(QueryKey.ServerId, statusRequest.serverId)
        .add(QueryKey.Application, statusRequest.applicationId)
        .add(QueryKey.Version, statusRequest.openKitVersion)
        .add(QueryKey.PlatformType, statusRequest.platformType)
        .add(QueryKey.AgentTechnologyType, statusRequest.agentTechnologyType)
        .addIfDefined(QueryKey.NewSession, newSession ? 1 : undefined)
        .build();
