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

import { CommunicationChannel, DataCollectionLevel, Logger, OpenKit, Session } from '../../api';
import { BeaconSender } from '../beacon.v2/BeaconSender';
import { Configuration } from '../config/Configuration';
import { IdProvider } from '../provider/IdProvider';
import { SequenceIdProvider } from '../provider/SequenceIdProvider';
import { SingleIdProvider } from '../provider/SingleIdProvider';
import { defaultNullSession } from './null/NullSession';
import { SessionImpl } from './SessionImpl';
import { State } from './State';
import { StateImpl } from './StateImpl';

/**
 * Implementation of the {@link OpenKit} interface.
 */
export class OpenKitImpl implements OpenKit {
    public readonly state: State;
    public readonly logger: Logger;

    private isShutdown = false;

    private readonly sessionIdProvider: IdProvider;
    private readonly communicationChannel: CommunicationChannel;

    private readonly beaconSender: BeaconSender;

    /**
     * Creates a new OpenKit instance with a copy of the configuration.
     * @param config The app configuration.
     */
    constructor(config: Configuration) {
        this.state = new StateImpl(config);
        this.logger = config.loggerFactory.createLogger('OpenKitImpl');

        this.communicationChannel = config.communicationChannel;

        this.sessionIdProvider = config.dataCollectionLevel === DataCollectionLevel.UserBehavior ?
            new SequenceIdProvider() : new SingleIdProvider(1);

        this.beaconSender = new BeaconSender(this.communicationChannel, config);

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

        if (this.isShutdown || this.state.isCaptureDisabled()) {
            return defaultNullSession;
        }

        const session = new SessionImpl(this, clientIP, this.sessionIdProvider.next());

        this.beaconSender.addSession(session);

        return session;
    }
}
