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

import { Payload } from './Payload';

export class PayloadQueue {
    private readonly queue: Payload[] = [];

    public push(payload: Payload): void {
        this.queue.push(payload);
    }

    public peek(): Payload | undefined {
        return this.queue[0];
    }

    public pop(): Payload | undefined {
        return this.queue.shift();
    }

    public isEmpty(): boolean {
        return this.queue.length === 0;
    }
}
