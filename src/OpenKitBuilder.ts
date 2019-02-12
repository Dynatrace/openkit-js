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

// Polyfills for IE11, only get polyfilled if window.Promise and/or window.fetch are not available
import 'es6-promise/auto';
import { HttpClient } from './api/http/HttpClient';
import { OpenKit } from './api/OpenKit';
import { RandomNumberProvider } from './api/RandomNumberProvider';
import { Configuration } from './core/config/Configuration';
import { DefaultHttpClient } from './core/http/DefaultHttpClient';
import { defaultNullOpenKit } from './core/impl/NullOpenKit';
import { OpenKitImpl } from './core/impl/OpenKitImpl';
import { DefaultRandomNumberProvider } from './core/utils/DefaultRandomNumberProvider';
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

            httpClient: new DefaultHttpClient(),
            random: new DefaultRandomNumberProvider(),
        };
    }

    public withApplicationName(appName: string): this {
        this.config.applicationName = appName;
        return this;
    }

    public withOperatingSystem(operatingSystem: string): this {
        this.config.operatingSystem = operatingSystem;
        return this;
    }

    public withApplicationVersion(appVersion: string): this {
        this.config.applicationVersion = appVersion;
        return this;
    }

    public withScreenSize(width: number, height: number): this {
        this.config.screenSize = { width, height };
        return this;
    }

    public withDataCollectionLevel(dataCollectionLevel: DataCollectionLevel): this {
        this.config.dataCollectionLevel = dataCollectionLevel;
        return this;
    }

    public withCrashReportingLevel(crashReportingLevel: CrashReportingLevel): this {
        this.config.crashReportingLevel = crashReportingLevel;
        return this;
    }

    public withCustomHttpClient(httpClient: HttpClient): this {
        this.config.httpClient = httpClient;

        return this;
    }

    public withRandomNumberProvider(random: RandomNumberProvider): this {
        this.config.random = random;

        return this;
    }

    public getConfig(): Readonly<Configuration> {
        return this.config;
    }

    public build(): OpenKit {
        if (this.config.dataCollectionLevel === DataCollectionLevel.Off) {
           return defaultNullOpenKit;
        }

        if (this.config.dataCollectionLevel === DataCollectionLevel.Performance) {
            // user does not allow data tracking
            this.config.deviceId = this.config.random.nextPositiveInteger();
        }

        const openKit = new OpenKitImpl(this.config);
        openKit.initialize();

        return openKit;
    }
}
