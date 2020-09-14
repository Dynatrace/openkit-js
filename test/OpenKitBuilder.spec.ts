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
import { LogLevel, OpenKitBuilder } from '../src';
import {
    CommunicationChannel,
    CrashReportingLevel,
    DataCollectionLevel,
    Logger,
    LoggerFactory,
    Orientation,
    RandomNumberProvider,
    StatusRequest,
    StatusResponse,
} from '../src/api';
import { OpenKitImpl } from '../src/core/impl/OpenKitImpl';
import { ConsoleLoggerFactory } from '../src/core/logging/ConsoleLoggerFactory';
import { defaultNullLogger } from '../src/core/logging/NullLogger';
import { defaultNullLoggerFactory } from '../src/core/logging/NullLoggerFactory';
import { DefaultRandomNumberProvider } from '../src/core/provider/DefaultRandomNumberProvider';

class StubCommunicationChannel implements CommunicationChannel {
    public async sendNewSessionRequest(
        url: string,
        request: StatusRequest,
    ): Promise<StatusResponse> {
        return { valid: false };
    }

    public async sendPayloadData(
        url: string,
        request: StatusRequest,
        query: string,
    ): Promise<StatusResponse> {
        return { valid: false };
    }

    public async sendStatusRequest(
        url: string,
        request: StatusRequest,
    ): Promise<StatusResponse> {
        return { valid: false };
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

        expect(config.openKit.deviceId).toEqual('-42');
        expect(config.openKit.applicationId).toEqual('app-id');
        expect(config.openKit.beaconURL).toEqual('https://example.com');
    });

    it('should set the application name', () => {
        builder.withApplicationName('app-name');

        expect(builder.getConfig().meta.applicationName).toEqual('app-name');
    });

    it('should set the application version', () => {
        builder.withApplicationVersion('1.3.2');

        expect(builder.getConfig().meta.applicationVersion).toEqual('1.3.2');
    });

    it('should set the crash reporting level', () => {
        builder.withCrashReportingLevel(CrashReportingLevel.OptInCrashes);

        expect(builder.getConfig().privacy.crashReportingLevel).toEqual(
            CrashReportingLevel.OptInCrashes,
        );
    });

    it('should set the data collection level', () => {
        builder.withDataCollectionLevel(DataCollectionLevel.Performance);

        expect(builder.getConfig().privacy.dataCollectionLevel).toEqual(
            DataCollectionLevel.Performance,
        );
    });

    it('should set the operating system', () => {
        builder.withOperatingSystem('Arch');

        expect(builder.getConfig().meta.operatingSystem).toEqual('Arch');
    });

    it('should set the communication channel', () => {
        const channel = new StubCommunicationChannel();

        builder.withCommunicationChannel(channel);

        expect(builder.getConfig().openKit.communicationChannel).toBe(channel);
    });

    it('should set the random provider', () => {
        const random = mock(DefaultRandomNumberProvider);

        builder.withRandomNumberProvider(random);

        expect(builder.getConfig().openKit.random).toBe(random);
    });

    describe('loggerFactory', () => {
        it('should set the logging factory', () => {
            const loggerFactory = new StubLoggerFactory();

            builder.withLoggerFactory(loggerFactory);

            expect(builder.getConfig().openKit.loggerFactory).toBe(
                loggerFactory,
            );
        });

        it('should set a default logging factory if none is configured', () => {
            expect(builder.getConfig().openKit.loggerFactory).toBeInstanceOf(
                ConsoleLoggerFactory,
            );
        });
    });

    it('should set multiple values at once', () => {
        const config = builder
            .withOperatingSystem('Arch')
            .withDataCollectionLevel(DataCollectionLevel.UserBehavior)
            .withCrashReportingLevel(CrashReportingLevel.OptOutCrashes)
            .withApplicationName('App Name')
            .withApplicationVersion('5.6.7')
            .getConfig();

        expect(config.openKit.deviceId).toEqual('-42');
        expect(config.meta.operatingSystem).toEqual('Arch');
        expect(config.privacy.dataCollectionLevel).toEqual(
            DataCollectionLevel.UserBehavior,
        );
        expect(config.privacy.crashReportingLevel).toEqual(
            CrashReportingLevel.OptOutCrashes,
        );
        expect(config.meta.applicationName).toEqual('App Name');
        expect(config.meta.applicationVersion).toEqual('5.6.7');
    });

    it('should return an openkit instance', () => {
        const ok = builder
            .withDataCollectionLevel(DataCollectionLevel.Off)
            .withCommunicationChannel(new StubCommunicationChannel())
            .withLoggerFactory(defaultNullLoggerFactory)
            .build();

        expect(ok).toBeInstanceOf(OpenKitImpl);
    });

    describe('logLevel', () => {
        it('should set the log level', () => {
            builder.withLogLevel(LogLevel.Warn);

            const config = builder.getConfig();
            const factory = config.openKit
                .loggerFactory as ConsoleLoggerFactory;

            expect(factory._logLevel).toBe(LogLevel.Warn);
        });
    });

    describe('sendingStrategies', () => {
        it('should set strategies if the browser is used', () => {
            const strategies = builder.getConfig().openKit.sendingStrategies;

            expect(strategies.length).toBeGreaterThan(0);
        });
    });

    describe('deviceId', () => {
        const randomNumberProvider: RandomNumberProvider = {
            nextPositiveInteger: () => 1337,
        };

        it('should generate a random device id, if the id is not a numeric string', () => {
            // given
            builder = new OpenKitBuilder(
                'https://example.com',
                '123',
                'not a numeric string',
            ).withRandomNumberProvider(randomNumberProvider);

            // when
            const config = builder.getConfig();

            // then
            expect(config.openKit.deviceId).toBe('1337');
        });

        it('should generate a random device id, if the dcl = Off', () => {
            // given
            builder = new OpenKitBuilder('https://example.com', '123', 12345)
                .withRandomNumberProvider(randomNumberProvider)
                .withDataCollectionLevel(DataCollectionLevel.Off);

            // when
            const config = builder.getConfig();

            // then
            expect(config.openKit.deviceId).toBe('1337');
        });

        it('should generate a random device id, if the dcl = Performance', () => {
            // given
            builder = new OpenKitBuilder('https://example.com', '123', 12345)
                .withRandomNumberProvider(randomNumberProvider)
                .withDataCollectionLevel(DataCollectionLevel.Performance);

            // when
            const config = builder.getConfig();

            // then
            expect(config.openKit.deviceId).toBe('1337');
        });

        it('should remove a "+" from the start of a device id', () => {
            // given
            builder = new OpenKitBuilder(
                'https://example.com',
                '123',
                '+12345',
            );

            // when
            const config = builder.getConfig();

            // then
            expect(config.openKit.deviceId).toBe('12345');
        });

        it('should generate a random device id, if there is a "+" in the device id, which is not at the start', () => {
            // given
            builder = new OpenKitBuilder(
                'https://example.com',
                '123',
                '12+431',
            ).withRandomNumberProvider(randomNumberProvider);

            // when
            const config = builder.getConfig();

            // then
            expect(config.openKit.deviceId).toBe('1337');
        });

        it('should generate a random device id, if there is a "+" at the start, but no number', () => {
            // given
            builder = new OpenKitBuilder(
                'https://example.com',
                '123',
                '+',
            ).withRandomNumberProvider(randomNumberProvider);

            // when
            const config = builder.getConfig();

            // then
            expect(config.openKit.deviceId).toBe('1337');
        });

        it('should use the device id if it is negative', () => {
            // given
            builder = new OpenKitBuilder(
                'https://example.com',
                '123',
                '-54321',
            ).withRandomNumberProvider(randomNumberProvider);

            // when
            const config = builder.getConfig();

            // then
            expect(config.openKit.deviceId).toBe('-54321');
        });

        it('should generate a random device id, if the number is longer than 19 characters', () => {
            // given
            builder = new OpenKitBuilder(
                'https://example.com',
                '123',
                '-11111222223333344444',
            ).withRandomNumberProvider(randomNumberProvider);

            // when
            const config = builder.getConfig();

            // then
            expect(config.openKit.deviceId).toBe('1337');
        });

        it('should use the device id, if it is 19 characters and negative', () => {
            // given
            builder = new OpenKitBuilder(
                'https://example.com',
                '123',
                '-1111122222333334444',
            ).withRandomNumberProvider(randomNumberProvider);

            // when
            const config = builder.getConfig();

            // then
            expect(config.openKit.deviceId).toBe('-1111122222333334444');
        });

        it('should use the device id, if it is 19 characters and positive', () => {
            // given
            builder = new OpenKitBuilder(
                'https://example.com',
                '123',
                '1111122222333334444',
            ).withRandomNumberProvider(randomNumberProvider);

            // when
            const config = builder.getConfig();

            // then
            expect(config.openKit.deviceId).toBe('1111122222333334444');
        });

        it('should use the device id, if it is 1 character', () => {
            // given
            builder = new OpenKitBuilder(
                'https://example.com',
                '123',
                '5',
            ).withRandomNumberProvider(randomNumberProvider);

            // when
            const config = builder.getConfig();

            // then
            expect(config.openKit.deviceId).toBe('5');
        });
    });

    describe('additional metadata', () => {
        describe('manufacturer', () => {
            it('should update the manufacturer if it is a valid string', () => {
                // when
                builder.withManufacturer('Dynatrace');

                // then
                expect(builder.getConfig().device.manufacturer).toEqual(
                    'Dynatrace',
                );
            });

            it('should not update the manufacturer if it is not a valid string', () => {
                // given
                const invalidOptions: any = [
                    NaN,
                    1234,
                    {},
                    builder,
                    true,
                    false,
                    [],
                ];

                invalidOptions.forEach((value: any) => {
                    // when
                    builder.withManufacturer(value as string);

                    // then
                    expect(builder.getConfig().device.manufacturer).not.toEqual(
                        String(value),
                    );
                    expect(builder.getConfig().device.manufacturer).not.toEqual(
                        value,
                    );
                });

                // then
                expect(builder.getConfig().device.manufacturer).toBeUndefined();
            });

            it('should not update the manufacturer if it is an empty string', () => {
                // when
                builder.withManufacturer('');

                // then
                expect(builder.getConfig().device.manufacturer).not.toEqual('');
                expect(builder.getConfig().device.manufacturer).toBeUndefined();
            });

            it('should truncate a manufacturer over 250 characters', () => {
                // given
                const validName = 'a'.repeat(250);
                const tooLongName = validName + 'b';

                // when
                builder.withManufacturer(tooLongName);

                // then
                expect(builder.getConfig().device.manufacturer).toEqual(
                    validName,
                );
            });

            it('should return the same instance', () => {
                // when, then
                expect(builder.withManufacturer('Dynatrace')).toBe(builder);
            });
        });

        describe('modelId', () => {
            it('should update the modelId if it is a valid string', () => {
                // when
                builder.withModelId('Dynatrace');

                // then
                expect(builder.getConfig().device.modelId).toEqual('Dynatrace');
            });

            it('should not update the modelId if it is not a valid string', () => {
                // given
                const invalidOptions: any = [
                    NaN,
                    1234,
                    {},
                    builder,
                    true,
                    false,
                    [],
                ];

                invalidOptions.forEach((value: any) => {
                    // when
                    builder.withModelId(value as string);

                    // then
                    expect(builder.getConfig().device.modelId).not.toEqual(
                        String(value),
                    );
                    expect(builder.getConfig().device.modelId).not.toEqual(
                        value,
                    );
                });

                // then
                expect(builder.getConfig().device.modelId).toBeUndefined();
            });

            it('should not update the modelId if it is an empty string', () => {
                // when
                builder.withModelId('');

                // then
                expect(builder.getConfig().device.modelId).not.toEqual('');
                expect(builder.getConfig().device.modelId).toBeUndefined();
            });

            it('should truncate a modelId over 250 characters', () => {
                // given
                const validName = 'a'.repeat(250);
                const tooLongName = validName + 'b';

                // when
                builder.withModelId(tooLongName);

                // then
                expect(builder.getConfig().device.modelId).toEqual(validName);
            });

            it('should return the same instance', () => {
                // when, then
                expect(builder.withModelId('Dynatrace')).toBe(builder);
            });
        });

        describe('userLanguage', () => {
            it('should update the userLanguage if it is a valid string', () => {
                // when
                builder.withUserLanguage('Dynatrace');

                // then
                expect(builder.getConfig().device.userLanguage).toEqual(
                    'Dynatrace',
                );
            });

            it('should not update the userLanguage if it is not a valid string', () => {
                // given
                const invalidOptions: any = [
                    NaN,
                    1234,
                    {},
                    builder,
                    true,
                    false,
                    [],
                ];

                invalidOptions.forEach((value: any) => {
                    // when
                    builder.withUserLanguage(value as string);

                    // then
                    expect(builder.getConfig().device.userLanguage).not.toEqual(
                        String(value),
                    );
                    expect(builder.getConfig().device.userLanguage).not.toEqual(
                        value,
                    );
                });

                // then
                expect(builder.getConfig().device.userLanguage).toBeUndefined();
            });

            it('should not update the userLanguage if it is an empty string', () => {
                // when
                builder.withUserLanguage('');

                // then
                expect(builder.getConfig().device.userLanguage).not.toEqual('');
                expect(builder.getConfig().device.userLanguage).toBeUndefined();
            });
        });

        describe('screenResolution', () => {
            it('should update the screen resolution properties with valid values', () => {
                // when
                builder.withScreenResolution(1200, 900);

                // then
                expect(builder.getConfig().device.screenWidth).toBe(1200);
                expect(builder.getConfig().device.screenHeight).toBe(900);
            });

            it('should update the screen resolution properties with valid numbers as string', () => {
                // when
                // @ts-ignore
                builder.withScreenResolution('1200', '900');

                // then
                expect(builder.getConfig().device.screenWidth).toBe(1200);
                expect(builder.getConfig().device.screenHeight).toBe(900);
            });

            it('should not update if width or height is not a finite number or positive', () => {
                // given
                const invalidInputs = [
                    NaN,
                    Infinity,
                    -Infinity,
                    'some string',
                    {},
                    -42,
                ];

                invalidInputs.forEach((width) => {
                    // when
                    builder
                        .withScreenResolution(width as number, 900)
                        .getConfig();

                    // then
                    expect(
                        builder.getConfig().device.screenWidth,
                    ).toBeUndefined();
                    expect(
                        builder.getConfig().device.screenHeight,
                    ).toBeUndefined();
                });

                invalidInputs.forEach((height) => {
                    // when
                    builder
                        .withScreenResolution(1200, height as number)
                        .getConfig();

                    // then
                    expect(
                        builder.getConfig().device.screenWidth,
                    ).toBeUndefined();
                    expect(
                        builder.getConfig().device.screenHeight,
                    ).toBeUndefined();
                });
            });
        });

        describe('screen orientation', () => {
            it('should allow Portrait and Landscape as valid values', () => {
                // given
                const validInputs = [
                    Orientation.Portrait,
                    Orientation.Landscape,
                ];

                validInputs.forEach((orientation) => {
                    // when
                    builder.withScreenOrientation(orientation);

                    // then
                    expect(builder.getConfig().device.orientation).toBe(
                        orientation,
                    );
                });
            });

            it('should ignore any other values', () => {
                // given
                const invalidInputs = [-1, 0, 1, 'some string', NaN];

                invalidInputs.forEach((invalidInput) => {
                    // when
                    builder.withScreenOrientation(invalidInput as Orientation);

                    // then
                    expect(
                        builder.getConfig().device.orientation,
                    ).toBeUndefined();
                });
            });
        });
    });
});
