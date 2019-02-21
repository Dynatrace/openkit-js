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

import { StatusResponse } from '../../api/communication/StatusResponse';
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
    private readonly callbackManager = new CallbackHolder<boolean>();

    private _status: Status = Status.Idle;
    public get status(): Status {
        return this._status;
    }

    protected constructor(state: State) {
        this.state = state;
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
            return;
        }

        if (response.valid === false) {
            this.shutdown();
            this.callbackManager.resolve(false);
            return;
        }

        this.state.updateState(response);
        this._status = Status.Initialized;
        this.callbackManager.resolve(true);
    }

    /**
     * Set the status to shutdown, and call all registered callbacks that the object did not initialize.
     */
    public shutdown(): void {
        this._status = Status.Shutdown;
        this.state.stopCommunication();
    }

    public waitForInit(timeout?: number): Promise<boolean> {
        if (this.status !== Status.Idle) {
            return Promise.resolve(true);
        }

        return new Promise<boolean>((res) => {
            if (timeout !== undefined) {
                const wait = setTimeout(() => {
                    clearTimeout(wait);
                    res(false);
                    this.callbackManager.remove(res);
                }, timeout);
            }

            this.callbackManager.add(res);
        });
    }
}
