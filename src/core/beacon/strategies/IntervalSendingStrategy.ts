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

import { timeout } from '../../utils/Utils';
import { FlushLeftoversStrategy } from './FlushLeftoversStrategy';

const defaultLoopTimeout = 1000;

export class IntervalSendingStrategy extends FlushLeftoversStrategy {
    private isShutdown = false;

    constructor(private loopTimeout: number = defaultLoopTimeout) {
        super();
    }

    public afterInit(): void {
        this.loop();
    }

    public async loop(): Promise<void> {
        if (!this.sender) {
            return;
        }

        while (!this.isShutdown) {
            this.flush();

            await timeout(this.loopTimeout);
        }
    }

    public shutdown(): Promise<void> {
        this.isShutdown = true;

        return super.shutdown();
    }
}
