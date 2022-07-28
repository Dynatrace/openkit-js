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
import { SEND_TIMESTAMP_PLACEHOLDER } from '../../../src/core/utils/EventPayloadUtils';

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
            expect(payloadJson['dt.application_id']).toEqual('application-id');
            expect(payloadJson['event.kind']).toEqual('RUM_EVENT');
            expect(payloadJson['dt.send_timestamp']).toEqual(
                SEND_TIMESTAMP_PLACEHOLDER,
            );
            expect(payloadJson['dt.instance_id']).toEqual('42');
            expect(payloadJson['dt.sid']).toEqual('1234');
            expect(payloadJson['dt.agent.version']).toEqual(openKitVersion);
            expect(payloadJson['dt.agent.technology_type']).toEqual('openkit');
            expect(payloadJson['dt.agent.flavor']).toEqual('nodejs');

            expect(payloadJson['app.version']).toEqual('1.0');
            expect(payloadJson['os.name']).toEqual('dynaOS');
            expect(payloadJson['device.manufacturer']).toEqual('dynatrace');
            expect(payloadJson['device.model.identifier']).toEqual('dynaPhone');
            expect(payloadJson['window.orientation']).toEqual(
                Orientation.Landscape,
            );
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
            expect(payloadJson['dt.application_id']).toEqual('application-id');
            expect(payloadJson['event.kind']).toEqual('RUM_EVENT');
            expect(payloadJson['dt.send_timestamp']).toEqual(
                SEND_TIMESTAMP_PLACEHOLDER,
            );
            expect(payloadJson['dt.instance_id']).toEqual('42');
            expect(payloadJson['dt.sid']).toEqual('1234');
            expect(payloadJson['dt.agent.version']).toEqual(openKitVersion);
            expect(payloadJson['dt.agent.technology_type']).toEqual('openkit');
            expect(payloadJson['dt.agent.flavor']).toEqual('nodejs');

            // Not available as they are not provided in the config
            expect(payloadJson['app.version']).toEqual(undefined);
            expect(payloadJson['os.name']).toEqual(undefined);
            expect(payloadJson['device.manufacturer']).toEqual(undefined);
            expect(payloadJson['device.model.identifier']).toEqual(undefined);
            expect(payloadJson['window.orientation']).toEqual(undefined);
        });

        it('should not be possible to override dt.sid', () => {
            // given
            const predefinedAttributes = {
                'dt.sid': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.sid']).toEqual('1234');
            expect(payloadJson['dt.overridden_keys']).toEqual(undefined);
        });

        it('should not be possible to override dt.instance_id', () => {
            // given
            const predefinedAttributes = {
                'dt.instance_id': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.instance_id']).toEqual('42');
            expect(payloadJson['dt.overridden_keys']).toEqual(undefined);
        });

        it('should not be possible to override dt.send_timestamp', () => {
            // given
            const predefinedAttributes = {
                'dt.send_timestamp': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.send_timestamp']).toEqual(
                SEND_TIMESTAMP_PLACEHOLDER,
            );
            expect(payloadJson['dt.overridden_keys']).toEqual(undefined);
        });

        it('should not be possible to override dt.application_id', () => {
            // given
            const predefinedAttributes = {
                'dt.application_id': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.application_id']).toEqual('application-id');
            expect(payloadJson['dt.overridden_keys']).toEqual(undefined);
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
            expect(payloadJson['dt.overridden_keys']).toEqual(['timestamp']);
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
            expect(payloadJson['dt.overridden_keys']).toEqual(['event.kind']);
        });

        it('should be possible to override dt.agent.version', () => {
            // given
            const predefinedAttributes = {
                'dt.agent.version': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.agent.version']).toEqual('overridden');
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'dt.agent.version',
            ]);
        });

        it('should be possible to override dt.agent.technology_type', () => {
            // given
            const predefinedAttributes = {
                'dt.agent.technology_type': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.agent.technology_type']).toEqual(
                'overridden',
            );
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'dt.agent.technology_type',
            ]);
        });

        it('should be possible to override dt.agent.flavor', () => {
            // given
            const predefinedAttributes = {
                'dt.agent.flavor': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.agent.flavor']).toEqual('overridden');
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'dt.agent.flavor',
            ]);
        });

        it('should be possible to override window.orientation', () => {
            // given
            const predefinedAttributes = {
                'window.orientation': 'overridden',
            };

            // then
            const payload = eventPayload.getCustomEventsPayload(
                'customName',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['window.orientation']).toEqual('overridden');
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'window.orientation',
            ]);
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
            expect(payloadJson['dt.overridden_keys']).toEqual(['os.name']);
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
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'device.manufacturer',
            ]);
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
            expect(payloadJson['dt.overridden_keys']).toEqual(['app.version']);
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
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'device.model.identifier',
            ]);
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
                'dt.application_id': 'myID',
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
            expect(payload).toContain('dt.application_id');
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
            expect(payloadJson['dt.application_id']).toEqual('application-id');
            expect(payloadJson['event.kind']).toEqual('BIZ_EVENT');
            expect(payloadJson['dt.send_timestamp']).toEqual(
                SEND_TIMESTAMP_PLACEHOLDER,
            );
            expect(payloadJson['dt.instance_id']).toEqual('42');
            expect(payloadJson['dt.sid']).toEqual('1234');
            expect(payloadJson['dt.agent.version']).toEqual(openKitVersion);
            expect(payloadJson['dt.agent.technology_type']).toEqual('openkit');
            expect(payloadJson['dt.agent.flavor']).toEqual('nodejs');

            expect(payloadJson['app.version']).toEqual('1.0');
            expect(payloadJson['os.name']).toEqual('dynaOS');
            expect(payloadJson['device.manufacturer']).toEqual('dynatrace');
            expect(payloadJson['device.model.identifier']).toEqual('dynaPhone');
            expect(payloadJson['window.orientation']).toEqual(
                Orientation.Landscape,
            );
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
            expect(payloadJson['dt.application_id']).toEqual('application-id');
            expect(payloadJson['event.kind']).toEqual('BIZ_EVENT');
            expect(payloadJson['dt.send_timestamp']).toEqual(
                SEND_TIMESTAMP_PLACEHOLDER,
            );
            expect(payloadJson['dt.instance_id']).toEqual('42');
            expect(payloadJson['dt.sid']).toEqual('1234');
            expect(payloadJson['dt.agent.version']).toEqual(openKitVersion);
            expect(payloadJson['dt.agent.technology_type']).toEqual('openkit');
            expect(payloadJson['dt.agent.flavor']).toEqual('nodejs');

            // Not available as they are not provided in the config
            expect(payloadJson['app.version']).toEqual(undefined);
            expect(payloadJson['os.name']).toEqual(undefined);
            expect(payloadJson['device.manufacturer']).toEqual(undefined);
            expect(payloadJson['device.model.identifier']).toEqual(undefined);
            expect(payloadJson['window.orientation']).toEqual(undefined);
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
            expect(payloadJson['dt.overridden_keys']).toEqual(undefined);
        });

        it('should not be possible to override dt.sid', () => {
            // given
            const predefinedAttributes = {
                'dt.sid': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.sid']).toEqual('1234');
            expect(payloadJson['dt.overridden_keys']).toEqual(undefined);
        });

        it('should not be possible to override dt.instance_id', () => {
            // given
            const predefinedAttributes = {
                'dt.instance_id': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.instance_id']).toEqual('42');
            expect(payloadJson['dt.overridden_keys']).toEqual(undefined);
        });

        it('should not be possible to override dt.send_timestamp', () => {
            // given
            const predefinedAttributes = {
                'dt.send_timestamp': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.send_timestamp']).toEqual(
                SEND_TIMESTAMP_PLACEHOLDER,
            );
            expect(payloadJson['dt.overridden_keys']).toEqual(undefined);
        });

        it('should not be possible to override dt.application_id', () => {
            // given
            const predefinedAttributes = {
                'dt.application_id': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.application_id']).toEqual('application-id');
            expect(payloadJson['dt.overridden_keys']).toEqual(undefined);
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
            expect(payloadJson['dt.overridden_keys']).toEqual(['timestamp']);
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
            expect(payloadJson['dt.overridden_keys']).toEqual(undefined);
        });

        it('should be possible to override dt.agent.version', () => {
            // given
            const predefinedAttributes = {
                'dt.agent.version': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.agent.version']).toEqual('overridden');
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'dt.agent.version',
            ]);
        });

        it('should be possible to override dt.agent.technology_type', () => {
            // given
            const predefinedAttributes = {
                'dt.agent.technology_type': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.agent.technology_type']).toEqual(
                'overridden',
            );
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'dt.agent.technology_type',
            ]);
        });

        it('should be possible to override dt.agent.flavor', () => {
            // given
            const predefinedAttributes = {
                'dt.agent.flavor': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['dt.agent.flavor']).toEqual('overridden');
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'dt.agent.flavor',
            ]);
        });

        it('should be possible to override window.orientation', () => {
            // given
            const predefinedAttributes = {
                'window.orientation': 'overridden',
            };

            // then
            const payload = eventPayload.getBizEventsPayload(
                'customType',
                predefinedAttributes,
                1234,
            );
            const payloadJson = JSON.parse(payload);

            expect(payloadJson['window.orientation']).toEqual('overridden');
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'window.orientation',
            ]);
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
            expect(payloadJson['dt.overridden_keys']).toEqual(['os.name']);
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
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'device.manufacturer',
            ]);
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
            expect(payloadJson['dt.overridden_keys']).toEqual(['app.version']);
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
            expect(payloadJson['dt.overridden_keys']).toEqual([
                'device.model.identifier',
            ]);
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
                'dt.application_id': 'myID',
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
            expect(payload).toContain('dt.application_id');
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

            expect(payload).toContain('dt.application_id');
            expect(payload).toContain('customType');
        });
    });
});
