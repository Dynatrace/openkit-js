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

import {Action} from '../../api/Action';
import {PayloadData} from '../beacon/PayloadData';
import {createLogger} from '../utils/Logger';
import {now} from '../utils/Utils';
import {SessionImpl} from './SessionImpl';

const log = createLogger('ActionImpl');

export class ActionImpl implements Action {
    private readonly beacon: PayloadData;

    private _duration: number = 0;
    public get duration(): number {
        return this._duration;
    }

    private readonly session: SessionImpl;
    public readonly name: string;
    public readonly startTime = now();
    public readonly startSequenceNumber: number;
    public readonly actionId: number;
    public endSequenceNumber?: number;

    constructor(session: SessionImpl, name: string, beacon: PayloadData) {
        this.session = session;
        this.name = name;
        this.beacon = beacon;
        this.startSequenceNumber = this.beacon.createSequenceNumber();
        this.actionId = this.beacon.createId();

        log.debug('Created', this);
    }

    public leaveAction(): null {
        log.debug('leaveAction()');

        this.endSequenceNumber = this.beacon.createSequenceNumber();
        this._duration = now() - this.startTime;
        this.beacon.addAction(this);
        this.session.removeAction(this);
        this.session.flush();

        return null;
    }
}
