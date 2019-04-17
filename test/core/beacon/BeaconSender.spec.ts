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

import { anything, instance, mock, reset, verify, when } from 'ts-mockito';
import { BeaconSender, BeaconSenderImpl } from '../../../src/core/beacon/BeaconSender';
import { BeaconCacheImpl } from '../../../src/core/beacon/strategies/BeaconCache';
import { HttpCommunicationChannel } from '../../../src/core/communication/http/state/HttpCommunicationChannel';
import { OpenKitConfiguration } from '../../../src/core/config/Configuration';
import { OpenKitImpl } from '../../../src/core/impl/OpenKitImpl';
import { defaultNullLoggerFactory } from '../../../src/core/logging/NullLoggerFactory';

const requestUrl = 'https://example.com';

describe('BeaconSender', () => {
    let communication = mock(HttpCommunicationChannel);
    let ok = mock(OpenKitImpl);
    let cache = mock(BeaconCacheImpl);
    let config: Partial<OpenKitConfiguration>;
    let sender: BeaconSenderImpl;

    beforeEach(() => {
        reset(communication);
        reset(ok);
        reset(cache);

        config = {
            beaconURL: 'https://example.com',
            sendingStrategies: [],
            loggerFactory: defaultNullLoggerFactory,
            communicationChannel: instance(communication),
        };

        sender = new BeaconSenderImpl(
            instance(ok),
            instance(cache),
            config as OpenKitConfiguration,
        );
    });

    it('should send the initial request to dynatrace on init', async() => {
        // given
        when(communication.sendStatusRequest(requestUrl, anything())).thenResolve({valid: true});
        when(cache.getEntriesCopy()).thenReturn([]);

        // when
        await sender.init();

        // then
        verify(ok.notifyInitialized(true)).once();
        expect(sender.isInitialized()).toBe(true);
    });

    it('should send the initial request to dynatrace on init', async() => {
        // given
        when(communication.sendStatusRequest(requestUrl, anything())).thenResolve({valid: false});

        // when
        await sender.init();

        // then
        verify(ok.notifyInitialized(false)).once();
    });
});
