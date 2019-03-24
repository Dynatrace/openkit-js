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

import {
    CommunicationChannel,
    CrashReportingLevel,
    DataCollectionLevel,
    LoggerFactory,
    LogLevel,
    OpenKit,
    Orientation,
    RandomNumberProvider,
    StatusRequest,
    StatusResponse,
} from './api';
import { AxiosHttpClient } from './core/communication/http/AxiosHttpClient';
import { HttpCommunicationChannel } from './core/communication/http/state/HttpCommunicationChannel';
import { Configuration } from './core/config/Configuration';
import { OpenKitImpl } from './core/impl/OpenKitImpl';
import { ConsoleLoggerFactory } from './core/logging/ConsoleLoggerFactory';
import { DefaultRandomNumberProvider } from './core/provider/DefaultRandomNumberProvider';
import { isFinite, timeout, truncate } from './core/utils/Utils';

const defaultDataCollectionLevel = DataCollectionLevel.UserBehavior;
const defaultCrashReportingLevel = CrashReportingLevel.OptInCrashes;
const defaultOperatingSystem = 'OpenKit';
const defaultApplicationName = '';

const validDeviceIdPattern = /^-?\d{1,19}$/;

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

    private communicationChannel?: CommunicationChannel;
    private randomNumberProvider?: RandomNumberProvider;

    private logLevel = LogLevel.Warn;
    private loggerFactory?: LoggerFactory;

    private manufacturer?: string;
    private modelId?: string;
    private userLanguage?: string;
    private screenWidth?: number;
    private screenHeight?: number;
    private screenDensity?: number;
    private orientation?: Orientation;

    /**
     * Creates a new OpenKitBuilder
     *
     * @param beaconURL The url to the beacon endpoint
     * @param applicationId The id of the custom application
     * @param deviceId The id of the current device, which must be a number between 1 and 19 digits inclusive.
     */
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
     * Sets the communication channel. If the object is null or undefined, it is ignored.
     *
     * @param communicationChannel
     */
    public withCommunicationChannel(communicationChannel: CommunicationChannel): this {
        if (communicationChannel !== null && communicationChannel !== undefined) {
            this.communicationChannel = communicationChannel;
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
     * Sets the manufacturer of the device. If the argument is not a string or empty string, it is ignored.
     *
     * @param manufacturer The manufacturer of the device
     */
    public withManufacturer(manufacturer: string): this {
        if (typeof manufacturer === 'string' && manufacturer.length !== 0) {
            this.manufacturer = truncate(manufacturer);
        }

        return this;
    }

    /**
     * Sets the modelId of the device. If the argument is not a string or empty string, it is ignored.
     *
     * @param modelId The model id of the device
     */
    public withModelId(modelId: string): this {
        if (typeof modelId === 'string' && modelId.length !== 0) {
            this.modelId = truncate(modelId);
        }

        return this;
    }

    /**
     * Sets the user language. If the language is not a string or empty string, it is ignored.
     * Currently, there are no restrictions on RFC/ISO codes.
     *
     * @param language The user language
     */
    public withUserLanguage(language: string): this {
        if (typeof language === 'string' && language.length !== 0) {
            this.userLanguage = language;
        }

        return this;
    }

    /**
     * Sets the screen resolution. If the width or height are not positive finite numbers, both are ignored.
     *
     * @param width The width of the screen
     * @param height The height of the screen
     */
    public withScreenResolution(width: number, height: number): this {
        // Check input for valid numbers
        const w = parseInt(width as any, 10);
        const h = parseInt(height as any, 10);

        if (isFinite(w) && isFinite(h) && w > 0 && h > 0) {
            this.screenWidth = w;
            this.screenHeight = h;
        }

        return this;
    }

    /**
     * Sets the screen orientation. Allowed values are Orientation.Portrait ('p') and Orientation.Landscape ('l').
     * All other values are ignored.
     *
     * @param orientation The orientation. 'p' || 'l'.
     */
    public withScreenOrientation(orientation: Orientation): this {
        if (orientation === Orientation.Landscape || orientation === Orientation.Portrait) {
            this.orientation = orientation;
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
        // this.withCommunicationChannel(new TestCommunicationChannel());

        const loggerFactory = this.loggerFactory || new ConsoleLoggerFactory(this.logLevel);

        const communicationChannel = this.communicationChannel ||
            new HttpCommunicationChannel(new AxiosHttpClient(loggerFactory), loggerFactory);

        const random = this.randomNumberProvider || new DefaultRandomNumberProvider();

        // user does not allow data tracking
        const deviceId = normalizeDeviceId(this.deviceId, this.dataCollectionLevel, random);
        return {
            openKit: {
                beaconURL: this.beaconUrl,
                deviceId,
                applicationId: this.applicationId,
                communicationChannel,
                random,
                loggerFactory,
            },

            privacy: {
                dataCollectionLevel: this.dataCollectionLevel,
                crashReportingLevel: this.crashReportingLevel,
            },

            meta: {
                applicationName: this.applicationName,
                applicationVersion: this.applicationVersion,
                operatingSystem: this.operatingSystem,
            },

            device: {
                manufacturer: this.manufacturer,
                modelId: this.modelId,
                userLanguage: this.userLanguage,
                screenWidth: this.screenWidth,
                screenHeight: this.screenHeight,
                orientation: this.orientation,
            },
        };
    }
}

const normalizeDeviceId = (deviceId: string, dcl: DataCollectionLevel, random: RandomNumberProvider): string => {
    // Check if we may capture the device id
    let id = dcl !== DataCollectionLevel.UserBehavior ? String(random.nextPositiveInteger()) : deviceId;

    // remove a possible '+' at the start
    if (id.charAt(0) === '+') {
        id = id.substr(1);
    }

    if (!validDeviceIdPattern.test(id)) {
        id = String(random.nextPositiveInteger());
    }

    return id;
};

// tslint:disable
class TestCommunicationChannel implements CommunicationChannel {

    private static async getValidStatusResponse(...args: any[]): Promise<StatusResponse> {
        console.warn(...args);

        await timeout(100);

        const r: StatusResponse = {
            valid: true,
            serverId: new DefaultRandomNumberProvider().nextPositiveInteger() % 20 + 5,
        };

        return r;
    }

    public sendNewSessionRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return TestCommunicationChannel.getValidStatusResponse('new session request', url, request);
    }

    public sendPayloadData(url: string, request: StatusRequest, query: string): Promise<StatusResponse> {
        return TestCommunicationChannel.getValidStatusResponse('payload data', url, request, query);
    }

    public sendStatusRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return TestCommunicationChannel.getValidStatusResponse('status request', url, request);
    }
}
// tslint:enable
