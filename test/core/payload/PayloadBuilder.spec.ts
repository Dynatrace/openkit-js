import {PayloadBuilder} from "../../../src/core/payload/PayloadBuilder";
import {CommunicationState} from "../../../src/core/beacon/CommunicationState";
import {CommunicationStateImpl} from "../../../src/core/beacon/CommunicationStateImpl";
import {anything, instance, mock, spy, verify, when} from "ts-mockito";
import {StaticPayloadBuilder} from "../../../src/core/payload/StaticPayloadBuilder";
import {CaptureMode} from "../../../src/api";
import {createTag} from "../../../src/core/impl/WebRequestTracerImpl";


describe('PayloadBuilder', () => {
    let builder: PayloadBuilder;
    let builderSpy: PayloadBuilder;
    let state: CommunicationState = mock(CommunicationStateImpl);

    let staticBuilderSpy: typeof StaticPayloadBuilder;

    beforeEach(() => {
        builder = new PayloadBuilder(instance(state));
        builderSpy = spy(builder);

        staticBuilderSpy = spy(StaticPayloadBuilder);
    });

    describe('reportCrash', () => {
        it('should not create the payload if capture is disabled', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.Off);
            when(state.captureCrashes).thenReturn(CaptureMode.On);

            // when
            builder.reportCrash('name', 'reason', 'stack', 6, 100);

            // then
            verify(staticBuilderSpy.reportCrash(anything(), anything(), anything(), anything(), anything())).never();
            verify(builderSpy._push(anything())).never();
        });

        it('should not create the payload if captureCrashes is disabled', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);
            when(state.captureCrashes).thenReturn(CaptureMode.Off);

            // when
            builder.reportCrash('name', 'reason', 'stack', 6, 100);

            // then
            verify(staticBuilderSpy.reportCrash(anything(), anything(), anything(), anything(), anything())).never();
            verify(builderSpy._push(anything())).never();
        });

        it('should build the payload and add it to the queue', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);
            when(state.captureCrashes).thenReturn(CaptureMode.On);

            // when
            builder.reportCrash('name', 'reason', 'stack', 6, 100);

            // then
            verify(staticBuilderSpy.reportCrash(anything(), anything(), anything(), anything(), anything())).once();
            verify(staticBuilderSpy.reportCrash('name', 'reason', 'stack', 6, 100)).once();
            verify(builderSpy._push(anything())).once();
        });
    });

    describe('reportNamedEvent', () => {
        it('should not create the payload if capture is disabled', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.Off);

            // when
            builder.reportNamedEvent('name', 5, 6, 100);

            // then
            verify(staticBuilderSpy.reportNamedEvent(anything(), anything(), anything(), anything())).never();
            verify(builderSpy._push(anything())).never();
        });

        it('should build the payload and add it to the queue', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);

            // when
            builder.reportNamedEvent('name', 5, 6, 100);

            // then
            verify(staticBuilderSpy.reportNamedEvent(anything(), anything(), anything(), anything())).once();
            verify(staticBuilderSpy.reportNamedEvent('name', 5, 6, 100)).once();
            verify(builderSpy._push(anything())).once();
        });
    });

    describe('reportError', () => {
        it('should not create the payload if capture is disabled', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.Off);
            when(state.captureErrors).thenReturn(CaptureMode.On);

            // when
            builder.reportError('name', 'reason', 200, 6, 100, 500);

            // then
            verify(staticBuilderSpy.reportError(anything(), anything(), anything(), anything(), anything(), anything())).never();
            verify(builderSpy._push(anything())).never();
        });

        it('should not create the payload if captureCrashes is disabled', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);
            when(state.captureErrors).thenReturn(CaptureMode.Off);

            // when
            builder.reportError('name', 'reason', 200, 6, 100, 500);

            // then
            verify(staticBuilderSpy.reportError(anything(), anything(), anything(), anything(), anything(), anything())).never();
            verify(builderSpy._push(anything())).never();
        });

        it('should build the payload and add it to the queue', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);
            when(state.captureErrors).thenReturn(CaptureMode.On);

            // when
            builder.reportError('name', 'reason', 200, 6, 100, 500);

            // then
            verify(staticBuilderSpy.reportError(anything(), anything(), anything(), anything(), anything(), anything())).once();
            verify(staticBuilderSpy.reportError('name', 6, 100, 500, 'reason', 200)).once();
            verify(builderSpy._push(anything())).once();
        });
    });

    describe('reportValue', () => {
        it('should not create the payload if capture is disabled', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.Off);

            // when
            builder.reportValue('name', 5, 6, 100, 500);

            // then
            verify(staticBuilderSpy.reportValue(anything(), anything(), anything(), anything(), anything())).never();
            verify(builderSpy._push(anything())).never();
        });

        it('should build the payload and add it to the queue', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);

            // when
            builder.reportValue('name', 5, 6, 100, 500);

            // then
            verify(staticBuilderSpy.reportValue(anything(), anything(), anything(), anything(), anything())).once();
            verify(staticBuilderSpy.reportValue(6, 'name', 5, 100, 500)).once();
            verify(builderSpy._push(anything())).once();
        });
    });

    describe('identifyUser', () => {
        it('should not create the payload if capture is disabled', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.Off);

            // when
            builder.identifyUser('name', 5, 6);

            // then
            verify(staticBuilderSpy.identifyUser(anything(), anything(), anything())).never();
            verify(builderSpy._push(anything())).never();
        });

        it('should build the payload and add it to the queue', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);

            // when
            builder.identifyUser('name', 5, 6);

            // then
            verify(staticBuilderSpy.identifyUser(anything(), anything(), anything())).once();
            verify(staticBuilderSpy.identifyUser('name', 5, 6)).once();
            verify(builderSpy._push(anything())).once();
        });
    });

    describe('action', () => {
        it('should not create the payload if capture is disabled', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.Off);

            // when
            builder.action('name', 5, 6, 7, 600, 1000);

            // then
            verify(staticBuilderSpy.action(anything(), anything(), anything(), anything(), anything(), anything())).never();
            verify(builderSpy._push(anything())).never();
        });

        it('should build the payload and add it to the queue', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);

            // when
            builder.action('name', 5, 6, 7, 600, 1000);

            // then
            verify(staticBuilderSpy.action(anything(), anything(), anything(), anything(), anything(), anything())).once();
            verify(staticBuilderSpy.action('name', 5, 6, 7, 600, 1000)).once();
            verify(builderSpy._push(anything())).once();
        });
    });

    describe('startSession', () => {
        it('should not create the payload if capture is disabled', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.Off);

            // when
            builder.startSession(7);

            // then
            verify(staticBuilderSpy.startSession(anything())).never();
            verify(builderSpy._push(anything())).never();
        });

        it('should build the payload and add it to the queue', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);

            // when
            builder.startSession(7);

            // then
            verify(staticBuilderSpy.startSession(anything())).once();
            verify(staticBuilderSpy.startSession(7)).once();
            verify(builderSpy._push(anything())).once();
        });
    });

    describe('endSession', () => {
        it('should not create the payload if capture is disabled', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.Off);

            // when
            builder.endSession(7, 500);

            // then
            verify(staticBuilderSpy.endSession(anything(), anything())).never();
            verify(builderSpy._push(anything())).never();
        });

        it('should build the payload and add it to the queue', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);

            // when
            builder.endSession(7, 500);

            // then
            verify(staticBuilderSpy.endSession(anything(), anything())).once();
            verify(staticBuilderSpy.endSession(7, 500)).once();
            verify(builderSpy._push(anything())).once();
        });
    });

    describe('webRequest', () => {
        it('should not create the payload if capture is disabled', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.Off);

            // when
            builder.webRequest('https://example.com', 6, 4, 100, 5, 6000, 100, 200, 300);

            // then
            verify(staticBuilderSpy.webRequest(anything(), anything(), anything(), anything(), anything(), anything(), anything(), anything(), anything())).never();
            verify(builderSpy._push(anything())).never();
        });

        it('should build the payload and add it to the queue', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);

            // when
            builder.webRequest('https://example.com', 6, 4, 100, 5, 6000, 100, 200, 300)

            // then
            verify(staticBuilderSpy.webRequest(anything(), anything(), anything(), anything(), anything(), anything(), anything(), anything(), anything())).once();
            verify(staticBuilderSpy.webRequest('https://example.com', 6, 4, 100, 5, 6000, 100, 200, 300)).once();
            verify(builderSpy._push(anything())).once();
        });
    });

    describe('getNextPayload', () => {
        it('should return undefined if the queue is empty', () => {
            expect(builder.getNextPayload('', 500)).toBeUndefined();
        });

        it('should return the next chunk with prefix and payload', () => {
            // given
            when(state.capture).thenReturn(CaptureMode.On);
            when(state.multiplicity).thenReturn(50);
            builder.identifyUser('user', 500, 5000);

            // when
            const payload = builder.getNextPayload('prefix', 6000)!;

            // then
            expect(payload.startsWith('prefix&')).toBeTruthy();
            expect(payload.indexOf('mp=50')).toBeGreaterThan(0);
        });

        it('should build multiple payloads if the beacon size is to small for everything', () => {
            // given
            const prefix = 'mocked-prefix=true';
            const mutablePrefix = 'mocked-mutable=true';
            const mockedPayload = 'mocked=payload';
            const completeLength = [prefix, mutablePrefix, mockedPayload].join('&').length;

            StaticPayloadBuilder.identifyUser = jest.fn().mockReturnValue(mockedPayload);
            StaticPayloadBuilder.mutable = jest.fn().mockReturnValue(mutablePrefix);

            when(state.capture).thenReturn(CaptureMode.On);
            when(state.maxBeaconSize).thenReturn(completeLength);
            when(state.multiplicity).thenReturn(50);
            builder.identifyUser('user', 5, 6);
            builder.identifyUser('user', 5, 6);

            // when
            const payload = builder.getNextPayload(prefix, 5000);

            // then
            expect(payload).toBeDefined();
            expect(builder._getQueue().isEmpty()).toBeFalsy();

            // when
            const payload2 = builder.getNextPayload(prefix, 6000);

            // then
            expect(payload2).toBeDefined();
            expect(builder._getQueue().isEmpty()).toBeTruthy();

            // when
            const payload3 = builder.getNextPayload(prefix, 8000);

            // then
            expect(payload3).toBeUndefined();
        });
    });

    describe('getWebRequestTracerTag', () => {
        it('should return from the createTag method', () => {
            when(state.serverId).thenReturn(55);

              const tag = builder.getWebRequestTracerTag(6, 4, 50, '42', 'app-id');
              const cT = createTag(6, 4, 50, 55, '42', 'app-id');

              expect(tag).toEqual(cT);
        });
    });
});