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

import { anything, instance, mock, reset, spy, verify } from 'ts-mockito';
import {
    BeaconSender,
    BeaconSenderImpl,
} from '../../../../src/core/beacon/BeaconSender';
import { CommunicationState } from '../../../../src/core/beacon/CommunicationState';
import {
    BeaconCacheImpl,
    CacheEntry,
} from '../../../../src/core/beacon/strategies/BeaconCache';
import { ImmediateSendingStrategy } from '../../../../src/core/beacon/strategies/ImmediateSendingStrategy';
import { PayloadBuilder } from '../../../../src/core/payload/PayloadBuilder';

describe('ImmediateSendingStrategy', () => {
    let strategy: ImmediateSendingStrategy;
    const sender: BeaconSender = mock(BeaconSenderImpl);
    const cache: BeaconCacheImpl = mock(BeaconCacheImpl);

    beforeEach(() => {
        strategy = new ImmediateSendingStrategy();

        reset(sender);
        reset(cache);
    });

    const init = () => {
        strategy.init(instance(sender), instance(cache));
    };

    it('should flush immediately after init', () => {
        init();

        verify(sender.flush()).once();
    });

    it('should register on all payloadbuilders', () => {
        // given
        init();
        reset(sender);
        const builder = new PayloadBuilder({} as CommunicationState);
        const builderSpy = spy(builder);

        // when
        strategy.entryAdded({
            builder,
        } as CacheEntry);

        // then
        verify(builderSpy.register(anything())).once();
    });

    it('should not flush if no event type is present', () => {
        // given
        init();
        reset(sender);

        // when
        strategy.added('mocked=payload');

        // then
        verify(sender.flush()).never();
    });

    it('should flush on certain event types', () => {
        // given
        init();
        reset(sender);

        // when
        strategy.added('et=18&mocked=payload');

        // then
        verify(sender.flush()).once();
    });

    it('should not flush if not initialized', async () => {
        // when
        await strategy.added('et=18&mocked=payload');

        // then
        verify(sender.flush()).never();
    });

    it('should flush on end if initialized', async () => {
        // given
        init();
        reset(sender);

        // when
        await strategy.shutdown();

        // then
        verify(sender.flushImmediate()).once();
    });

    it('should not flush on end if not initialized', () => {
        // when
        strategy.shutdown();

        // then
        verify(sender.flush()).never();
    });
});
