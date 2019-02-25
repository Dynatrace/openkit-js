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

import { CommunicationChannelFactory } from './api/communication/CommunicationChannelFactory';
import { OpenKit } from './api/OpenKit';
import { RandomNumberProvider } from './api/RandomNumberProvider';
import { HttpCommunicationChannelFactory } from './core/communication/http/HttpCommunicationChannelFactory';
import { Configuration } from './core/config/Configuration';
import { OpenKitImpl } from './core/impl/OpenKitImpl';
import { DefaultRandomNumberProvider } from './core/provider/DefaultRandomNumberProvider';
import { CrashReportingLevel } from './CrashReportingLevel';
import { DataCollectionLevel } from './DataCollectionLevel';

// Polyfills for IE11, only get polyfilled if window.Promise and/or window.fetch are not available
import 'es6-promise/auto';

const defaultDataCollectionLevel = DataCollectionLevel.UserBehavior;
const defaultCrashReportingLevel = CrashReportingLevel.OptInCrashes;
const defaultApplicationName = '';

/**
 * Builder for an OpenKit instance.
 */
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

            communicationFactory: new HttpCommunicationChannelFactory(),
            random: new DefaultRandomNumberProvider(),
        };
    }

    /**
     * Sets the application name.
     * Defaults to <code>''</code> <i>(empty string)</i>
     *
     * @param appName The application name.
     * @returns The current OpenKitBuilder
     */
    public withApplicationName(appName: string): this {
        this.config.applicationName = String(appName);
        return this;
    }

    /**
     * Sets the operating system information.
     *
     * @param operatingSystem The operating system
     * @returns The current OpenKitBuilder
     */
    public withOperatingSystem(operatingSystem: string): this {
        this.config.operatingSystem = String(operatingSystem);
        return this;
    }

    /**
     * Defines the version of the application.
     *
     * @param appVersion The application version
     * @returns The current OpenKitBuilder
     */
    public withApplicationVersion(appVersion: string): this {
        this.config.applicationVersion = String(appVersion);
        return this;
    }

    /**
     * Sets the data collection logLevel.
     *
     * <p>
     * Depending on the chosen logLevel the amount and granularity of data sent is controlled.
     * Off (0) - no data collected
     * Performance (1) - only performance related data is collected
     * UserBehaviour (2) - all available RUM data including performance related data is collected
     * default value is OFF(0)
     * </p>
     *
     *
     * @param dataCollectionLevel The data collection level
     * @returns The current OpenKitBuilder
     */
    public withDataCollectionLevel(dataCollectionLevel: DataCollectionLevel): this {
        this.config.dataCollectionLevel = dataCollectionLevel;
        return this;
    }

    /**
     * Sets the flag if crash reporting is enabled
     *
     * <p>
     * Off (0) - No crashes are reported
     * OptOutCrashes = (1) - No crashes are reported
     * OptInCrashes = (2) - Crashes are reported
     * </p>
     *
     * @param crashReportingLevel
     */
    public withCrashReportingLevel(crashReportingLevel: CrashReportingLevel): this {
        this.config.crashReportingLevel = crashReportingLevel;
        return this;
    }

    /**
     * Sets the communication channel factory.
     *
     * @param communicationFactory
     */
    public withCommunicationChannelFactory(communicationFactory: CommunicationChannelFactory): this {
        this.config.communicationFactory = communicationFactory;
        return this;
    }

    /**
     * Sets the random number provider
     *
     * @param random
     */
    public withRandomNumberProvider(random: RandomNumberProvider): this {
        this.config.random = random;
        return this;
    }

    /**
     * Get the current configuration for OpenKit-js
     */
    public getConfig(): Readonly<Configuration> {
        return this.config;
    }

    /**
     * Build and initialize an OpenKit instance.
     *
     * @returns The OpenKit-instance.
     */
    public build(): OpenKit {
        if (this.config.dataCollectionLevel !== DataCollectionLevel.UserBehavior) {
            // user does not allow data tracking
            this.config.deviceId = this.config.random.nextPositiveInteger();
        }

        const openKit = new OpenKitImpl(this.config);
        openKit.initialize();

        return openKit;
    }
}
