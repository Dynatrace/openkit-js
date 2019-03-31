import {ImmediateSendingStrategy} from "../../../../src/core/beacon/strategies/ImmediateSendingStrategy";
import {BeaconSender} from "../../../../src/core/beacon/BeaconSender";
import {BeaconCacheImpl, CacheEntry} from "../../../../src/core/beacon/strategies/BeaconCache";
import {anything, instance, mock, reset, spy, verify} from "ts-mockito";
import {PayloadBuilder} from "../../../../src/core/payload/PayloadBuilder";
import {CommunicationState} from "../../../../src/core/beacon/CommunicationState";

describe('ImmediateSendingStrategy', () => {
    let strategy: ImmediateSendingStrategy;
    let sender: BeaconSender = mock(BeaconSender);
    let cache: BeaconCacheImpl = mock(BeaconCacheImpl);

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
            builder: builder,
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

    it('should not flush if not initialized', async() => {
        // when
        await strategy.added('et=18&mocked=payload');

        // then
        verify(sender.flush()).never();
    });

    it('should flush on end if initialized', async() => {
        // given
        init();
        reset(sender);

        // when
        await strategy.shutdown();

        // then
        verify(sender.flush()).once();
    });

    it('should not flush on end if not initialized', () => {
        // when
        strategy.shutdown();

        // then
        verify(sender.flush()).never();
    });

});
