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

import { Action, LogLevel, OpenKit, OpenKitBuilder, Session } from '../src';
import {
    HttpClient,
    HttpResponse,
} from '../src/core/communication/http/HttpClient';
import { HttpCommunicationChannel } from '../src/core/communication/http/state/HttpCommunicationChannel';
import { ConsoleLoggerFactory } from '../src/core/logging/ConsoleLoggerFactory';
import { EventType } from '../src/core/protocol/EventType';
import { timeout } from '../src/core/utils/Utils';

interface RequestRecord {
    url: string;
    payload?: string;
}

class MockHttpClient implements HttpClient {
    public readonly records: RequestRecord[] = [];

    public async get(url: string): Promise<HttpResponse> {
        this.records.push({ url });

        return { status: 200, payload: 'type=m', headers: {} };
    }

    public async post(url: string, payload: string): Promise<HttpResponse> {
        this.records.push({ url, payload });

        return { status: 200, payload: 'type=m', headers: {} };
    }

    public recordUrls(): string[] {
        return this.records.map((e) => e.url);
    }

    public recordDefinedPayloads(): string[] {
        return this.records
            .map((e) => e.payload)
            .filter((p) => p !== undefined) as string[];
    }

    public recordDefinedPayloadsWithEventType(et: EventType): string[] {
        return this.recordDefinedPayloads().filter(
            (p) => p.indexOf(`et=${et}&`) !== -1,
        );
    }
}

describe('ShutdownBeforeSessionSend', () => {
    let ok: OpenKit;
    let s: Session;
    let a: Action;

    let client: MockHttpClient;

    beforeEach(async () => {
        client = new MockHttpClient();

        const builder = new OpenKitBuilder(
            'https://example.com/beaconEndpoint',
            '1234-56-78-90-123456',
            '42',
        ).withCommunicationChannel(
            new HttpCommunicationChannel(
                client,
                new ConsoleLoggerFactory(LogLevel.Info),
            ),
        );

        ok = builder.build();

        await timeout(50);

        s = ok.createSession('198.1.2.3');

        s.identifyUser('Dynatrace User');

        a = s.enterAction('Action 1');

        ok.shutdown();
    });

    it('should be initialized', () => {
        expect(ok.isInitialized()).toBe(true);
    });

    it('should have send the initial request to the server', () => {
        const firstEntry = client.records[0];

        expect(firstEntry.payload).toBeUndefined();
        expect(firstEntry.url.endsWith('ns=1')).toBeFalsy();
    });

    it('should not have send an initial session request to the server', () => {
        expect(client.recordUrls().some((u) => u.endsWith('ns=1'))).toBeFalsy();
    });

    it('should have sent the action to the server', () => {
        expect(
            client.recordDefinedPayloadsWithEventType(EventType.ManualAction)
                .length,
        ).toBe(1);
    });

    it('should have sent the identifyuser to the server', () => {
        expect(
            client.recordDefinedPayloadsWithEventType(EventType.IdentifyUser)
                .length,
        ).toBe(1);
    });
});
