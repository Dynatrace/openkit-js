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

import { anyString, anything, instance, mock, reset, spy, verify, when } from 'ts-mockito';
import { Action, CrashReportingLevel, DataCollectionLevel, Session } from '../../../src';
import {
    CaptureMode,
    CommunicationChannel,
    defaultInvalidStatusResponse,
    StatusRequest,
    StatusResponse,
} from '../../../src/api';
import { PayloadData } from '../../../src/core/beacon/PayloadData';
import { PayloadSender } from '../../../src/core/beacon/PayloadSender';
import { Configuration } from '../../../src/core/config/Configuration';
import { ActionImpl } from '../../../src/core/impl/ActionImpl';
import { defaultNullAction } from '../../../src/core/impl/null/NullAction';
import { defaultNullWebRequestTracer } from '../../../src/core/impl/null/NullWebRequestTracer';
import { OpenKitImpl } from '../../../src/core/impl/OpenKitImpl';
import { Status } from '../../../src/core/impl/OpenKitObject';
import { SessionImpl } from '../../../src/core/impl/SessionImpl';
import { CommunicationState } from '../../../src/core/beacon.v2/CommunicationState';
import { CommunicationStateImpl } from '../../../src/core/beacon.v2/CommunicationStateImpl';
import { WebRequestTracerImpl } from '../../../src/core/impl/WebRequestTracerImpl';
import { defaultNullLoggerFactory } from '../../../src/core/logging/NullLoggerFactory';

class StubCommunicationChannel implements CommunicationChannel {
    public async sendNewSessionRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return { valid: false };
    }
    public async sendPayloadData(url: string, request: StatusRequest, query: string): Promise<StatusResponse> {
        return { valid: false };
    }
    public async sendStatusRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return { valid: false };
    }
}

