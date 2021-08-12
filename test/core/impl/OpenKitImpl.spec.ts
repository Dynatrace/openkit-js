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
import { BeaconSenderImpl } from '../../../src/core/beacon/BeaconSender';
import { AbstractSendingStrategy } from '../../../src/core/beacon/strategies/SendingStrategy';
import { HttpCommunicationChannel } from '../../../src/core/communication/http/state/HttpCommunicationChannel';
import { Configuration } from '../../../src/core/config/Configuration';
import { defaultNullSession } from '../../../src/core/impl/null/NullSession';
import { OpenKitImpl } from '../../../src/core/impl/OpenKitImpl';
import { SessionImpl } from '../../../src/core/impl/SessionImpl';
import { defaultNullLoggerFactory } from '../../../src/core/logging/NullLoggerFactory';
import { DefaultRandomNumberProvider } from '../../../src/core/provider/DefaultRandomNumberProvider';
import { timeout } from '../../../src/core/utils/Utils';
import { Mutable } from '../../Helpers';

describe('OpenKitImpl', () => {
    let ok: OpenKitImpl;
    let config: Mutable<Configuration>;

    const random = mock(DefaultRandomNumberProvider);
    const comm = mock(HttpCommunicationChannel);
    const ss = mock(AbstractSendingStrategy);

    beforeEach(() => {
        config = {
            openKit: {
                loggerFactory: defaultNullLoggerFactory,
                deviceId: '42',
                applicationId: 'application-id',
                random: instance(random),
                communicationChannel: instance(comm),
                sendingStrategies: [instance(ss)],
                beaconURL: 'http://example.com',
            },

            privacy: {
                crashReportingLevel: CrashReportingLevel.OptInCrashes,
                dataCollectionLevel: DataCollectionLevel.UserBehavior,
            },
            device: {},
            meta: {},
        };

        when(comm.sendStatusRequest(anything(), anything())).thenResolve({
            valid: true,
        });
        when(comm.sendNewSessionRequest(anything(), anything())).thenResolve({
            valid: true,
        });
        when(
            comm.sendPayloadData(anything(), anything(), anything()),
        ).thenResolve({
            valid: true,
        });

        ok = new OpenKitImpl(config);
    });

    describe('initial', () => {
        it('should be not initialized and not shutdown', () => {
            expect(ok.isInitialized()).toBeFalsy();
            expect(ok._isShutdown()).toBeFalsy();
        });

        it('should have initialized the beaconSender', () => {
            expect(ok._getBeaconSender()).toBeInstanceOf(BeaconSenderImpl);
        });
    });

    describe('initialize', () => {
        it('should init the beaconSender', () => {
            // given
            const sender = spy(ok._getBeaconSender());

            // when
            ok.initialize();

            // then
            verify(sender.init()).once();
        });
    });

    describe('shutdown', () => {
        it('should set the shutdown flag', () => {
            // when
            ok.shutdown();

            // then
            expect(ok._isShutdown()).toBeTruthy();
        });

        it('should notify the beaconsender to shutdown, and only once', () => {
            // given
            const sender = spy(ok._getBeaconSender());

            // when
            ok.shutdown();

            // then
            verify(sender.shutdown()).once();

            // given
            reset(sender);

            // when
            ok.shutdown();

            // then
            verify(sender.shutdown()).never();
        });

        it('should call shutdownCallback when beaconsender is shut down', async () => {
            jest.setTimeout(3500);
            const spy = jest.fn();

            // given
            ok.shutdown(spy);

            // when
            await timeout(3000);

            // then
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('notifyInitialized', () => {
        it('should set initialized to true', () => {
            // when
            ok.notifyInitialized(false);

            // then
            expect(ok.isInitialized()).toBeTruthy();
        });

        it('should resolve all waiting listeners with the passed boolean value (true)', () => {
            // given
            let value: any;
            const cb = (tf: any) => (value = tf);
            ok.waitForInit(cb);

            // when
            ok.notifyInitialized(true);

            // then
            expect(value).toBe(true);
        });

        it('should resolve all waiting listeners with the passed boolean value (false)', () => {
            // given
            let value: any;
            const cb = (tf: any) => (value = tf);
            ok.waitForInit(cb);

            // when
            ok.notifyInitialized(false);

            // then
            expect(value).toBe(false);
        });

        it('should shutdown if the initialization was not successful', () => {
            // given
            const oks = spy(ok);

            // when
            ok.notifyInitialized(false);

            // then
            verify(oks.shutdown()).once();
        });

        it('should not shutdown if the initialization was successful', () => {
            // given
            const oks = spy(ok);

            // when
            ok.notifyInitialized(true);

            // then
            verify(oks.shutdown()).never();
        });
    });

    describe('waitForInit', () => {
        let v1: boolean | undefined;
        let v2: boolean | undefined;

        const cb1 = (tf: boolean) => (v1 = tf);
        const cb2 = (tf: boolean) => (v2 = tf);

        beforeEach(() => {
            v1 = undefined;
            v2 = undefined;
        });

        it('should call the cb immediately, if ok already initialized successfully', () => {
            // given
            ok.notifyInitialized(true);

            // when
            ok.waitForInit(cb1);

            // then
            expect(v1).toBe(true);
        });

        it('should call the cb immediately, if ok already initialized not successfully and is shutdown', () => {
            // given
            ok.notifyInitialized(false);

            // when
            ok.waitForInit(cb1);

            // then
            expect(v1).toBe(true);
        });

        it('should call the cb after ok got initialized', () => {
            // given
            ok.waitForInit(cb1);

            // when
            ok.notifyInitialized(true);

            // then
            expect(v1).toBe(true);
        });

        it('should wait if a timeout is passed, and fail after that amount if no initialization happened', (done) => {
            const startTime = new Date().getTime();

            // given, when
            ok.waitForInit((cb: boolean) => {
                const duration = new Date().getTime() - startTime;

                expect(duration).toBeGreaterThanOrEqual(1000);
                expect(cb).toBe(false);

                done();
            }, 1000);
        });

        it('should also resolve multiple callbacks', async () => {
            jest.setTimeout(5000);

            // given
            ok.waitForInit(cb1, 2000);
            ok.waitForInit(cb2);

            // when
            await timeout(3000);
            ok.notifyInitialized(true);

            // then
            expect(v1).toBe(false);
            expect(v2).toBe(true);
        });

        it('should resolve immedeately even with timeout', async (done) => {
            jest.setTimeout(5000);

            const startTime = new Date().getTime();

            // given
            ok.waitForInit((cb: boolean) => {
                const duration = new Date().getTime() - startTime;

                expect(duration).toBeLessThan(1500);
                expect(cb).toBe(true);

                done();
            }, 3000);

            // when
            await timeout(1000);
            expect(v1).toBe(undefined);
            ok.notifyInitialized(true);
        });
    });

    describe('createSession', () => {
        it('should return defaultNullSession if ok is shutdown', () => {
            // given
            ok.shutdown();

            // when
            const session = ok.createSession();

            // then
            expect(session).toBe(defaultNullSession);
        });

        it('should return a valid session', () => {
            // given
            const sender = spy(ok._getBeaconSender());
            const cache = spy(ok._getPayloadCache());

            // when
            const session = ok.createSession() as SessionImpl;

            // then
            expect(session).toBeInstanceOf(SessionImpl);
            verify(sender.sessionAdded(anything())).once();
            verify(
                cache.register(session, anyString(), anything(), anything()),
            ).once();
            expect(session.sessionId).toBe(1);
        });
    });
});
