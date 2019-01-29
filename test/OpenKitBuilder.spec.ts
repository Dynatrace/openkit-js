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

import {DataCollectionLevel} from '../src/CrashReportingLevel';
import {CrashReportingLevel} from '../src/DataCollectionLevel';
import {OpenKitBuilder} from '../src/OpenKitBuilder';

describe('OpenKitBuilder', () => {
    let builder: OpenKitBuilder;

    beforeEach(() => {
        builder = new OpenKitBuilder('https://example.com', 'app-id', '42');
    });

    it('should return equal values in the config as set in the constructor', () => {
        const config = builder.getConfig();

        expect(config.deviceId).toEqual('42');
        expect(config.applicationId).toEqual('app-id');
        expect(config.beaconURL).toEqual('https://example.com');
    });

    it('should set the application name', () => {
        builder.withApplicationName('app-name');

        expect(builder.getConfig().applicationName).toEqual('app-name');
    });

    it('should set the application version', () => {
        builder.withApplicationVersion('1.3.2');

        expect(builder.getConfig().applicationVersion).toEqual('1.3.2');
    });

    it('should set the crash reporting level', () => {
        builder.withCrashReportingLevel(CrashReportingLevel.OptInCrashes);

        expect(builder.getConfig().crashReportingLevel).toEqual(CrashReportingLevel.OptInCrashes);
    });

    it('should set the data collection level', () => {
        builder.withDataCollectionLevel(DataCollectionLevel.Performance);

        expect(builder.getConfig().dataCollectionLevel).toEqual(DataCollectionLevel.Performance);
    });

    it('should set the operating system', () => {
        builder.withOperatingSystem('Arch');

        expect(builder.getConfig().operatingSystem).toEqual('Arch');
    });

    it('should set the screen size', () => {
        builder.withScreenSize(350, 500);

        expect(builder.getConfig().screenSize).toEqual({width: 350, height: 500});
    });

    it('should set multiple values at once', () => {
        const config = builder
            .withScreenSize(400, 700)
            .withOperatingSystem('Arch')
            .withDataCollectionLevel(DataCollectionLevel.UserBehavior)
            .withCrashReportingLevel(CrashReportingLevel.OptOutCrashes)
            .withApplicationName('App Name')
            .withApplicationVersion('5.6.7')
            .getConfig();

        expect(config.deviceId).toEqual('42');
        expect(config.operatingSystem).toEqual('Arch');
        expect(config.screenSize).toEqual( {width: 400, height: 700});
        expect(config.dataCollectionLevel).toEqual(DataCollectionLevel.UserBehavior);
        expect(config.crashReportingLevel).toEqual(CrashReportingLevel.OptOutCrashes);
        expect(config.applicationName).toEqual('App Name');
        expect(config.applicationVersion).toEqual('5.6.7');
    });
});
