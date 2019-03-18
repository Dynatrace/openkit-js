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

import {
    CommunicationChannel,
    DataCollectionLevel,
    defaultInvalidStatusResponse,
    InitCallback,
    OpenKit,
    Session,
    StatusResponse,
} from '../../api';
import { Configuration } from '../config/Configuration';
import { IdProvider } from '../provider/IdProvider';
import { SequenceIdProvider } from '../provider/SequenceIdProvider';
import { SingleIdProvider } from '../provider/SingleIdProvider';
import { removeElement } from '../utils/Utils';
import { defaultNullSession } from './NullSession';
import { OpenKitObject, Status } from './OpenKitObject';
import { SessionImpl } from './SessionImpl';
import { StateImpl } from './StateImpl';
import { StatusRequestImpl } from './StatusRequestImpl';

/**
 * Implementation of the {@link OpenKit} interface.
 */
export class OpenKitImpl extends OpenKitObject implements OpenKit {
    private readonly openSessions: Session[] = [];
    private readonly sessionIdProvider: IdProvider;
    private readonly communicationChannel: CommunicationChannel;

    /**
     * Creates a new OpenKit instance with a copy of the configuration.
     * @param config The app configuration.
     */
    constructor(config: Configuration) {
        super(new StateImpl({...config}), config.loggerFactory.createLogger('OpenKitImpl'));

        this.communicationChannel = config.communicationChannel;

        this.sessionIdProvider = config.dataCollectionLevel === DataCollectionLevel.UserBehavior ?
            new SequenceIdProvider() : new SingleIdProvider(1);
    }

    /**
     * Starts initialization of the OpenKit instance.
     * If an invalid response is sent back, we shutdown.
     */
    public async initialize(): Promise<void> {
        let response: StatusResponse;

        try {
            response = await this.communicationChannel.sendStatusRequest(
                this.state.config.beaconURL, StatusRequestImpl.from(this.state));
        } catch (exception) {
            this.logger.warn('Failed to initialize with exception', exception);
            response = defaultInvalidStatusResponse;
        }

        this.finishInitialization(response);
    }

    /**
     * @inheritDoc
     */
    public isInitialized(): boolean {
        return this.status === Status.Initialized;
    }

    /**
     * @inheritDoc
     */
    public shutdown(): void {
        // close all child-sessions and remove them from the array
        this.openSessions.forEach((session) => session.end());
        this.openSessions.splice(0, this.openSessions.length);

        super.shutdown();
    }

    /**
     * @inheritDoc
     */
    public createSession(clientIP: string = ''): Session {
        // We always send the createSession-request to the server, even when DataCollectionLevel = Off, but no user
        // activity is recorded.

        if (this.status === Status.Shutdown || this.state.isCaptureDisabled()) {
            return defaultNullSession;
        }

        const session = new SessionImpl(this, clientIP, this.sessionIdProvider.next());
        session.init();

        this.openSessions.push(session);

        return session;
    }

    /**
     * Removes a session from the openSessions array.
     */
    public removeSession(session: SessionImpl): void {
        removeElement(this.openSessions, session);
    }

    /**
     * @inheritDoc
     */
    public waitForInit(callback: InitCallback, timeout?: number): void {
        super.waitForInit(callback, timeout);
    }
}
