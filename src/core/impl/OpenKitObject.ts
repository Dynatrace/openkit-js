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

import {BeaconSender} from '../beacon/BeaconSender';
import {StatusResponse} from '../beacon/StatusResponse';
import {removeElement} from '../utils/Utils';
import {State} from './State';

/**
 * Status of an {@see OpenKitObject}.
 */
export const enum Status {
    Idle,
    Initialized,
    Shutdown,
}

/**
 * Alias for {@see OpenKitObject} callbacks.
 */
export type StatusCallback = (status: Status) => void;

/**
 * Common base for all OpenKit-Objects which should be initialized async.
 */
export abstract class OpenKitObject {
    private _initializationListener: StatusCallback[] = [];

    public readonly state: State;
    public readonly sender: BeaconSender;

    private _status: Status = Status.Idle;
    public get status(): Status {
        return this._status;
    }

    protected constructor(state: State) {
        this.state = state;
        this.sender = new BeaconSender(state);
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

        if (!response.valid) {
            this.shutdown();
            return;
        }

        this.state.updateState(response);

        this._status = Status.Initialized;

        this.callInitCallbacks();
    }

    /**
     * Call all registered callbacks with the current status.
     */
    private callInitCallbacks() {
        this._initializationListener.forEach(cb => cb(this._status));
        this._initializationListener = [];
    }

    /**
     * Set the status to shutdown, and call all registered callbacks that the object did not initialize.
     */
    public shutdown() {
        this._status = Status.Shutdown;
        this.state.stopCommunication();
        this.callInitCallbacks();
    }

    /**
     * Register callback which is async after the object initialized, or synchron, if the object is
     * already initialized.
     *
     * @param callback The callback which should be executed after the object initialized.
     */
    public registerOnInitializedCallback(callback: StatusCallback) {
        if (this._status !== Status.Idle) {
            callback(this._status);
        } else {
            this._initializationListener.push(callback);
        }
    }

    /**
     * Unregister a callback. This is only possible if the callback has not been executed already.
     * @param callback The callback to unregister
     */
    public unregisterOnInitializedCallback(callback: StatusCallback) {
        removeElement(this._initializationListener, callback);
    }
}
