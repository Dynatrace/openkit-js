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

import {
    anyNumber,
    anyString,
    anything,
    instance,
    mock,
    reset,
    spy,
    verify,
    when,
} from 'ts-mockito';
import { CrashReportingLevel, DataCollectionLevel } from '../../../src';
import { ConnectionType } from '../../../src/api/ConnectionType';
import { SupplementaryBasicData } from '../../../src/core/beacon/SupplementaryBasicData';
import { SupplementaryBasicDataImpl } from '../../../src/core/beacon/SupplementaryBasicDataImpl';
import {
    OpenKitConfiguration,
    PrivacyConfiguration,
} from '../../../src/core/config/Configuration';
import { ActionImpl } from '../../../src/core/impl/ActionImpl';
import { defaultNullAction } from '../../../src/core/impl/null/NullAction';
import { defaultNullWebRequestTracer } from '../../../src/core/impl/null/NullWebRequestTracer';
import { PayloadBuilderHelper } from '../../../src/core/impl/PayloadBuilderHelper';
import { SessionImpl } from '../../../src/core/impl/SessionImpl';
import { WebRequestTracerImpl } from '../../../src/core/impl/WebRequestTracerImpl';
import { defaultNullLoggerFactory } from '../../../src/core/logging/NullLoggerFactory';
import { EventPayload } from '../../../src/core/payload/EventPayload';
import { PayloadBuilder } from '../../../src/core/payload/PayloadBuilder';
import { TimestampProvider } from '../../../src/core/provider/TimestampProvider';
import { Mutable } from '../../Helpers';

