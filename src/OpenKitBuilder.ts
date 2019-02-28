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
import { LoggerFactory } from './api/logging/LoggerFactory';
import { LogLevel } from './api/logging/LogLevel';
import { OpenKit } from './api/OpenKit';
import { RandomNumberProvider } from './api/RandomNumberProvider';
import { HttpCommunicationChannelFactory } from './core/communication/http/HttpCommunicationChannelFactory';
import { Configuration } from './core/config/Configuration';
import { OpenKitImpl } from './core/impl/OpenKitImpl';
import { ConsoleLoggerFactory } from './core/logging/ConsoleLoggerFactory';
import { DefaultRandomNumberProvider } from './core/provider/DefaultRandomNumberProvider';
import { CrashReportingLevel } from './CrashReportingLevel';
import { DataCollectionLevel } from './DataCollectionLevel';

// Polyfills for IE11, only get polyfilled if window.Promise and/or window.fetch are not available
import 'es6-promise/auto';

const defaultDataCollectionLevel = DataCollectionLevel.UserBehavior;
const defaultCrashReportingLevel = CrashReportingLevel.OptInCrashes;
const defaultOperatingSystem = 'OpenKit';
const defaultApplicationName = '';

/**
 * Builder for an OpenKit instance.
 */
export class OpenKitBuilder {
    private readonly beaconUrl: string;
    private readonly applicationId: string;
    private readonly deviceId: string;

    private applicationName = defaultApplicationName;
    private operatingSystem = defaultOperatingSystem;
    private applicationVersion?: string;

    private crashReportingLevel = defaultCrashReportingLevel;
    private dataCollectionLevel = defaultDataCollectionLevel;

    private communicationFactory?: CommunicationChannelFactory;
    private randomNumberProvider?: RandomNumberProvider;

    private logLevel = LogLevel.Warn;
    private loggerFactory?: LoggerFactory;

    constructor(beaconURL: string, applicationId: string, deviceId: number | string) {
        this.beaconUrl = beaconURL;
        this.applicationId = applicationId;
        this.deviceId = String(deviceId);
    }

    /**
     * Sets the application name.
     * Defaults to <code>''</code> <i>(empty string)</i>
     *
     * @param appName The application name.
     * @returns The current OpenKitBuilder
     */
    public withApplicationName(appName: string): this {
        this.applicationName = String(appName);

        return this;
    }

    /**
     * Sets the operating system information. Defaults to 'OpenKit'.
     *
     * @param operatingSystem The operating system
     * @returns The current OpenKitBuilder
     */
    public withOperatingSystem(operatingSystem: string): this {
        this.operatingSystem = String(operatingSystem);

        return this;
    }

    /**
     * Defines the version of the application.
     *
     * @param appVersion The application version
     * @returns The current OpenKitBuilder
     */
    public withApplicationVersion(appVersion: string): this {
        this.applicationVersion = String(appVersion);

        return this;
    }

    /**
     * Sets the data collection level.
     *
     * Depending on the chosen level the amount and granularity of data sent is controlled.
     * Off (0) - no data collected
     * Performance (1) - only performance related data is collected
     * UserBehavior (2) - all available RUM data including performance related data is collected..
     *
     * If an invalid value is passed, it is ignored.
     *
     * Default value is UserBehavior (2)
     *
     * @param dataCollectionLevel The data collection level
     * @returns The current OpenKitBuilder
     */
    public withDataCollectionLevel(dataCollectionLevel: DataCollectionLevel): this {
        if (typeof dataCollectionLevel === 'number' && dataCollectionLevel >= 0 && dataCollectionLevel <= 2) {
            this.dataCollectionLevel = dataCollectionLevel;
        }
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
     * If an invalid value is passed, it is ignored.
     *
     * @param crashReportingLevel
     */
    public withCrashReportingLevel(crashReportingLevel: CrashReportingLevel): this {
        if (typeof crashReportingLevel === 'number' && crashReportingLevel >= 0 && crashReportingLevel <= 2) {
            this.crashReportingLevel = crashReportingLevel;
        }

        return this;
    }

    /**
     * Sets the communication channel factory. If the object is null or undefined, it is ignored.
     *
     * @param communicationFactory
     */
    public withCommunicationChannelFactory(communicationFactory: CommunicationChannelFactory): this {
        if (communicationFactory !== null && communicationFactory !== undefined) {
            this.communicationFactory = communicationFactory;
        }

        return this;
    }

    /**
     * Sets the random number provider. If the object is null or undefined, it is ignored.
     *
     * @param random The random number provider.
     */
    public withRandomNumberProvider(random: RandomNumberProvider): this {
        if (random !== null && random !== undefined) {
           this.randomNumberProvider = random;
        }

        return this;
    }

    /**
     * Sets the logger factory.
     * If the argument is null or undefined, it is ignored.
     *
     * @param loggerFactory
     */
    public withLoggerFactory(loggerFactory: LoggerFactory): this {
        if (loggerFactory !== null && loggerFactory !== undefined) {
            this.loggerFactory = loggerFactory;
        }

        return this;
    }

    /**
     * Sets the default log level if the default logger factory is used.
     *
     * @param logLevel The loglevel for the default logger factory.
     */
    public withLogLevel(logLevel: LogLevel): this {
        this.logLevel = Number(logLevel);

        return this;
    }

    /**
     * Builds and gets the current configuration.
     *
     * @returns the current configuration
     */
    public getConfig(): Readonly<Configuration> {
        return this.buildConfig();
    }

    /**
     * Build and initialize an OpenKit instance.
     *
     * @returns The OpenKit instance.
     */
    public build(): OpenKit {
        const config = this.buildConfig();

        const openKit = new OpenKitImpl(config);
        openKit.initialize();

        return openKit;
    }

    private buildConfig(): Readonly<Configuration> {
        const loggerFactory = this.loggerFactory ? this.loggerFactory : new ConsoleLoggerFactory(this.logLevel);

        const communicationFactory = this.communicationFactory ?
            this.communicationFactory : new HttpCommunicationChannelFactory(loggerFactory);

        const random = this.randomNumberProvider ?
            this.randomNumberProvider : new DefaultRandomNumberProvider();

        // user does not allow data tracking
        const deviceId = this.dataCollectionLevel === DataCollectionLevel.UserBehavior ?
            this.deviceId : String(random.nextPositiveInteger());

        return {
            beaconURL: this.beaconUrl,
            deviceId,
            applicationId: this.applicationId,

            applicationName: this.applicationName,
            applicationVersion: this.applicationVersion,
            operatingSystem: this.operatingSystem,

            dataCollectionLevel: this.dataCollectionLevel,
            crashReportingLevel: this.crashReportingLevel,

            communicationFactory,
            random,
            loggerFactory,
        };
    }
}
