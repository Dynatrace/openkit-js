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
 *
 */

import { OpenKit } from './api/OpenKit';
import { Configuration } from './core/config/Configuration';
import { OpenKitImpl } from './core/impl/OpenKitImpl';
import { CrashReportingLevel } from './CrashReportingLevel';
import { DataCollectionLevel } from './DataCollectionLevel';

const defaultDataCollectionLevel = DataCollectionLevel.UserBehavior;
const defaultCrashReportingLevel = CrashReportingLevel.OptInCrashes;
const defaultApplicationName = '';

export class OpenKitBuilder {
    private readonly config: Configuration;

    constructor(beaconURL: string, applicationId: string, deviceId: number | string) {
        this.config = {
            beaconURL,
            applicationId,
            deviceId,

            applicationName: defaultApplicationName,
            crashReportingLevel: defaultCrashReportingLevel,
            dataCollectionLevel: defaultDataCollectionLevel,
        };
    }

    public withApplicationName(appName: string): OpenKitBuilder {
        this.config.applicationName = appName;
        return this;
    }

    public withOperatingSystem(operatingSystem: string): OpenKitBuilder {
        this.config.operatingSystem = operatingSystem;
        return this;
    }

    public withApplicationVersion(appVersion: string): OpenKitBuilder {
        this.config.applicationVersion = appVersion;
        return this;
    }

    public withScreenSize(width: number, height: number): OpenKitBuilder {
        this.config.screenSize = { width, height };
        return this;
    }

    public withDataCollectionLevel(dataCollectionLevel: DataCollectionLevel): OpenKitBuilder {
        this.config.dataCollectionLevel = dataCollectionLevel;
        return this;
    }

    public withCrashReportingLevel(crashReportingLevel: CrashReportingLevel): OpenKitBuilder {
        this.config.crashReportingLevel = crashReportingLevel;
        return this;
    }

    public getConfig(): Readonly<Configuration> {
        return this.config;
    }

    public build(): OpenKit {
        const openKit = new OpenKitImpl(this.config);
        openKit.initialize();

        return openKit;
    }
}