describe('SessionImpl', () => {
    let config: Partial<Mutable<OpenKitConfiguration & PrivacyConfiguration>>;
    const payloadBuilder = mock(PayloadBuilder);
    const timestampProvider = mock(TimestampProvider);
    const eventsPayload = mock(EventPayload);
    let supplementaryBasicData: SupplementaryBasicData;

    let session: SessionImpl;

    beforeEach(() => {
        config = {
            loggerFactory: defaultNullLoggerFactory,
        };

        reset(payloadBuilder);
        reset(timestampProvider);

        when(timestampProvider.getCurrentTimestampMs()).thenReturn(7000, 9000);

        supplementaryBasicData = new SupplementaryBasicDataImpl();

        session = new SessionImpl(
            40,
            instance(payloadBuilder),
            5000,
            config as PrivacyConfiguration & OpenKitConfiguration,
            instance(timestampProvider),
            instance(eventsPayload),
            supplementaryBasicData,
        );
    });

    describe('creation', () => {
        it('should not be shutdown', () => {
            expect(session.isShutdown()).toBeFalsy();
        });

        it('should set the sessionId', () => {
            expect(session.sessionId).toBe(40);
        });

        it('should initialize the payload data and start a session', () => {
            // then
            expect(session.payloadData).toBeInstanceOf(PayloadBuilderHelper);
            verify(payloadBuilder.startSession(1)).once();
            verify(payloadBuilder.startSession(anything())).once();
        });
    });

    describe('identifyUser', () => {
        it('should not be able to identify a user after we shutdown', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.UserBehavior;
            session.end();

            // when
            session.identifyUser('userTag');

            // then
            verify(
                payloadBuilder.identifyUser(anything(), anything(), anything()),
            ).never();
        });

        it('should not be able to identify a user if DCL = Off', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            session.identifyUser('userTag');

            // then
            verify(
                payloadBuilder.identifyUser(anything(), anything(), anything()),
            ).never();
        });

        it('should not be able to identify a user if DCL = Performance', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Performance;

            // when
            session.identifyUser('userTag');

            // then
            verify(
                payloadBuilder.identifyUser(anything(), anything(), anything()),
            ).never();
        });

        it('should not be able to identify a user if the tag is not a string', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.UserBehavior;

            // when
            session.identifyUser((null as unknown) as string);

            // then
            verify(
                payloadBuilder.identifyUser(anything(), anything(), anything()),
            ).never();
        });

        it('should not be able to identify a user if the tag is empty string', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.UserBehavior;

            // when
            session.identifyUser('');

            // then
            verify(
                payloadBuilder.identifyUser(anything(), anything(), anything()),
            ).never();
        });

        it('should be able to identify a user', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.UserBehavior;

            // when
            session.identifyUser('userTag');

            // then
            verify(payloadBuilder.identifyUser('userTag', 2, 2000)).once();
            verify(
                payloadBuilder.identifyUser(anything(), anything(), anything()),
            ).once();
        });
    });

    describe('enterAction', () => {
        it('should not be possible to enter an action if we shutdown', () => {
            // given
            session.end();

            // when
            const action = session.enterAction('action');

            // then
            expect(action).toBe(defaultNullAction);
            expect(session._getOpenActions().indexOf(action)).toBe(-1);
            verify(
                payloadBuilder.action(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should not be possible to enter an action if DCL = Off', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            const action = session.enterAction('action');

            // then
            expect(action).toBe(defaultNullAction);
            expect(session._getOpenActions().indexOf(action)).toBe(-1);
            verify(
                payloadBuilder.action(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should be able to enter an action if DCL = Performance', () => {
            // when
            config.dataCollectionLevel = DataCollectionLevel.Performance;

            // when
            const action = session.enterAction('action');

            // then
            expect(action).toBeInstanceOf(ActionImpl);
            expect(
                session._getOpenActions().indexOf(action),
            ).toBeGreaterThanOrEqual(0);
            verify(
                payloadBuilder.action(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should be able to enter an action if DCL = UserBehavior', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.UserBehavior;

            // when
            const action = session.enterAction('action');

            // then
            expect(action).toBeInstanceOf(ActionImpl);
            expect(
                session._getOpenActions().indexOf(action),
            ).toBeGreaterThanOrEqual(0);
            verify(
                payloadBuilder.action(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should be able to enter multiple actions', () => {
            // when
            const action1 = session.enterAction('action 1');
            const action2 = session.enterAction('action 2');

            // then
            expect(action1).toBeInstanceOf(ActionImpl);
            expect(action2).toBeInstanceOf(ActionImpl);

            const i1 = session._getOpenActions().indexOf(action1);
            const i2 = session._getOpenActions().indexOf(action2);

            expect(i1).toBeGreaterThanOrEqual(0);
            expect(i2).toBeGreaterThanOrEqual(0);

            expect(i1).not.toBe(i2);
            verify(
                payloadBuilder.action(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should be able to remove an action from the action-children', () => {
            // when, then
            const action = session.enterAction('action');
            expect(
                session._getOpenActions().indexOf(action),
            ).toBeGreaterThanOrEqual(0);

            // when, then
            session._endAction(action);
            expect(session._getOpenActions().indexOf(action)).toBe(-1);
        });
    });

    describe('reportCrash', () => {
        it('should not be possible to enter reportCrash if the status is shutdown', () => {
            // given
            session.end();
            config.crashReportingLevel = CrashReportingLevel.OptInCrashes;

            // when
            session.reportCrash('name', 'reason', 'stacktrace');

            // then
            verify(
                payloadBuilder.reportCrash(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should not be possible to enter reportCrash if the name is empty string', () => {
            // given
            config.crashReportingLevel = CrashReportingLevel.OptInCrashes;

            // when
            session.reportCrash('', 'reason', 'stacktrace');

            // then
            verify(
                payloadBuilder.reportCrash(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should not be possible to enter reportCrash if the name is not a string', () => {
            // given
            config.crashReportingLevel = CrashReportingLevel.OptInCrashes;

            // when
            session.reportCrash({} as string, 'reason', 'stacktrace');

            // then
            verify(
                payloadBuilder.reportCrash(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should not be possible to enter reportCrash if captureCrashes is OptOut in the config', () => {
            // given
            config.crashReportingLevel = CrashReportingLevel.OptOutCrashes;

            // when
            session.reportCrash('Crash Name', 'reason', 'stacktrace');

            // then
            verify(
                payloadBuilder.reportCrash(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should not be possible to enter reportCrash if captureCrashes is Off in the config', () => {
            // given
            config.crashReportingLevel = CrashReportingLevel.Off;

            // when
            session.reportCrash('Crash Name', 'reason', 'stacktrace');

            // then
            verify(
                payloadBuilder.reportCrash(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should report the crash', () => {
            // given
            config.crashReportingLevel = CrashReportingLevel.OptInCrashes;

            // when
            session.reportCrash('name', 'reason', 'stacktrace');

            // then
            verify(
                payloadBuilder.reportCrash(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).once();
            verify(
                payloadBuilder.reportCrash(
                    'name',
                    'reason',
                    'stacktrace',
                    2,
                    2000,
                ),
            ).once();
        });
    });

    describe('sendBizEvent', () => {
        it('should not be possible to send an biz event if the type is not a string', () => {
            // when
            // @ts-ignore
            session.sendBizEvent(1337, {});

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should not be possible to send an biz event if the type is empty', () => {
            // when
            // @ts-ignore
            session.sendBizEvent('', {});

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should not be possible to send an biz event if payload contains top-level array', () => {
            // when
            // @ts-ignore
            session.sendBizEvent('type', []);

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should not be possible to send an biz event if payload is too big', () => {
            // when
            const jsonObject: { [key: string]: string } = {};

            for (let i = 0; i < 1000; i++) {
                jsonObject['Test' + i] =
                    'This is a Test String, so the payload is big enough';
            }

            // Override mock to return a payload which is big
            when(
                eventsPayload.getBizEventsPayload(
                    anyString(),
                    anything(),
                    anyNumber(),
                ),
            ).thenReturn(JSON.stringify(jsonObject));

            // @ts-ignore
            session.sendBizEvent('EventType', jsonObject);

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should not be possible to send an biz event if payload has no top-level json or invalid json', () => {
            // when
            // @ts-ignore
            session.sendBizEvent('eventType', []);
            // @ts-ignore
            session.sendBizEvent('eventType', NaN);
            // @ts-ignore
            session.sendBizEvent('eventType', 17);
            // @ts-ignore
            session.sendBizEvent('eventType', 'test');
            // @ts-ignore
            session.sendBizEvent('eventType', true);
            // @ts-ignore
            session.sendBizEvent('eventType', undefined);
            // @ts-ignore
            session.sendBizEvent('eventType', null);

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should not be possible to send an biz event if DCL = Off', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            session.sendBizEvent('type', {});

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should be able to send an biz event if DCL = Performance', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Performance;

            // when
            when(
                eventsPayload.getBizEventsPayload(
                    anyString(),
                    anything(),
                    anyNumber(),
                ),
            ).thenReturn('Payload');

            session.sendBizEvent('type', {});

            // then
            verify(payloadBuilder.sendEvent(anything())).once();
        });

        it('should be able to send an biz event if DCL = UserBehavior', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.UserBehavior;

            // when
            when(
                eventsPayload.getBizEventsPayload(
                    anyString(),
                    anything(),
                    anyNumber(),
                ),
            ).thenReturn('Payload');

            session.sendBizEvent('type', {});

            // then
            verify(payloadBuilder.sendEvent(anything())).once();
        });
    });

    describe('sendEvent', () => {
        it('should not be possible to send an event if the name is not a string', () => {
            // when
            // @ts-ignore
            session.sendEvent(1337, {});

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should not be possible to send an event if the name is empty', () => {
            // when
            // @ts-ignore
            session.sendEvent('', {});

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should not be possible to send an event if payload contains top-level array', () => {
            // when
            // @ts-ignore
            session.sendEvent('name', []);

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should not be possible to send an event if payload is too big', () => {
            // when
            const jsonObject: { [key: string]: string } = {};

            for (let i = 0; i < 1000; i++) {
                jsonObject['Test' + i] =
                    'This is a Test String, so the payload is big enough';
            }

            // Override mock to return a payload which is big
            when(
                eventsPayload.getCustomEventsPayload(
                    anyString(),
                    anything(),
                    anyNumber(),
                ),
            ).thenReturn(JSON.stringify(jsonObject));

            // @ts-ignore
            session.sendEvent('EventName', jsonObject);

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should not be possible to send an event if payload has no top-level json or invalid json', () => {
            // when
            // @ts-ignore
            session.sendEvent('eventName', []);
            // @ts-ignore
            session.sendEvent('eventName', NaN);
            // @ts-ignore
            session.sendEvent('eventName', 17);
            // @ts-ignore
            session.sendEvent('eventName', 'test');
            // @ts-ignore
            session.sendEvent('eventName', true);
            // @ts-ignore
            session.sendEvent('eventName', undefined);
            // @ts-ignore
            session.sendEvent('eventName', null);

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should not be possible to send an event if DCL = Off', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            session.sendEvent('name', {});

            // then
            verify(payloadBuilder.sendEvent(anything())).never();
        });

        it('should be able to send an event if DCL = Performance', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Performance;

            // when
            when(
                eventsPayload.getCustomEventsPayload(
                    anyString(),
                    anything(),
                    anyNumber(),
                ),
            ).thenReturn('Payload');

            session.sendEvent('name', {});

            // then
            verify(payloadBuilder.sendEvent(anything())).once();
        });

        it('should be able to send an event if DCL = UserBehavior', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.UserBehavior;

            // when
            when(
                eventsPayload.getCustomEventsPayload(
                    anyString(),
                    anything(),
                    anyNumber(),
                ),
            ).thenReturn('Payload');

            session.sendEvent('name', {});

            // then
            verify(payloadBuilder.sendEvent(anything())).once();
        });
    });

    describe('reportError', () => {
        it('should not be possible to report an error if the name is not a string', () => {
            // when
            // @ts-ignore
            session.reportError(session, 1337);

            // then
            verify(
                payloadBuilder.reportError(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should not be possible to report an error if the name is empty', () => {
            // when
            session.reportError('', 1337);

            // then
            verify(
                payloadBuilder.reportError(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should not be possible to report an error if the code is not a number', () => {
            // when
            // @ts-ignore
            session.reportError('name', 'invalid number');

            // then
            verify(
                payloadBuilder.reportError(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should not be possible to report an error if DCL = Off', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            session.reportError('name', 1337);

            // then
            verify(
                payloadBuilder.reportError(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should be able to report an error if DCL = Performance', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Performance;

            // when
            session.reportError('name', 1337);

            // then
            verify(payloadBuilder.reportError('name', 1337, 0, 2, 2000)).once();
            verify(
                payloadBuilder.reportError(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).once();
        });

        it('should be able to report an error if DCL = UserBehavior', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.UserBehavior;

            // when
            session.reportError('name', 1337);

            // then
            verify(payloadBuilder.reportError('name', 1337, 0, 2, 2000)).once();
            verify(
                payloadBuilder.reportError(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).once();
        });
    });

    describe('traceWebRequest', () => {
        it('should return defaultNullWebRequest if the url is not a string', () => {
            // when
            // @ts-ignore
            const wr = session.traceWebRequest({} as string);

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

        it('should return defaultNullWebRequest if the url is not valid', () => {
            // when
            const wr = session.traceWebRequest('foobar/://');

            // then
            expect(wr).toBe(defaultNullWebRequestTracer);
        });

        it('should return defaultNullWebRequest if dcl = Off', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            const wr = session.traceWebRequest('https://example.com');

            // then
            expect(wr).toBe(defaultNullWebRequestTracer);
        });

        it('should return a webRequestTracer object with valid inputs and DCL = Performance', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Performance;

            // when
            const wr = session.traceWebRequest('https://example.com');

            // then
            expect(wr).toBeInstanceOf(WebRequestTracerImpl);
        });

        it('should return a webRequestTracer object with valid inputs and DCL = UserBehavior', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.UserBehavior;

            // when
            const wr = session.traceWebRequest('https://example.com');

            // then
            expect(wr).toBeInstanceOf(WebRequestTracerImpl);
        });
    });

    describe('reportCarrier', () => {
        it('should not be possible to report an empty carrier', () => {
            session.reportCarrier('');
            expect(supplementaryBasicData.carrier).toBe(undefined);
        });

        it('should not be possible to report an non string carrier', () => {
            // @ts-ignore
            session.reportCarrier(2);
            expect(supplementaryBasicData.carrier).toBe(undefined);
        });

        it('should be possible to report carrier', () => {
            session.reportCarrier('carrier');
            expect(supplementaryBasicData.carrier).toBe('carrier');
        });

        it('should be possible to clear the carrier', () => {
            session.reportCarrier('carrier');
            session.reportCarrier(undefined);
            expect(supplementaryBasicData.carrier).toBe(undefined);
        });

        it('should be possible to override the carrier', () => {
            session.reportCarrier('carrier');
            expect(supplementaryBasicData.carrier).toBe('carrier');

            session.reportCarrier('carrier2');
            expect(supplementaryBasicData.carrier).toBe('carrier2');
        });
    });

    describe('reportNetworkTechnology', () => {
        it('should not be possible to report an empty network technology', () => {
            session.reportNetworkTechnology('');
            expect(supplementaryBasicData.networkTechnology).toBe(undefined);
        });

        it('should not be possible to report an non string network technology', () => {
            // @ts-ignore
            session.reportNetworkTechnology(2);
            expect(supplementaryBasicData.networkTechnology).toBe(undefined);
        });

        it('should be possible to report network technology', () => {
            session.reportNetworkTechnology('network technology');
            expect(supplementaryBasicData.networkTechnology).toBe(
                'network technology',
            );
        });

        it('should be possible to clear network technology', () => {
            session.reportNetworkTechnology('network technology');
            session.reportNetworkTechnology(undefined);
            expect(supplementaryBasicData.networkTechnology).toBe(undefined);
        });

        it('should be possible to override the network technology', () => {
            session.reportNetworkTechnology('network technology');
            expect(supplementaryBasicData.networkTechnology).toBe(
                'network technology',
            );

            session.reportNetworkTechnology('network technology2');
            expect(supplementaryBasicData.networkTechnology).toBe(
                'network technology2',
            );
        });
    });

    describe('reportConnectionType', () => {
        it('should not be possible to report an int instead of connection type', () => {
            // @ts-ignore
            session.reportConnectionType(2);
            expect(supplementaryBasicData.connectionType).toBe(undefined);
        });

        it('should be possible to report connection type', () => {
            session.reportConnectionType(ConnectionType.Lan);
            expect(supplementaryBasicData.connectionType).toBe(
                ConnectionType.Lan,
            );
        });

        it('should be possible to clear connection type', () => {
            session.reportConnectionType(ConnectionType.Lan);
            session.reportConnectionType(undefined);
            expect(supplementaryBasicData.connectionType).toBe(undefined);
        });

        it('should be possible to override the connection type', () => {
            session.reportConnectionType(ConnectionType.Mobile);
            expect(supplementaryBasicData.connectionType).toBe(
                ConnectionType.Mobile,
            );

            session.reportConnectionType(ConnectionType.Wifi);
            expect(supplementaryBasicData.connectionType).toBe(
                ConnectionType.Wifi,
            );
        });
    });

    describe('end', () => {
        it('should set the action as shutdown if DCL = Off', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            session.end();

            // then
            expect(session.isShutdown()).toBeTruthy();
        });
        it('should set the action as shutdown if DCL = Performance', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Performance;

            // when
            session.end();

            // then
            expect(session.isShutdown()).toBeTruthy();
        });
        it('should set the action as shutdown if DCL = UserBehavior', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.UserBehavior;

            // when
            session.end();

            // then
            expect(session.isShutdown()).toBeTruthy();
        });

        it('should close all child-actions', () => {
            // given
            const action1 = session.enterAction('action 1');
            const action2 = session.enterAction('action 2');

            const action1Spy = spy(action1);
            const action2Spy = spy(action2);

            // when
            session.end();

            // then
            verify(action1Spy.leaveAction()).once();
            verify(action2Spy.leaveAction()).once();
            expect(session.isShutdown()).toBeTruthy();
        });

        it('should remove a single child from the children-array', () => {
            // given
            const action1 = session.enterAction('action 1');
            const action2 = session.enterAction('action 2');

            // when
            action1.leaveAction();

            // then
            const openActions = session._getOpenActions();

            expect(openActions.indexOf(action1)).toBe(-1);
            expect(openActions.indexOf(action2)).not.toBe(-1);
        });

        it('should not add the session close payload if DCL = Off, but shut the session down', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            session.end();

            // then
            expect(session.isShutdown()).toBeTruthy();
            verify(payloadBuilder.endSession(anything(), anything())).never();
        });

        it('should close all actions if DCL = Off', () => {
            // this is given through the fact that you can't spawn actions with DCL = Off.
        });

        it('should add the endSession-payload if DCL = Performance', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Performance;

            // when
            session.end();

            // then
            verify(payloadBuilder.endSession(2, 2000)).once();
        });

        it('should add the endSession-payload only once if DCL != Off', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Performance;

            // when
            session.end();
            session.end();

            // then
            verify(payloadBuilder.endSession(2, 2000)).once();
        });
    });
});
