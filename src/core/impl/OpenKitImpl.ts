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

import {InitCallback, OpenKit} from '../../api/OpenKit';
import {Session} from '../../api/Session';
import {Configuration} from '../config/Configuration';
import {createLogger} from '../utils/Logger';
import {SequenceIdProvider} from '../utils/SequenceIdProvider';
import {removeElement} from '../utils/Utils';
import {OpenKitObject, Status, StatusCallback} from './OpenKitObject';
import {SessionImpl} from './SessionImpl';
import {State} from './State';

const log = createLogger('OpenKitImpl');

/**
 * Implementation of the {@link OpenKit} interface.
 */
export class OpenKitImpl extends OpenKitObject implements OpenKit {
    private readonly openSessions: Session[] = [];
    private readonly sessionIdProvider = new SequenceIdProvider();

    /**
     * Creates a new OpenKit instance with a copy of the configuration.
     * @param config The app configuration.
     */
    constructor(config: Configuration) {
        super(new State({...config}));
    }

    /**
     * Starts initialization of the OpenKit instance.
     * If an invalid response is sent back, we shutdown.
     */
    public async initialize(): Promise<void> {
        const response = await this.sender.sendStatusRequest();

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
        this.openSessions.forEach(session => session.end());

        super.shutdown();
    }

    /**
     * @inheritDoc
     */
    public waitForInit(callback: InitCallback, timeout?: number): void {
        const proxy = (status: Status) => callback(status === Status.Initialized);

        if (timeout === undefined) {
            this.registerOnInitializedCallback(proxy);
        } else {
            this.waitForInitWithTimeout(proxy, timeout);
        }
    }

    private waitForInitWithTimeout(callback: StatusCallback, timeout: number) {
        let timeoutId: any = -1;

        const proxy = (status: Status) => {
            callback(status);

            if (timeoutId !== -1) {
                // cleanTimeout could be window.clearTimeout or NodeJs.clearTimeout.
                // Since we do not know, we just pass the object in, since on one platform
                // there is always just one of the both
                clearTimeout(timeoutId);
            }
        };

        timeoutId = setTimeout(() => {
            callback(Status.Shutdown);
            this.unregisterOnInitializedCallback(proxy);
        }, timeout) as any;

        this.registerOnInitializedCallback(proxy);
    }

    /**
     * @inheritDoc
     */
    public createSession(clientIP: string = ''): Session {
        const session = new SessionImpl(this, clientIP, this.sessionIdProvider.getNextId());

        this.openSessions.push(session);

        log.debug(`Created session with ip='${clientIP}'`);

        return session;
    }

    /**
     * Removes a session from the openSessions array.
     */
    public removeSession(session: SessionImpl) {
        removeElement(this.openSessions, session);
    }
}
