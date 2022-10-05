import { instance, mock, reset, when } from 'ts-mockito';
import { Orientation } from '../../../src/api';
import { CrashReportingLevel } from '../../../src/api/CrashReportingLevel';
import { DataCollectionLevel } from '../../../src/api/DataCollectionLevel';
import { AbstractSendingStrategy } from '../../../src/core/beacon/strategies/SendingStrategy';
import { HttpCommunicationChannel } from '../../../src/core/communication/http/state/HttpCommunicationChannel';
import { Configuration } from '../../../src/core/config/Configuration';
import { defaultNullLoggerFactory } from '../../../src/core/logging/NullLoggerFactory';
import { EventPayload } from '../../../src/core/payload/EventPayload';
import { openKitVersion } from '../../../src/core/PlatformConstants';
import { DefaultRandomNumberProvider } from '../../../src/core/provider/DefaultRandomNumberProvider';
import { TimestampProvider } from '../../../src/core/provider/TimestampProvider';

describe('EventPayload', () => {
    let config: Configuration;
    const timestampProvider = mock(TimestampProvider);
    const random = mock(DefaultRandomNumberProvider);
    const comm = mock(HttpCommunicationChannel);
    const ss = mock(AbstractSendingStrategy);

    let eventPayload: EventPayload;

    beforeEach(() => {
        config = {
            openKit: {
                loggerFactory: defaultNullLoggerFactory,
                deviceId: '42',
                applicationId: 'application-id',
                random: instance(random),
                communicationChannel: instance(comm),
                sendingStrategies: [instance(ss)],
                beaconURL: 'http://example.com',
            },
            privacy: {
                crashReportingLevel: CrashReportingLevel.OptInCrashes,
                dataCollectionLevel: DataCollectionLevel.UserBehavior,
            },
            device: {
                manufacturer: 'dynatrace',
                modelId: 'dynaPhone',
                orientation: Orientation.Landscape,
            },
            meta: {
                applicationVersion: '1.0',
                operatingSystem: 'dynaOS',
            },
        };

        reset(timestampProvider);
        when(timestampProvider.getCurrentTimestampMs()).thenReturn(7000);
        when(timestampProvider.getCurrentTimestampNs()).thenReturn(7000000);
        eventPayload = new EventPayload(config, instance(timestampProvider));
    });

    describe('getCustomEventsPayload', () => {
        it('should provide enrichment data', () => {
            // given
            const predefinedAttributes = {
                'event.name': 'predefined',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['event.name']).toEqual('customName');
            expect(payloadJson.timestamp).toEqual(7000000);
            expect(payloadJson['dt.rum.application.id']).toEqual(
                'application-id',
            );
            expect(payloadJson['event.kind']).toEqual('RUM_EVENT');
            expect(payloadJson['dt.rum.instance.id']).toEqual('42');
            expect(payloadJson['dt.rum.sid']).toEqual('1234');
            expect(payloadJson['event.provider']).toEqual('application-id');

            expect(payloadJson['app.version']).toEqual('1.0');
            expect(payloadJson['os.name']).toEqual('dynaOS');
            expect(payloadJson['device.manufacturer']).toEqual('dynatrace');
            expect(payloadJson['device.model.identifier']).toEqual('dynaPhone');
        });

        it('should provide only enrichment data which is available', () => {
            // given
            const predefinedAttributes = {
                name: 'predefined',
            };

            const configAll = {
                openKit: {
                    loggerFactory: defaultNullLoggerFactory,
                    deviceId: '42',
                    applicationId: 'application-id',
                    random: instance(random),
                    communicationChannel: instance(comm),
                    sendingStrategies: [instance(ss)],
                    beaconURL: 'http://example.com',
                },
                privacy: {
                    crashReportingLevel: CrashReportingLevel.OptInCrashes,
                    dataCollectionLevel: DataCollectionLevel.UserBehavior,
                },
                device: {},
                meta: {},
            };

            const eventPayload = new EventPayload(
                configAll,
                instance(timestampProvider),
            );

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['event.name']).toEqual('customName');
            expect(payloadJson.timestamp).toEqual(7000000);
            expect(payloadJson['dt.rum.application.id']).toEqual(
                'application-id',
            );
            expect(payloadJson['event.kind']).toEqual('RUM_EVENT');
            expect(payloadJson['dt.rum.instance.id']).toEqual('42');
            expect(payloadJson['dt.rum.sid']).toEqual('1234');
            expect(payloadJson['dt.rum.schema_version']).toEqual('1.0');
            expect(payloadJson['event.provider']).toEqual('application-id');

            // Not available as they are not provided in the config
            expect(payloadJson['app.version']).toEqual(undefined);
            expect(payloadJson['os.name']).toEqual(undefined);
            expect(payloadJson['device.manufacturer']).toEqual(undefined);
            expect(payloadJson['device.model.identifier']).toEqual(undefined);
        });

        it('should not be possible to override dt.rum.sid', () => {
            // given
            const predefinedAttributes = {
                'dt.rum.sid': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.rum.sid']).toEqual('1234');
        });

        it('should not be possible to override dt.rum.instance.id', () => {
            // given
            const predefinedAttributes = {
                'dt.rum.instance.id': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.rum.instance.id']).toEqual('42');
        });

        it('should not be possible to override dt.rum.application.id', () => {
            // given
            const predefinedAttributes = {
                'dt.rum.application.id': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.rum.application.id']).toEqual(
                'application-id',
            );
        });

        it('should not be possible to override dt.rum.schema_version', () => {
            // given
            const predefinedAttributes = {
                'dt.rum.schema_version': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.rum.schema_version']).toEqual('1.0');
        });

        it('should be possible to override event.provider', () => {
            // given
            const predefinedAttributes = {
                'event.provider': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['event.provider']).toEqual('overridden');
        });

        it('should be possible to override timestamp', () => {
            // given
            const predefinedAttributes = {
                timestamp: 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson.timestamp).toEqual('overridden');
        });

        it('should be possible to override dt.type', () => {
            // given
            const predefinedAttributes = {
                'event.kind': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['event.kind']).toEqual('overridden');
        });

        it('should be possible to override os.name', () => {
            // given
            const predefinedAttributes = {
                'os.name': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['os.name']).toEqual('overridden');
        });

        it('should be possible to override device.manufacturer', () => {
            // given
            const predefinedAttributes = {
                'device.manufacturer': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['device.manufacturer']).toEqual('overridden');
        });

        it('should be possible to override app.version', () => {
            // given
            const predefinedAttributes = {
                'app.version': '2.0',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['app.version']).toEqual('2.0');
        });

        it('should be possible to override device.model.identifier', () => {
            // given
            const predefinedAttributes = {
                'device.model.identifier': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['device.model.identifier']).toEqual(
                'overridden',
            );
        });

        it('should override the name', () => {
            // given
            const predefinedAttributes = {
                'event.name': 'predefined',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            expect(payload).not.toContain('predefined');
            expect(payload).toContain('customName');
        });

        it('should remove predefined dt values', () => {
            // given
            const predefinedAttributes = {
                'dt.test': 'test',
                'dt.rum.application.id': 'myID',
                'dt': {
                    test: 'test',
                },
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            expect(payload).not.toContain('dt.test');
            expect(payload).not.toContain('dt:');
            expect(payload).not.toContain('myID');
            expect(payload).toContain('dt.rum.application.id');
            expect(payload).toContain('customName');
        });
    });

    describe('getBizEventsPayload', () => {
        it('should provide enrichment data', () => {
            // given
            const predefinedAttributes = {
                'event.name': 'predefined',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['event.name']).toEqual('predefined');
            expect(payloadJson['event.type']).toEqual('customType');
            expect(payloadJson.timestamp).toEqual(7000000);
            expect(payloadJson['dt.rum.application.id']).toEqual(
                'application-id',
            );
            expect(payloadJson['event.kind']).toEqual('BIZ_EVENT');
            expect(payloadJson['dt.rum.instance.id']).toEqual('42');
            expect(payloadJson['dt.rum.sid']).toEqual('1234');
            expect(payloadJson['dt.rum.schema_version']).toEqual('1.0');
            expect(payloadJson['event.provider']).toEqual('application-id');

            expect(payloadJson['app.version']).toEqual('1.0');
            expect(payloadJson['os.name']).toEqual('dynaOS');
            expect(payloadJson['device.manufacturer']).toEqual('dynatrace');
            expect(payloadJson['device.model.identifier']).toEqual('dynaPhone');
        });

        it('should provide only enrichment data which is available', () => {
            // given
            const predefinedAttributes = {
                'event.name': 'predefined',
            };

            const configAll = {
                openKit: {
                    loggerFactory: defaultNullLoggerFactory,
                    deviceId: '42',
                    applicationId: 'application-id',
                    random: instance(random),
                    communicationChannel: instance(comm),
                    sendingStrategies: [instance(ss)],
                    beaconURL: 'http://example.com',
                },
                privacy: {
                    crashReportingLevel: CrashReportingLevel.OptInCrashes,
                    dataCollectionLevel: DataCollectionLevel.UserBehavior,
                },
                device: {},
                meta: {},
            };

            const eventPayload = new EventPayload(
                configAll,
                instance(timestampProvider),
            );

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['event.name']).toEqual('predefined');
            expect(payloadJson['event.type']).toEqual('customType');
            expect(payloadJson.timestamp).toEqual(7000000);
            expect(payloadJson['dt.rum.application.id']).toEqual(
                'application-id',
            );
            expect(payloadJson['event.kind']).toEqual('BIZ_EVENT');
            expect(payloadJson['dt.rum.instance.id']).toEqual('42');
            expect(payloadJson['dt.rum.sid']).toEqual('1234');
            expect(payloadJson['dt.rum.schema_version']).toEqual('1.0');
            expect(payloadJson['event.provider']).toEqual('application-id');

            // Not available as they are not provided in the config
            expect(payloadJson['app.version']).toEqual(undefined);
            expect(payloadJson['os.name']).toEqual(undefined);
            expect(payloadJson['device.manufacturer']).toEqual(undefined);
            expect(payloadJson['device.model.identifier']).toEqual(undefined);
        });

        it('should take the type as name if name is not available', () => {
            // given
            const predefinedAttributes = {};

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['event.name']).toEqual('customType');
            expect(payloadJson['event.type']).toEqual('customType');
        });

        it('should not be possible to override dt.rum.sid', () => {
            // given
            const predefinedAttributes = {
                'dt.rum.sid': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.rum.sid']).toEqual('1234');
        });

        it('should not be possible to override dt.rum.instance.id', () => {
            // given
            const predefinedAttributes = {
                'dt.rum.instance.id': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.rum.instance.id']).toEqual('42');
        });

        it('should not be possible to override dt.rum.application.id', () => {
            // given
            const predefinedAttributes = {
                'dt.rum.application.id': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.rum.application.id']).toEqual(
                'application-id',
            );
        });

        it('should not be possible to override dt.rum.schema_version', () => {
            // given
            const predefinedAttributes = {
                'dt.rum.schema_version': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.rum.schema_version']).toEqual('1.0');
        });

        it('should be possible to override event.provider', () => {
            // given
            const predefinedAttributes = {
                'event.provider': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['event.provider']).toEqual('overridden');
        });

        it('should be possible to override timestamp', () => {
            // given
            const predefinedAttributes = {
                timestamp: 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson.timestamp).toEqual('overridden');
        });

        it('should not be possible to override dt.type', () => {
            // given
            const predefinedAttributes = {
                'dt.type': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['event.kind']).toEqual('BIZ_EVENT');
        });

        it('should be possible to override os.name', () => {
            // given
            const predefinedAttributes = {
                'os.name': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['os.name']).toEqual('overridden');
        });

        it('should be possible to override device.manufacturer', () => {
            // given
            const predefinedAttributes = {
                'device.manufacturer': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['device.manufacturer']).toEqual('overridden');
        });

        it('should be possible to override app.version', () => {
            // given
            const predefinedAttributes = {
                'app.version': '2.0',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['app.version']).toEqual('2.0');
        });

        it('should be possible to override device.model.identifier', () => {
            // given
            const predefinedAttributes = {
                'device.model.identifier': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['device.model.identifier']).toEqual(
                'overridden',
            );
        });

        it('should override the name', () => {
            // given
            const predefinedAttributes = {
                name: 'predefined',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            expect(payload).not.toContain('"name":"customType"');
            expect(payload).toContain('customType');
        });

        it('should remove predefined dt values', () => {
            // given
            const predefinedAttributes = {
                'dt.test': 'test',
                'dt.rum.application.id': 'myID',
                'dt': {
                    test: 'test',
                },
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            expect(payload).not.toContain('dt.test');
            expect(payload).not.toContain('dt:');
            expect(payload).not.toContain('myID');
            expect(payload).toContain('dt.rum.application.id');
            expect(payload).toContain('customType');
        });

        it('should create payload even if attributes are null', () => {
            // given
            const predefinedAttributes = null;

            // then
            // @ts-ignore
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                // @ts-ignore
                predefinedAttributes,
                1234,
            );

            expect(payload).toContain('dt.rum.application.id');
            expect(payload).toContain('customType');
        });
    });
});
