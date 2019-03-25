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

import { DataCollectionLevel, Logger, OpenKit, Session } from '../../api';
import { BeaconSender } from '../beacon/BeaconSender';
import { CommunicationStateImpl } from '../beacon/CommunicationStateImpl';
import { StaticPayloadBuilder as StaticPayloadBuilder } from '../payload/StaticPayloadBuilder';
import { Configuration, OpenKitConfiguration, PrivacyConfiguration } from '../config/Configuration';
import { Payload } from '../payload/Payload';
import { PayloadBuilder } from '../payload/PayloadBuilder';
import { IdProvider } from '../provider/IdProvider';
import { SequenceIdProvider } from '../provider/SequenceIdProvider';
import { SingleIdProvider } from '../provider/SingleIdProvider';
import { defaultTimestampProvider } from '../provider/TimestampProvider';
import { defaultNullSession } from './null/NullSession';
import { SessionImpl } from './SessionImpl';

const createIdProvider = (dcl: DataCollectionLevel) =>
    dcl === DataCollectionLevel.UserBehavior ? new SequenceIdProvider() : new SingleIdProvider(1);

/**
 * Implementation of the {@link OpenKit} interface.
 */
export class OpenKitImpl implements OpenKit {
    private readonly sessionIdProvider: IdProvider;
    private readonly beaconSender: BeaconSender;
    private readonly logger: Logger;
    private readonly applicationWidePrefix: Payload;

    private readonly sessionConfig: PrivacyConfiguration & OpenKitConfiguration;

    private isShutdown = false;

    /**
     * Creates a new OpenKit instance with a copy of the configuration.
     * @param config The app configuration.
     */
    constructor(private readonly config: Configuration) {
        this.logger = config.openKit.loggerFactory.createLogger('OpenKitImpl');

        this.sessionIdProvider = createIdProvider(config.privacy.dataCollectionLevel);
        this.sessionConfig = {...config.privacy, ...config.openKit};
        this.applicationWidePrefix = StaticPayloadBuilder.applicationWidePrefix(this.config);

        this.beaconSender = new BeaconSender(this, config.openKit);
    }

    /**
     * Starts initialization of the OpenKit instance.
     * If an invalid response is sent back, we shutdown.
     */
    public async initialize(): Promise<void> {
        this.beaconSender.init();
    }

    /**
     * @inheritDoc
     */
    public shutdown(): void {
        if (this.isShutdown) {
            return;
        }

        this.logger.debug('Shutting down');
        this.isShutdown = true;

        this.beaconSender.shutdown();
    }

    /**
     * @inheritDoc
     */
    public createSession(clientIP: string = ''): Session {
        // We always send the createSession-request to the server, even when DataCollectionLevel = Off, but no user
        // activity is recorded.

        if (this.isShutdown) {
            return defaultNullSession;
        }

        const sessionId = this.createSessionId();
        const sessionStartTime = defaultTimestampProvider.getCurrentTimestamp();
        const sessionPrefix = StaticPayloadBuilder.sessionPrefix(this.applicationWidePrefix, sessionId, clientIP, sessionStartTime);

        const sessionProperties = new CommunicationStateImpl();
        const payloadBuilder = new PayloadBuilder(sessionProperties);

        const session = new SessionImpl(sessionId, payloadBuilder, sessionStartTime, this.sessionConfig);

        this.beaconSender.addSession(session, sessionPrefix, payloadBuilder, sessionProperties);

        return session;
    }

    private createSessionId(): number {
        return this.sessionIdProvider.next();
    }
}