describe('SessionImpl', () => {

    let config: Partial<Configuration>;
    let mockCommunicationChannel: CommunicationChannel = mock(StubCommunicationChannel);
    let mockOpenKitImpl = mock(OpenKitImpl);
    let state: CommunicationState;

    beforeEach(() => {
        reset(mockCommunicationChannel);
        reset(mockOpenKitImpl);

        when(mockCommunicationChannel.sendPayloadData(anything(), anything(), anything())).thenResolve({valid: true});
        const communicationChannelInstance = instance(mockCommunicationChannel);

        config = {
            applicationId: 'app-id',
            applicationName: '',
            deviceId: '4',
            dataCollectionLevel: DataCollectionLevel.UserBehavior,
            crashReportingLevel: CrashReportingLevel.OptOutCrashes,

            loggerFactory: defaultNullLoggerFactory,
            communicationChannel: communicationChannelInstance,
        };

        state = new CommunicationStateImpl(config as Configuration);

        when(mockOpenKitImpl.state).thenReturn(state);
    });

    const buildSession = (clientIp: string = '', id: number = 0) => {
        const openKit = instance(mockOpenKitImpl);

        const session: SessionImpl = new SessionImpl(openKit, clientIp, id, sessionStartTime);

        const anySession = session as any;
        const payloadData: PayloadData = anySession.payloadData;
        const payloadSender: PayloadSender = anySession.payloadSender;
        const openActions: Action[] = anySession.openActions;

        return {
            session,
            payloadData,
            payloadDataSpy: spy(payloadData),
            payloadSender,
            payloadSenderSpy: spy(payloadSender),
            openActions,
        };
    };

    describe('creation', () => {
        it('should clone the state from openKitImpl', () => {
            state.updateFromResponse({ valid: true, multiplicity: 2, serverId: 2, maxBeaconSizeInKb: 3 });
            const {session} = buildSession();
            const sessionState = session.state;

            expect(sessionState.multiplicity).toBe(2);
            expect(sessionState.serverId).toBe(2);
            expect(sessionState.maxBeaconSize).toBe(3072);
        });

        it('should be idle after creation', () => {
           const {session} = buildSession();
           expect(session.status).toBe(Status.Idle);
        });

        it('the payloadData should have an entry in it', () => {
            const {payloadData} = buildSession();

            expect(payloadData.hasPayloadsLeft()).toBe(true);
        });
    });

    describe('initialization', () => {
        it('should have state initialized after successful initialization', (done) => {
            // given
            when(mockOpenKitImpl.waitForInit(anything())).thenCall((cb) => { cb(true); });
            when(mockOpenKitImpl.status).thenReturn(Status.Initialized);
            when(mockCommunicationChannel.sendNewSessionRequest(anything(), anything())).thenResolve({valid: true});

            // when
            const {session} = buildSession();
            session.init();

            session.waitForInit((tf) => {
                const result = tf;

                // then
                expect(result).toBe(true);
                expect(session.status).toBe(Status.Initialized);

                done();
            });
        });

        it('should have state shutdown after successful initialization and shutdown', async () => {
            // given
            when(mockOpenKitImpl.waitForInit(anything())).thenCall((cb) => { cb(true); });
            when(mockOpenKitImpl.status).thenReturn(Status.Initialized);
            when(mockCommunicationChannel.sendNewSessionRequest(anything(), anything())).thenResolve({valid: true});

            // when
            const {session} = buildSession();
            session.init();
            session.waitForInit(() => {
                session.shutdown();

                // then
                expect(session.status).toBe(Status.Shutdown);
            });
        });

        it('should not initialize as long as openKit is not initialized', (done) => {
            jest.setTimeout(5000);
            // given
            when(mockCommunicationChannel.sendNewSessionRequest(anything(), anything())).thenResolve({valid: true});

            const {session} = buildSession();
            const stateSyp = spy(session.state);

            // when
            session.init();
            session.waitForInit((tf) => {
                const result = tf;

                // then
                expect(result).toBe(false);
                verify(stateSyp.updateFromState(anything())).never();

                done();
            }, 4000)
        });

        it('should not initialize if openkit failed to initialize', () => {
           // given
            when(mockCommunicationChannel.sendStatusRequest(anything(), anything())).thenResolve(defaultInvalidStatusResponse);
            when(mockCommunicationChannel.sendNewSessionRequest(anything(), anything())).thenResolve({valid: true});
            const {session} = buildSession();

            // when
            session.init();
            session.waitForInit(tf => {
                expect(tf).toBe(false);
            });
        });

        it('should not initialize if the request throws an exception', () => {
            when(mockCommunicationChannel.sendStatusRequest(anything(), anything())).thenThrow(new Error('some generic error'));
            const {session} = buildSession();

            // when
            session.init();
            session.waitForInit(tf => {
                expect(tf)
                    .toBe(false);
            });
        });
    });

    describe('identifyUser', () => {
        it('should not be able to identify a user after we shutdown', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            session.shutdown();

            // when
            session.identifyUser('userTag');

            // then
            verify(payloadDataSpy.identifyUser(anyString())).never();
        });

        it('should not be able to identify a user if DCL = Off', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            session.identifyUser('userTag');

            // then
            verify(payloadDataSpy.identifyUser(anyString())).never();
        });

        it('should not be able to identify a user if DCL = Performance', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            config.dataCollectionLevel = DataCollectionLevel.Performance;

            // when
            session.identifyUser('userTag');

            // then
            verify(payloadDataSpy.identifyUser(anyString())).never();
        });

        it('should not be able to identify a user if the tag is not a string', () => {
            // given
            const {session, payloadDataSpy} = buildSession();

            // when
            session.identifyUser(null as unknown as string);

            // then
            verify(payloadDataSpy.identifyUser(anyString())).never();
        });

        it('should not be able to identify a user if the tag is empty string', () => {
            // given
            const {session, payloadDataSpy} = buildSession();

            // when
            session.identifyUser('');

            // then
            verify(payloadDataSpy.identifyUser(anyString())).never();
        });

        it('should be able to identify a user', () => {
            // given
            when(mockOpenKitImpl.waitForInit(anything())).thenCall((cb) => cb(true));
            when(mockOpenKitImpl.status).thenReturn(Status.Initialized);
            when(mockCommunicationChannel.sendNewSessionRequest(anything(), anything())).thenResolve({valid: true});

            const {session, payloadDataSpy} = buildSession();

            // when
            session.identifyUser('userTag');

            // then
            verify(payloadDataSpy.identifyUser('userTag')).once();
        });
    });

    describe('enterAction', () => {
        it('should not be possible to enter an action if we shutdown', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            session.shutdown();

            // when
            const action = session.enterAction('action');

            // then
            expect(action).toBe(defaultNullAction);
            verify(payloadDataSpy.addAction(anything())).never();
        });

        it('should not be possible to enter an action if we do not capture (multiplicity = 0)', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            session.state.updateFromResponse({valid: true, captureMode: CaptureMode.Off });

            // when
            const action = session.enterAction('action');

            // then
            expect(action).toBe(defaultNullAction);
            verify(payloadDataSpy.addAction(anything())).never();
        });

        it('should not be possible to enter an action if DCL = Off', () => {
            // given
            config.dataCollectionLevel =  DataCollectionLevel.Off;
            const {session, payloadDataSpy} = buildSession();

            // when
            const action = session.enterAction('action');

            // then
            expect(action).toBe(defaultNullAction);
            verify(payloadDataSpy.addAction(anything())).never();
        });

        it('should be able to enter an action', () => {
            // given
            when(mockOpenKitImpl.waitForInit(anything())).thenCall((cb) => { cb(true); });
            when(mockOpenKitImpl.status).thenReturn(Status.Initialized);
            when(mockCommunicationChannel.sendNewSessionRequest(anything(), anything())).thenResolve({valid: true});
            const {session, openActions} = buildSession();

            // when
            const action = session.enterAction('action');

            // then
            expect(action).toBeInstanceOf(ActionImpl);
            expect(openActions.indexOf(action)).not.toBe(-1);
        });

        it('should be able to enter multiple actions', () => {
            // given
            when(mockOpenKitImpl.waitForInit(anything())).thenCall((cb) => { cb(true); });
            when(mockOpenKitImpl.status).thenReturn(Status.Initialized);
            when(mockCommunicationChannel.sendNewSessionRequest(anything(), anything())).thenResolve({valid: true});
            const {session, openActions} = buildSession();

            // when
            const action1 = session.enterAction('action 1');
            const action2 = session.enterAction('action 2');

            // then
            expect(action1).toBeInstanceOf(ActionImpl);
            expect(action2).toBeInstanceOf(ActionImpl);
            expect(openActions.indexOf(action1)).not.toBe(-1);
            expect(openActions.indexOf(action2)).not.toBe(-1);
        });

        it('should be able to remove an action from the action-children', () => {
            // given
            when(mockOpenKitImpl.waitForInit(anything())).thenCall((cb) => { cb(true); });
            when(mockOpenKitImpl.status).thenReturn(Status.Initialized);
            when(mockCommunicationChannel.sendNewSessionRequest(anything(), anything())).thenResolve({valid: true});
            const {session, openActions} = buildSession();

            // when, then
            const action = session.enterAction('action');
            expect(openActions.indexOf(action)).not.toBe(-1);

            // when, then
            session.endAction(action);
            expect(openActions.indexOf(action)).toBe(-1);
        });
    });

    describe('reportCrash', () => {
        it('should not be possible to enter reportCrash if the status is shutdown', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            session.shutdown();

            // when
            session.reportCrash('name', 'reason', 'stacktrace');

            // then
            verify(payloadDataSpy.reportCrash(anything(), anything(), anything())).never();
        });

        it('should not be possible to enter reportCrash if the name is empty string', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            session.shutdown();

            // when
            session.reportCrash('', 'reason', 'stacktrace');

            // then
            verify(payloadDataSpy.reportCrash(anything(), anything(), anything())).never();
        });

        it('should not be possible to enter reportCrash if the name is not a string', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            session.shutdown();

            // when
            session.reportCrash({} as string, 'reason', 'stacktrace');

            // then
            verify(payloadDataSpy.reportCrash(anything(), anything(), anything())).never();
        });

        it('should not be possible to enter reportCrash if capture is off', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            state.updateFromResponse({valid: true, captureMode: CaptureMode.Off});

            // when
            session.reportCrash({} as string, 'reason', 'stacktrace');

            // then
            verify(payloadDataSpy.reportCrash(anything(), anything(), anything())).never();
        });

        it('should not be possible to enter reportCrash if captureCrashes is Off', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            state.updateFromResponse({valid: true, captureCrashes: CaptureMode.Off})

            // when
            session.reportCrash({} as string, 'reason', 'stacktrace');

            // then
            verify(payloadDataSpy.reportCrash(anything(), anything(), anything())).never();
        });

        it('should not be possible to enter reportCrash if captureCrashes is OptOut in the config', () => {
            // given
            config.crashReportingLevel = CrashReportingLevel.OptOutCrashes;
            const {session, payloadDataSpy} = buildSession();

            // when
            session.reportCrash({} as string, 'reason', 'stacktrace');

            // then
            verify(payloadDataSpy.reportCrash(anything(), anything(), anything())).never();
        });

        it('should not be possible to enter reportCrash if captureCrashes is Off in the config', () => {
            // given
            config.crashReportingLevel = CrashReportingLevel.Off;
            const {session, payloadDataSpy} = buildSession();

            // when
            session.reportCrash({} as string, 'reason', 'stacktrace');

            // then
            verify(payloadDataSpy.reportCrash(anything(), anything(), anything())).never();
        });

        it('should report the crash if capture mode is on', () => {
            // given
            config.crashReportingLevel = CrashReportingLevel.OptInCrashes;
            state.updateFromResponse({valid: true, captureCrashes: CaptureMode.On});
            const {session, payloadDataSpy} = buildSession();

            // when
            session.reportCrash('name', 'reason', 'stacktrace');

            // then
            verify(payloadDataSpy.reportCrash(anything(), anything(), anything())).once();
            verify(payloadDataSpy.reportCrash('name', 'reason', 'stacktrace')).once();
        });
    });

    describe('end', () => {
        it('should close all child-actions', (done) => {
            // given
            when(mockOpenKitImpl.waitForInit(anything())).thenCall((cb) => { cb(true); });
            when(mockOpenKitImpl.status).thenReturn(Status.Initialized);
            when(mockCommunicationChannel.sendNewSessionRequest(anything(), anything())).thenResolve({valid: true});
            const {session} = buildSession();

            const action1 = session.enterAction('action 1');
            const action2 = session.enterAction('action 2');

            const action1Spy = spy(action1);
            const action2Spy = spy(action2);

            session.init();
            session.waitForInit(() => {
                expect(session.status).toBe(Status.Initialized);

                // when
                session.end();

                // then
                setTimeout(() => {
                    verify(action1Spy.leaveAction()).once();
                    verify(action2Spy.leaveAction()).once();

                    done();
                }, 500);
            });

        });

        it('should remove a single child from the children-array', () => {
            // given
            when(mockOpenKitImpl.waitForInit(anything())).thenCall((cb) => { cb(true); });
            when(mockOpenKitImpl.status).thenReturn(Status.Initialized);
            when(mockCommunicationChannel.sendNewSessionRequest(anything(), anything())).thenResolve({valid: true});
            const {openActions, session} = buildSession();

            const action1 = session.enterAction('action 1');
            const action2 = session.enterAction('action 2');

            // when
            action1.leaveAction();

            // then
            expect(openActions.indexOf(action1)).toBe(-1);
            expect(openActions.indexOf(action2)).not.toBe(-1);
        });

        it('should do nothing if DCL = Off', () => {
            config.dataCollectionLevel = DataCollectionLevel.Off;
            when(mockOpenKitImpl.waitForInit(anything())).thenCall((cb) => { cb(true); });
            when(mockOpenKitImpl.status).thenReturn(Status.Initialized);
            when(mockCommunicationChannel.sendNewSessionRequest(anything(), anything())).thenResolve({valid: true});

            const {session} = buildSession();

            session.end();

            verify(mockOpenKitImpl.removeSession(session)).never();
        });
    });

    describe('reportError', () => {
        it('should not be possible to report an error if the name is not a string', () => {
            // given
            const {session, payloadDataSpy} = buildSession();

            // when
            // @ts-ignore
            session.reportError(session, 1337, 'message');

            // then
            verify(payloadDataSpy.reportError(anything(), anything(), anything(), anything())).never();
        });

        it('should not be possible to report an error if the name is empty', () => {
            // given
            const {session, payloadDataSpy} = buildSession();

            // when
            session.reportError('', 1337, 'message');

            // then
            verify(payloadDataSpy.reportError(anything(), anything(), anything(), anything())).never();
        });

        it('should not be possible to report an error if the code is not a number', () => {
            // given
            const {session, payloadDataSpy} = buildSession();

            // when
            // @ts-ignore
            session.reportError('name', 'invalid number', 'message');

            // then
            verify(payloadDataSpy.reportError(anything(), anything(), anything(), anything())).never();
        });

        it('should not be possible to report an error if capture errors is off', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            session.state.updateFromResponse({valid: true, captureErrors: CaptureMode.Off});

            // when
            session.reportError('name', 1337, 'message');

            // then
            verify(payloadDataSpy.reportError(anything(), anything(), anything(), anything())).never();
        });

        it('should not be possible to report an error if DCL = Off', () => {
            // given
            const {session, payloadDataSpy} = buildSession();
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            session.reportError('name', 1337, 'message');

            // then
            verify(payloadDataSpy.reportError(anything(), anything(), anything(), anything())).never();
        });

        it('should be able to report an error', () => {
            // given
            const {session, payloadDataSpy} = buildSession();

            // when
            session.reportError('name', 1337, 'message');

            // then
            verify(payloadDataSpy.reportError(0, 'name', 1337, 'message')).once();
            verify(payloadDataSpy.reportError(anything(), anything(), anything(), anything())).once();
        });
    });

    describe('traceWebRequest', () => {
        let session: Session;

        beforeEach(() => {
            ({session} = buildSession());
        });

        it('should return defaultNullWebRequest if the url is not a string', () => {
            // when
            // @ts-ignore
            const wr = session.traceWebRequest(session);

            // then
            expect(wr).toBe(defaultNullWebRequestTracer);
        });

        it('should return defaultNullWebRequest if the url is empty string', () => {
            // when
            // @ts-ignore
            const wr = session.traceWebRequest('');

            // then
            expect(wr).toBe(defaultNullWebRequestTracer);
        });

        it('should return a webRequestTracer object with valid inputs', () =>{
            // when
            const wr = session.traceWebRequest('https://example.com');

            // then
            expect(wr).toBeInstanceOf(WebRequestTracerImpl);
        });

        it('should return defaultNullWebRequest if dcl = Off', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            const wr = session.traceWebRequest('https://example.com');

            // then
            expect(wr).toBe(defaultNullWebRequestTracer);
        });
    });
});
