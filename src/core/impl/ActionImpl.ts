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

import { Action } from '../../api/Action';
import { DataCollectionLevel } from '../../DataCollectionLevel';
import { PayloadData } from '../beacon/PayloadData';
import { defaultTimestampProvider, TimestampProvider } from '../provider/TimestampProvider';
import { createLogger } from '../utils/Logger';
import { SessionImpl } from './SessionImpl';

const log = createLogger('ActionImpl');

export class ActionImpl implements Action {
    public readonly name: string;
    public readonly startTime: number;
    public readonly startSequenceNumber: number;
    public readonly actionId: number;
    public endSequenceNumber?: number;

    private readonly session: SessionImpl;
    private readonly beacon: PayloadData;
    private readonly timestampProvider: TimestampProvider;

    private _endTime = -1;
    public get endTime(): number {
        return this._endTime;
    }

    constructor(
        session: SessionImpl,
        name: string,
        beacon: PayloadData,
        timestampProvider: TimestampProvider = defaultTimestampProvider) {

        this.session = session;
        this.name = name;
        this.beacon = beacon;
        this.startTime = timestampProvider.getCurrentTimestamp();
        this.startSequenceNumber = this.beacon.createSequenceNumber();
        this.actionId = this.beacon.createId();
        this.timestampProvider = timestampProvider;

        log.debug(`Created action '${name}'`, this);
    }

    public reportValue(name: string, value: number | string | null | undefined): void {
        if (!this.mayReportValue()) {
            return;
        }

        if (typeof name !== 'string' || name.length === 0) {
            return;
        }

        const type = typeof value;
        if (type !== 'string' && type !== 'number' && value !== null && value !== undefined) {
            return;
        }

        log.debug('Report value', value);

        this.beacon.reportValue(this, name, value);
    }

    public leaveAction(): null {
        if (this.endTime !== -1) {
            return null;
        }

        log.debug(`Leaving action '${this.name}'`);

        this.endSequenceNumber = this.beacon.createSequenceNumber();
        this._endTime = this.timestampProvider.getCurrentTimestamp();
        this.beacon.addAction(this);
        this.session.endAction(this);

        return null;
    }

    private mayReportValue(): boolean {
        if (this.endTime !== -1) {
            return false;
        }

        if (this.session.state.multiplicity === 0) {
            return false;
        }

        // We only report values iff DCL = UserBehavior
        if (this.session.state.config.dataCollectionLevel !== DataCollectionLevel.UserBehavior) {
            return false;
        }

        return true;
    }
}
