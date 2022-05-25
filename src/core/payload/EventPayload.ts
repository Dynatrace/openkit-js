import { JSONObject, Logger } from '../../api';
import { Configuration } from '../config/Configuration';
import { openKitVersion } from '../PlatformConstants';
import {
    defaultTimestampProvider,
    TimestampProvider,
} from '../provider/TimestampProvider';
import { SEND_TIMESTAMP_PLACEHOLDER } from '../utils/EventPayloadUtils';
import { isNode } from '../utils/Utils';
import {
    APP_VERSION,
    DEVICE_MANUFACTURER,
    DEVICE_MODEL_IDENTIFIER,
    DT_AGENT_FLAVOR,
    DT_AGENT_TECHNOLOGY_TYPE,
    DT_AGENT_VERSION,
    DT_TYPE,
    DT_TYPE_BIZ,
    DT_TYPE_CUSTOM,
    OS_NAME,
    TIMESTAMP,
    WINDOW_ORIENTATION,
} from './EventPayloadAttributes';

export class EventPayload {
    private readonly logger: Logger;

    constructor(
        private readonly config: Configuration,
        private readonly timestampProvider: TimestampProvider = defaultTimestampProvider,
    ) {
        this.logger = config.openKit.loggerFactory.createLogger('EventPayload');
    }

    public getBizEventsPayload(
        type: string,
        attributes: JSONObject,
        session: number,
    ): string {
        const internalAttributes = { ...attributes };

        this.addBasicEventData(internalAttributes, session);

        if (internalAttributes.name === undefined) {
            this.addNonOverridableAttribute(internalAttributes, 'name', type);
        }

        this.addNonOverridableAttribute(internalAttributes, 'type', type);
        this.addNonOverridableAttribute(
            internalAttributes,
            DT_TYPE,
            DT_TYPE_BIZ,
        );

        return this.getJsonStringPayload(internalAttributes);
    }

    public getCustomEventsPayload(
        name: string,
        attributes: JSONObject,
        session: number,
    ): string {
        const internalAttributes = { ...attributes };

        this.addBasicEventData(internalAttributes, session);

        this.addNonOverridableAttribute(internalAttributes, 'name', name);
        this.addOverridableAttribute(
            internalAttributes,
            DT_TYPE,
            DT_TYPE_CUSTOM,
        );

        return this.getJsonStringPayload(internalAttributes);
    }

    private getJsonStringPayload(attributes: JSONObject): string {
        return JSON.stringify({ ...attributes }, (key, value) => {
            if (
                Number.isNaN(value) ||
                value === Infinity ||
                value === -Infinity
            ) {
                return;
            }

            return value;
        });
    }

    private addBasicEventData(attributes: JSONObject, session: number): void {
        this.removeReservedInternalAttributes(attributes);

        this.addOverridableAttribute(
            attributes,
            TIMESTAMP,
            this.timestampProvider.getCurrentTimestampNs().toString(),
        );

        this.addNonOverridableAttribute(
            attributes,
            'dt.application_id',
            this.config.openKit.applicationId,
        );
        this.addNonOverridableAttribute(
            attributes,
            'dt.send_timestamp',
            SEND_TIMESTAMP_PLACEHOLDER,
        );
        this.addNonOverridableAttribute(
            attributes,
            'dt.instance_id',
            this.config.openKit.deviceId,
        );
        this.addNonOverridableAttribute(
            attributes,
            'dt.sid',
            session.toString(),
        );
        this.addOverridableAttribute(
            attributes,
            DT_AGENT_VERSION,
            openKitVersion,
        );
        this.addOverridableAttribute(
            attributes,
            DT_AGENT_TECHNOLOGY_TYPE,
            'openkit',
        );
        this.addOverridableAttribute(
            attributes,
            DT_AGENT_FLAVOR,
            isNode ? 'nodejs' : 'webjs',
        );

        this.addOverridableAttribute(
            attributes,
            APP_VERSION,
            this.config.meta.applicationVersion,
        );
        this.addOverridableAttribute(
            attributes,
            OS_NAME,
            this.config.meta.operatingSystem,
        );
        this.addOverridableAttribute(
            attributes,
            DEVICE_MANUFACTURER,
            this.config.device.manufacturer,
        );
        this.addOverridableAttribute(
            attributes,
            DEVICE_MODEL_IDENTIFIER,
            this.config.device.modelId,
        );
        this.addOverridableAttribute(
            attributes,
            WINDOW_ORIENTATION,
            this.config.device.orientation,
        );
    }

    private removeReservedInternalAttributes(attributes: JSONObject) {
        const jsonKeys = Object.keys(attributes);

        for (const key of jsonKeys) {
            if (
                key === 'dt' ||
                (key.startsWith('dt.') &&
                    !key.startsWith('dt.agent.') &&
                    key !== DT_TYPE)
            ) {
                this.logger.warn(
                    'getEventsPayload',
                    'key name dt or dt. is reserved. Data will be removed!',
                    { key },
                );

                delete attributes[key];
            }
        }
    }

    private addOverridableAttribute(
        attributes: JSONObject,
        key: string,
        value?: string,
    ) {
        if (value !== undefined) {
            if (key in attributes) {
                // Customer has overwritten this value
                if (!('dt.overridden_keys' in attributes)) {
                    attributes['dt.overridden_keys'] = [];
                }

                (attributes['dt.overridden_keys'] as string[]).push(key);
            } else {
                attributes[key] = value;
            }
        }
    }

    private addNonOverridableAttribute(
        attributes: JSONObject,
        key: string,
        value?: string,
    ) {
        if (value !== undefined) {
            if (key in attributes) {
                this.logger.warn(
                    'addAttribute',
                    `key ${key} is reserved. Custom data will be removed!`,
                    { key },
                );
            }

            attributes[key] = value;
        }
    }
}
