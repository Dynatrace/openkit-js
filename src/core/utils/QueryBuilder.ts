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

import { PayloadKey } from '../protocol/PayloadKey';
import { QueryKey } from '../protocol/QueryKey';
import { truncate } from './Utils';

export abstract class QueryBuilder<T extends QueryKey | PayloadKey> {
    private readonly options: Record<string, string> = {};

    public add(key: T, value: string | number, maxLength?: number): this {
        this.options[key] = truncate(value.toString(), maxLength);

        return this;
    }

    public addIfDefined(key: T, value: string | number | undefined): this {
        if (value !== undefined) {
            this.add(key, value);
        }

        return this;
    }

    public addIfDefinedAndNotNull(
        key: T,
        value: string | number | undefined | null,
    ): this {
        if (value !== undefined && value !== null) {
            this.add(key, value);
        }

        return this;
    }

    public addIfNotNegative(key: T, value: number): this {
        if (value >= 0) {
            this.add(key, value);
        }

        return this;
    }

    public build(): string {
        return Object.keys(this.options)
            .map(
                (key: string) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(
                        this.options[key],
                    )}`,
            )
            .join('&');
    }
}
