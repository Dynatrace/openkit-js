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

import { CommunicationChannel } from '../../api/communication/CommunicationChannel';
import { LoggerFactory } from '../../api/logging/LoggerFactory';
import { RandomNumberProvider } from '../../api/RandomNumberProvider';
import { CrashReportingLevel } from '../../CrashReportingLevel';
import { DataCollectionLevel } from '../../DataCollectionLevel';

export interface Configuration {
    beaconURL: string;
    applicationId: string;
    deviceId: number;

    applicationName: string;
    applicationVersion?: string;
    operatingSystem?: string;

    dataCollectionLevel: DataCollectionLevel;
    crashReportingLevel: CrashReportingLevel;

    communicationChannel: CommunicationChannel;
    loggerFactory: LoggerFactory;
    random: RandomNumberProvider;
}
