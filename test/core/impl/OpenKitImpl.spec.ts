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

import { anything, instance, mock, reset, spy, verify, when } from 'ts-mockito';
import { CrashReportingLevel, DataCollectionLevel } from '../../../src';
import { CommunicationChannel } from '../../../src/api/communication/CommunicationChannel';
import { StatusRequest } from '../../../src/api/communication/StatusRequest';
import { CaptureMode, StatusResponse } from '../../../src/api/communication/StatusResponse';
import { Configuration } from '../../../src/core/config/Configuration';
import { defaultNullSession } from '../../../src/core/impl/NullSession';
import { OpenKitImpl } from '../../../src/core/impl/OpenKitImpl';
import { Status } from '../../../src/core/impl/OpenKitObject';
import { SessionImpl } from '../../../src/core/impl/SessionImpl';

class StubCommunicationChannel implements CommunicationChannel {
    public sendNewSessionRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return Promise.resolve({ valid: false });
    }
    public sendPayloadData(url: string, request: StatusRequest, query: string): Promise<StatusResponse> {
        return Promise.resolve({ valid: false });
    }
    public sendStatusRequest(url: string, request: StatusRequest): Promise<StatusResponse> {
        return Promise.resolve({ valid: false });
    }
}

describe('OpenKitImpl', () => {
    let config: Partial<Configuration>;
    let mockCommunicationChannel: CommunicationChannel = mock(StubCommunicationChannel);

    beforeEach(() => {
        reset(mockCommunicationChannel);
        const communicationChannelInstance = instance(mockCommunicationChannel);

        config = {
            applicationId: 'app-id',
            applicationName: '',
            deviceId: 4,
            dataCollectionLevel: DataCollectionLevel.UserBehavior,
            crashReportingLevel: CrashReportingLevel.OptOutCrashes,

            communicationFactory: {
                getCommunicationChannel(): CommunicationChannel {
                    return communicationChannelInstance;
                },
            },
        };
    });

    const buildOpenKit = () => new OpenKitImpl(config as Configuration);

    it('should be idle after creation', () => {
        const openKit = buildOpenKit();

        expect(openKit.isInitialized()).toBe(false);
        expect(openKit.status).toBe(Status.Idle);
    });

    describe('waitForInit', () => {
        it('should timeout if the initialization does not happen and a timeout is set', async () => {
            const openKit = buildOpenKit();
            const result = await openKit.waitForInit(100);

            expect(result)
                .toBe(false);
        });

        it('should not timeout if the initialization does not happen and a timeout is not set', async (done) => {
            jest.setTimeout(5000);
            const openKit = buildOpenKit();
            let result: boolean | undefined = undefined;

            openKit.waitForInit().then(tf => result = tf);

            const wait = setTimeout(() => {
                clearTimeout(wait);
                expect(result).toBeUndefined();
                done();
            }, 4000);
        });

        it('should return a value after the object got initialized', async() => {
            // given
           when(mockCommunicationChannel.sendStatusRequest(anything(), anything()))
               .thenResolve({valid: true});

           // when
           const openKit = buildOpenKit();
           openKit.initialize();
           const result = await openKit.waitForInit();

           // then
           expect(result).toBe(true);
        });

        it('should return a value after the object got initialized but with an invalid response', async() => {
            // given
           when(mockCommunicationChannel.sendStatusRequest(anything(), anything()))
               .thenResolve({valid: false});

           // when
           const openKit = buildOpenKit();
           openKit.initialize();
           const result = await openKit.waitForInit();

           // then
           expect(result).toBe(false);
        });

        it('should update the state after the initial request', async() => {
            when(mockCommunicationChannel.sendStatusRequest(anything(), anything()))
                .thenResolve({valid: true, multiplicity: 6});

            // when
            const openKit = buildOpenKit();
            openKit.initialize();

            await openKit.waitForInit();

            // then
            expect(openKit.state.multiplicity).toBe(6);
        });

        it('should immediately resolve if openKit already initialized', async() => {
            // given
            when(mockCommunicationChannel.sendStatusRequest(anything(), anything())).thenResolve({valid: true});

            const openKit = buildOpenKit();
            openKit.initialize();

            await openKit.waitForInit();

            // when
            const result = await openKit.waitForInit(0); // 0 => force using no timeout
            expect(result).toBe(true);
        });

        it('should immediately resolve if openKit already initialized and shutdown', async() => {
            // given
            when(mockCommunicationChannel.sendStatusRequest(anything(), anything())).thenResolve({valid: true});

            const openKit = buildOpenKit();
            openKit.initialize();

            await openKit.waitForInit();
            openKit.shutdown();

            // when
            const result = await openKit.waitForInit(0); // 0 => force using no timeout
            expect(result).toBe(true);
        });
    });

    describe('create session', () => {
       it('should not create if the status = Shutdown', () => {
          const openKit = buildOpenKit();
          openKit.shutdown();

          expect(openKit.createSession()).toBe(defaultNullSession);
       });

       it('should not create if multiplicity = 0', () => {
          const openKit = buildOpenKit();

          openKit.state.updateState({valid: true, multiplicity: 0});

          expect(openKit.createSession()).toBe(defaultNullSession);
       });

       it('should not create if capture is off', () => {
          const openKit = buildOpenKit();

          openKit.state.updateState({valid: true, captureMode: CaptureMode.Off});

          expect(openKit.createSession()).toBe(defaultNullSession);
       });

       it('should put the created session in the openSessions - array', () => {
           // given
           const openKit = buildOpenKit();
           const openSessions = (openKit as any).openSessions;

            // when
           const session = openKit.createSession();

            // then
           expect(openSessions.indexOf(session)).not.toBe(-1);
           expect(openKit.createSession()).not.toBe(defaultNullSession);
           expect(openKit.createSession()).toBeInstanceOf(SessionImpl);
       });

       it('should put and remove the created session in the openSessions - array', () => {
           // given
           const openKit = buildOpenKit();
           const openSessions = (openKit as any).openSessions;

            // when
           const session = openKit.createSession();
           openKit.removeSession(session as SessionImpl);

           // then
           expect(openSessions.indexOf(session)).toBe(-1);
       });

       it('should close all open sessions after a shutdown', () => {
           // given
           const openKit = buildOpenKit();
           const openSessions = (openKit as any).openSessions;

           const session = openKit.createSession();
           const session2 = openKit.createSession();

           const session1Spy = spy(session);
           const session2Spy = spy(session2);

            // when
           openKit.shutdown();

           // then

           verify(session1Spy.end()).once();
           verify(session2Spy.end()).once();
           expect(openSessions.indexOf(session)).toBe(-1);
       });
    });
});
