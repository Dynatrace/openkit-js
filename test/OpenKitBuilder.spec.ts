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

import { mock } from 'ts-mockito';
import { CommunicationChannel } from '../src/api/communication/CommunicationChannel';
import { CommunicationChannelFactory } from '../src/api/communication/CommunicationChannelFactory';
import { StatusRequest } from '../src/api/communication/StatusRequest';
import { StatusResponse } from '../src/api/communication/StatusResponse';
import { Logger } from '../src/api/logging/Logger';
import { LoggerFactory } from '../src/api/logging/LoggerFactory';
import { HttpCommunicationChannelFactory } from '../src/core/communication/http/HttpCommunicationChannelFactory';
import { OpenKitImpl } from '../src/core/impl/OpenKitImpl';
import { ConsoleLoggerFactory } from '../src/core/logging/ConsoleLoggerFactory';
import { defaultNullLogger } from '../src/core/logging/NullLogger';
import { defaultNullLoggerFactory } from '../src/core/logging/NullLoggerFactory';
import { DefaultRandomNumberProvider } from '../src/core/provider/DefaultRandomNumberProvider';
import { CrashReportingLevel } from '../src/CrashReportingLevel';
import { DataCollectionLevel } from '../src/DataCollectionLevel';
import { OpenKitBuilder } from '../src/OpenKitBuilder';

class StubCommunicationChannel implements CommunicationChannel {
    public async sendNewSessionRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return {valid: false};
    }

    public async sendPayloadData(url: string, request: StatusRequest, query: string): Promise<StatusResponse> {
        return {valid: false};
    }

    public async sendStatusRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return {valid: false};
    }
}

class StubCommunicationChannelFactory implements CommunicationChannelFactory {
    public getCommunicationChannel(): CommunicationChannel {
        return new StubCommunicationChannel();
    }
}

class StubLoggerFactory implements LoggerFactory {
    public createLogger(name: string): Logger {
        return defaultNullLogger;
    }
}

describe('OpenKitBuilder', () => {
    let builder: OpenKitBuilder;

    beforeEach(() => {
        builder = new OpenKitBuilder('https://example.com', 'app-id', -42);
    });

    it('should return equal values in the config as set in the constructor', () => {
        const config = builder.getConfig();

        expect(config.deviceId).toEqual('-42');
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

    it('should set the communication factoy', () => {
        const factory = mock(HttpCommunicationChannelFactory);

        builder.withCommunicationChannelFactory(factory);

        expect(builder.getConfig().communicationFactory).toBe(factory);
    });

    it('should set the random provider', () => {
        const random = mock(DefaultRandomNumberProvider);

        builder.withRandomNumberProvider(random);

        expect(builder.getConfig().random).toBe(random);
    });

    it('should set the logging factory', () => {
        const loggerFactory = new StubLoggerFactory();

        builder.withLoggerFactory(loggerFactory);

        expect(builder.getConfig().loggerFactory).toBe(loggerFactory);
    });

    it('should set a default logging factory if none is configured', () => {
        expect(builder.getConfig().loggerFactory).toBeInstanceOf(ConsoleLoggerFactory);
    });

    it('should set multiple values at once', () => {
        const config = builder
            .withOperatingSystem('Arch')
            .withDataCollectionLevel(DataCollectionLevel.UserBehavior)
            .withCrashReportingLevel(CrashReportingLevel.OptOutCrashes)
            .withApplicationName('App Name')
            .withApplicationVersion('5.6.7')
            .getConfig();

        expect(config.deviceId).toEqual('-42');
        expect(config.operatingSystem).toEqual('Arch');
        expect(config.dataCollectionLevel).toEqual(DataCollectionLevel.UserBehavior);
        expect(config.crashReportingLevel).toEqual(CrashReportingLevel.OptOutCrashes);
        expect(config.applicationName).toEqual('App Name');
        expect(config.applicationVersion).toEqual('5.6.7');
    });

    it('should randomize the device id if DCL = Off', () => {
       builder
           .withDataCollectionLevel(DataCollectionLevel.Off)
           .withCommunicationChannelFactory(new StubCommunicationChannelFactory())
           .withLoggerFactory(defaultNullLoggerFactory)
           .build();

       expect(builder.getConfig().deviceId).not.toBe('-42');
    });

    it('should return an openkit instance', () => {
       const ok = builder
           .withDataCollectionLevel(DataCollectionLevel.Off)
           .withCommunicationChannelFactory(new StubCommunicationChannelFactory())
           .withLoggerFactory(defaultNullLoggerFactory)
           .build();

       expect(ok).toBeInstanceOf(OpenKitImpl);
    });
});
