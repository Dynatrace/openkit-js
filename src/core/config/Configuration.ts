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

import {
    CommunicationChannel,
    CrashReportingLevel,
    DataCollectionLevel,
    LoggerFactory,
    Orientation,
    RandomNumberProvider,
} from '../../api';

export interface PrivacyConfiguration {
    readonly dataCollectionLevel: DataCollectionLevel;
    readonly crashReportingLevel: CrashReportingLevel;
}

export interface DeviceMetadata {
    readonly manufacturer: string;
    readonly modelId: string;
    readonly userLanguage: string;
    readonly screenWidth: number;
    readonly screenHeight: number;
    readonly orientation: Orientation;
}

export interface ApplicationMetadata {
    readonly applicationName: string;
    readonly applicationVersion: string;
    readonly operatingSystem: string;
}

export interface OpenKitConfiguration {
    readonly beaconURL: string;
    readonly applicationId: string;
    readonly deviceId: string;

    readonly communicationChannel: CommunicationChannel;
    readonly loggerFactory: LoggerFactory;
    readonly random: RandomNumberProvider;
}

export type Configuration =  OpenKitConfiguration & PrivacyConfiguration & Partial<DeviceMetadata> & Partial<ApplicationMetadata>;
