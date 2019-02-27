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
        it('should timeout if the initialization does not happen and a timeout is set', (done) => {
            const openKit = buildOpenKit();
            openKit.waitForInit(tf => {
                expect(tf).toBe(false);
                done();
            }, 100);

        });

        it('should not timeout if the initialization does not happen and a timeout is not set', (done) => {
            jest.setTimeout(5000);
            const openKit = buildOpenKit();
            let result: boolean | undefined = undefined;

            openKit.waitForInit(tf => result = tf);

            const wait = setTimeout(() => {
                clearTimeout(wait);
                expect(result).toBeUndefined();
                done();
            }, 4000);
        });

        it('should return a value after the object got initialized', (done) => {
            // given
           when(mockCommunicationChannel.sendStatusRequest(anything(), anything()))
               .thenResolve({valid: true});

           // when
           const openKit = buildOpenKit();
           openKit.initialize();
           openKit.waitForInit(tf => {
               // then
               expect(tf).toBe(true);

               done();
           })
        });

        it('should return a value after the object got initialized but with an invalid response', (done) => {
            // given
           when(mockCommunicationChannel.sendStatusRequest(anything(), anything()))
               .thenResolve({valid: false});

           // when
           const openKit = buildOpenKit();
           openKit.initialize();
           openKit.waitForInit(tf => {
               // then
               expect(tf).toBe(false);
               done();
           });
        });

        it('should update the state after the initial request', (done) => {
            when(mockCommunicationChannel.sendStatusRequest(anything(), anything()))
                .thenResolve({valid: true, multiplicity: 6});

            // when
            const openKit = buildOpenKit();
            openKit.initialize();

            openKit.waitForInit(() => {
                // then
                expect(openKit.state.multiplicity).toBe(6);
                done();
            });
        });

        it('should immediately resolve if openKit already initialized', (done) => {
            // given
            when(mockCommunicationChannel.sendStatusRequest(anything(), anything())).thenResolve({valid: true});

            const openKit = buildOpenKit();
            openKit.initialize();

            openKit.waitForInit(() => {
                // when
                openKit.waitForInit(tf => {
                    // then
                    expect(tf).toBe(true);
                    done();
                }, 0); // 0 => force using no timeout
            });
        });

        it('should immediately resolve if openKit already initialized and shutdown', (done) => {
            // given
            when(mockCommunicationChannel.sendStatusRequest(anything(), anything())).thenResolve({valid: true});

            const openKit = buildOpenKit();
            openKit.initialize();

            openKit.waitForInit(() => {
                openKit.shutdown();

                // when
                openKit.waitForInit(tf => {
                    expect(tf).toBe(false);

                    done();
                }, 0); // 0 => force using no timeout
            });
        });

        it('should not initialize if the status request throws an error', (done) => {
            // given
            when(mockCommunicationChannel.sendStatusRequest(anything(), anything())).thenThrow(new Error(''));

            // when
            const openKit = buildOpenKit();
            openKit.initialize();

            openKit.waitForInit(tf => {
                // then
                expect(tf).toBe(false);

                done();
            });
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

          openKit.state.updateFromResponse({valid: true, multiplicity: 0});

          expect(openKit.createSession()).toBe(defaultNullSession);
       });

       it('should not create if capture is off', () => {
          const openKit = buildOpenKit();

          openKit.state.updateFromResponse({valid: true, captureMode: CaptureMode.Off});

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
