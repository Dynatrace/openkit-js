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

import { InitCallback } from '../..';
import { Logger, StatusResponse } from '../../api';
import { CallbackHolder } from '../utils/CallbackHolder';
import { State } from './State';

/**
 * Status of an {@see OpenKitObject}.
 */
export const enum Status {
    Idle,
    Initialized,
    Shutdown,
}

/**
 * Common base for all OpenKit-Objects which should be initialized async.
 */
export abstract class OpenKitObject {
    public readonly state: State;
    protected readonly logger: Logger;
    private readonly initCallbackHolder = new CallbackHolder<boolean>();

    private _status: Status = Status.Idle;
    public get status(): Status {
        return this._status;
    }

    protected constructor(state: State, logger: Logger) {
        this.state = state;
        this.logger = logger;
    }

    /**
     * Finish the initialization.
     * Does only execute if the object has not yet been initialized.
     * Calls all registered callbacks with the new status.
     *
     * @param response The response which finishes the initialization.
     */
    public finishInitialization(response: StatusResponse): void {
        if (this._status !== Status.Idle) {
            this.logger.debug(`Can't initialize because state is ${this._status}`);

            return;
        }

        if (response.valid === false) {
            this.shutdown();
            this.initCallbackHolder.resolve(false);

            this.logger.warn('Failed to initialize, because response was invalid', response);

            return;
        }

        this.state.updateFromResponse(response);
        this.state.setServerIdLocked();
        this._status = Status.Initialized;
        this.initCallbackHolder.resolve(true);
    }

    /**
     * Set the status to shutdown, and call all registered callbacks that the object did not initialize.
     */
    public shutdown(): void {
        this.logger.debug('Shutting down');

        this._status = Status.Shutdown;
    }

    public waitForInit(callback: InitCallback, timeout?: number): void {
        // Trivial case: We already initialized and the waitForInit comes after initialization. We can resolve
        // immediately and synchronous.
        if (this.status !== Status.Idle) {
            callback(this.status === Status.Initialized);
            return;
        }

        if (timeout !== undefined) {
            // Init with timeout: We setup a timeout which resolves after X milliseconds. If the callback triggers,
            // we clear it, and check if the callback is still in the callback holder. If it is, it was not resolved,
            // so we can execute it, and remove it from the callback holder, so it can't get executed again.
            const wait = setTimeout(() => {
                if (this.initCallbackHolder.contains(callback)) {
                    clearTimeout(wait);
                    callback(false);
                    this.initCallbackHolder.remove(callback);
                }
            }, timeout);
        }

        // Add the callback to the initCallbackHolder, so it gets resolved once the initialization fails or succeeds,
        // for both cases with and without timeout.
        this.initCallbackHolder.add(callback);
    }
}
