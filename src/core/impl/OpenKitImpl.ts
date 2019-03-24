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
import { BeaconSender } from '../beacon.v2/BeaconSender';
import { CommunicationStateImpl } from '../beacon.v2/CommunicationStateImpl';
import { StaticPayloadBuilder as StaticPayloadBuilder } from '../beacon/StaticPayloadBuilder';
import { Configuration } from '../config/Configuration';
import { PayloadBuilder } from '../payload.v2/PayloadBuilder';
import { IdProvider } from '../provider/IdProvider';
import { SequenceIdProvider } from '../provider/SequenceIdProvider';
import { SingleIdProvider } from '../provider/SingleIdProvider';
import { defaultTimestampProvider } from '../provider/TimestampProvider';
import { defaultNullSession } from './null/NullSession';
import { SessionImpl } from './SessionImpl';

/**
 * Implementation of the {@link OpenKit} interface.
 */
export class OpenKitImpl implements OpenKit {
    private readonly sessionIdProvider: IdProvider;
    private readonly beaconSender: BeaconSender;
    private readonly logger: Logger;

    private isShutdown = false;

    /**
     * Creates a new OpenKit instance with a copy of the configuration.
     * @param config The app configuration.
     */
    constructor(private readonly config: Configuration) {
        this.logger = config.openKit.loggerFactory.createLogger('OpenKitImpl');

        this.sessionIdProvider = config.privacy.dataCollectionLevel === DataCollectionLevel.UserBehavior ?
            new SequenceIdProvider() : new SingleIdProvider(1);

        this.beaconSender = new BeaconSender(config.openKit);

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

        const sessionProperties = new CommunicationStateImpl();

        const sessionId = this.createSessionId();
        const sessionStartTime = defaultTimestampProvider.getCurrentTimestamp();

        const prefix = StaticPayloadBuilder.prefix(this.config, sessionId, clientIP, sessionStartTime);
        const payloadBuilder = new PayloadBuilder(sessionProperties);

        const session = new SessionImpl(
            sessionId, payloadBuilder, sessionStartTime, {...this.config.privacy, ...this.config.openKit});
        this.beaconSender.addSession(session, prefix, payloadBuilder, sessionProperties);

        return session;
    }

    private createSessionId(): number {
        return this.sessionIdProvider.next();
    }
}
