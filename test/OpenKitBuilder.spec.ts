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
import { RandomNumberProvider } from '../src/api/RandomNumberProvider';
import { CommunicationChannel } from '../src/api/communication/CommunicationChannel';
import { StatusRequest } from '../src/api/communication/StatusRequest';
import { StatusResponse } from '../src/api/communication/StatusResponse';
import { Logger } from '../src/api/logging/Logger';
import { LoggerFactory } from '../src/api/logging/LoggerFactory';
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

    it('should set the communication channel', () => {
        const channel = new StubCommunicationChannel();

        builder.withCommunicationChannel(channel);

        expect(builder.getConfig().communicationChannel).toBe(channel);
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

    it('should return an openkit instance', () => {
       const ok = builder
           .withDataCollectionLevel(DataCollectionLevel.Off)
           .withCommunicationChannel(new StubCommunicationChannel())
           .withLoggerFactory(defaultNullLoggerFactory)
           .build();

       expect(ok).toBeInstanceOf(OpenKitImpl);
    });

    describe('deviceId', () => {
        const randomNumberProvider: RandomNumberProvider = { nextPositiveInteger: () => 1337 };

       it('should generate a random device id, if the id is not a numeric string', () => {
           // given
           const builder = new OpenKitBuilder('https://example.com', '123', 'not a numeric string')
                .withRandomNumberProvider(randomNumberProvider);

           // when
           const config = builder.getConfig();

           // then
            expect(config.deviceId).toBe('1337');
       });

       it('should generate a random device id, if the dcl = Off', () => {
           // given
           const builder = new OpenKitBuilder('https://example.com', '123', 12345)
               .withRandomNumberProvider(randomNumberProvider)
               .withDataCollectionLevel(DataCollectionLevel.Off);

           // when
           const config = builder.getConfig();

           // then
           expect(config.deviceId).toBe('1337');
       });

       it('should generate a random device id, if the dcl = Performance', () => {
           // given
           const builder = new OpenKitBuilder('https://example.com', '123', 12345)
               .withRandomNumberProvider(randomNumberProvider)
               .withDataCollectionLevel(DataCollectionLevel.Performance);

           // when
           const config = builder.getConfig();

           // then
           expect(config.deviceId).toBe('1337');
       });

       it('should remove a "+" from the start of a device id', () => {
           // given
           const builder = new OpenKitBuilder('https://example.com', '123', '+12345');

           // when
           const config = builder.getConfig();

           // then
           expect(config.deviceId).toBe('12345');
       });

       it('should generate a random device id, if there is a "+" in the device id, which is not at the start', () => {
           // given
           const builder = new OpenKitBuilder('https://example.com', '123', '12+431')
               .withRandomNumberProvider(randomNumberProvider);

           // when
           const config = builder.getConfig();

           // then
           expect(config.deviceId).toBe('1337');
       });

       it('should generate a random device id, if there is a "+" at the start, but no number', () => {
           // given
           const builder = new OpenKitBuilder('https://example.com', '123', '+')
               .withRandomNumberProvider(randomNumberProvider);

           // when
           const config = builder.getConfig();

           // then
           expect(config.deviceId).toBe('1337');
       });

       it('should use the device id if it is negative', () => {
           // given
           const builder = new OpenKitBuilder('https://example.com', '123', '-54321')
               .withRandomNumberProvider(randomNumberProvider);

           // when
           const config = builder.getConfig();

           // then
           expect(config.deviceId).toBe('-54321');
       });

       it('should generate a random device id, if the number is longer than 19 characters', () => {
           // given
           const builder = new OpenKitBuilder('https://example.com', '123', '-11111222223333344444')
               .withRandomNumberProvider(randomNumberProvider);

           // when
           const config = builder.getConfig();

           // then
           expect(config.deviceId).toBe('1337');
       });

       it('should use the device id, if it is 19 characters and negative', () => {
           // given
           const builder = new OpenKitBuilder('https://example.com', '123', '-1111122222333334444')
               .withRandomNumberProvider(randomNumberProvider);

           // when
           const config = builder.getConfig();

           // then
           expect(config.deviceId).toBe('-1111122222333334444');
       });

       it('should use the device id, if it is 19 characters and positive', () => {
           // given
           const builder = new OpenKitBuilder('https://example.com', '123', '1111122222333334444')
               .withRandomNumberProvider(randomNumberProvider);

           // when
           const config = builder.getConfig();

           // then
           expect(config.deviceId).toBe('1111122222333334444');
       });

       it('should use the device id, if it is 1 character', () => {
           // given
           const builder = new OpenKitBuilder('https://example.com', '123', '5')
               .withRandomNumberProvider(randomNumberProvider);

           // when
           const config = builder.getConfig();

           // then
           expect(config.deviceId).toBe('5');
       });
    });
});
