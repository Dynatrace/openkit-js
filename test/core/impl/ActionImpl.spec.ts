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
import { CrashReportingLevel, DataCollectionLevel } from '../../../src';
import {
    OpenKitConfiguration,
    PrivacyConfiguration,
} from '../../../src/core/config/Configuration';
import { ActionImpl } from '../../../src/core/impl/ActionImpl';
import { defaultNullWebRequestTracer } from '../../../src/core/impl/null/NullWebRequestTracer';
import { PayloadBuilderHelper } from '../../../src/core/impl/PayloadBuilderHelper';
import { SessionImpl } from '../../../src/core/impl/SessionImpl';
import { WebRequestTracerImpl } from '../../../src/core/impl/WebRequestTracerImpl';
import { defaultNullLoggerFactory } from '../../../src/core/logging/NullLoggerFactory';
import { TimestampProvider } from '../../../src/core/provider/TimestampProvider';
import { Mutable } from '../../Helpers';

describe('ActionImpl', () => {
    const sessionMock = mock(SessionImpl);
    const payloadBuilder = mock(PayloadBuilderHelper);
    const timestampProviderMock = mock(TimestampProvider);

    let action: ActionImpl;
    let config: Partial<Mutable<PrivacyConfiguration & OpenKitConfiguration>>;

    beforeEach(() => {
        config = {
            crashReportingLevel: CrashReportingLevel.OptInCrashes,
            dataCollectionLevel: DataCollectionLevel.UserBehavior,

            loggerFactory: defaultNullLoggerFactory,
        };

        reset(sessionMock);
        reset(payloadBuilder);
        reset(timestampProviderMock);

        when(payloadBuilder.createSequenceNumber()).thenReturn(5, 6, 7);
        when(payloadBuilder.createActionId()).thenReturn(3);
        when(timestampProviderMock.getCurrentTimestampMs()).thenReturn(4500);

        const timestampInstance = instance(timestampProviderMock);
        when(payloadBuilder.currentTimestamp()).thenCall(() =>
            timestampInstance.getCurrentTimestampMs(),
        );

        action = new ActionImpl(
            'my action',
            1000,
            instance(sessionMock),
            instance(payloadBuilder),
            config as PrivacyConfiguration & OpenKitConfiguration,
        );
    });

    it('should create the action', () => {
        expect(action.name).toEqual('my action');
        expect(action.startSequenceNumber).toBe(5);
        expect(action.actionId).toBe(3);
        expect(action.startTime).toEqual(1000);
    });

    it('should set endSequenceNumber and endTime on leaveAction call', () => {
        action.leaveAction();

        expect(action.endSequenceNumber).toBe(6);
        expect(action.endTime).toBe(4500);

        verify(sessionMock._endAction(action)).once();
        verify(payloadBuilder.addAction(action)).once();
    });

    it('if leaveAction() was already called, do not process it again', () => {
        action.leaveAction();
        action.leaveAction();

        expect(action.endSequenceNumber).toBe(6);
        expect(action.endTime).toBe(4500);

        verify(sessionMock._endAction(action)).once();
        verify(payloadBuilder.addAction(action)).once();
    });

    describe('reportValue', () => {
        describe('invalid values', () => {
            it('should not report a value if the action already ended', () => {
                // given
                action.leaveAction();

                // when
                action.reportValue('Some Name', 'Some Value');

                // then
                verify(
                    payloadBuilder.reportValue(
                        anything(),
                        anything(),
                        anything(),
                    ),
                ).never();
            });

            it('should not report a value if DCL = Off', () => {
                // given
                config.dataCollectionLevel = DataCollectionLevel.Off;

                // when
                action.reportValue('Some Name', 'Some Value');

                // then
                verify(
                    payloadBuilder.reportValue(
                        anything(),
                        anything(),
                        anything(),
                    ),
                ).never();
            });

            it('should not report a value if DCL = Performance', () => {
                // given
                config.dataCollectionLevel = DataCollectionLevel.Performance;

                // when
                action.reportValue('Some Name', 'Some Value');

                // then
                verify(
                    payloadBuilder.reportValue(
                        anything(),
                        anything(),
                        anything(),
                    ),
                ).never();
            });

            it('should not report a value if the name is not a string', () => {
                action.reportValue((undefined as unknown) as string, '');
                verify(
                    payloadBuilder.reportValue(
                        anything(),
                        anything(),
                        anything(),
                    ),
                ).never();
            });

            it('should not report a value if the name is empty', () => {
                action.reportValue('', '');
                verify(
                    payloadBuilder.reportValue(
                        anything(),
                        anything(),
                        anything(),
                    ),
                ).never();
            });

            it('should not report a value if the value not a string, number, null or undefined', () => {
                action.reportValue('Name', ({} as unknown) as undefined);
                verify(
                    payloadBuilder.reportValue(
                        anything(),
                        anything(),
                        anything(),
                    ),
                ).never();
            });
        });

        describe('valid values', () => {
            it('should report a value if the value is string', () => {
                action.reportValue('Name', 'Value');

                verify(
                    payloadBuilder.reportValue(action, 'Name', 'Value'),
                ).once();
            });

            it('should report a value if the value is a number', () => {
                action.reportValue('Name', 1234);

                verify(payloadBuilder.reportValue(action, 'Name', 1234)).once();
            });

            it('should report a value if the value is undefined', () => {
                action.reportValue('Name', undefined);

                verify(
                    payloadBuilder.reportValue(action, 'Name', undefined),
                ).once();
            });

            it('should report a value if the value is null', () => {
                action.reportValue('Name', null);

                verify(payloadBuilder.reportValue(action, 'Name', null)).once();
            });
        });
    });

    describe('reportEvent', () => {
        it('should not be able to report an event if the action is closed', () => {
            // given
            action.leaveAction();

            // when
            action.reportEvent('Some name');

            // then
            verify(payloadBuilder.reportEvent(anything(), anything())).never();
        });

        it('should not be able to report an event if the DCL = Off', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Off;

            // when
            action.reportEvent('Some name');

            // then
            verify(payloadBuilder.reportEvent(anything(), anything())).never();
        });

        it('should not be able to report an event if the DCL = Performance', () => {
            // given
            config.dataCollectionLevel = DataCollectionLevel.Performance;

            // when
            action.reportEvent('Some name');

            // then
            verify(payloadBuilder.reportEvent(anything(), anything())).never();
        });

        it('should not be able to report an event if name is not a string', () => {
            // when
            // @ts-ignore
            action.reportEvent(action);

            // then
            verify(payloadBuilder.reportEvent(anything(), anything())).never();
        });

        it('should not be able to report an event if name is an empty string', () => {
            // when
            action.reportEvent('');

            // then
            verify(payloadBuilder.reportEvent(anything(), anything())).never();
        });

        it('should be able to report an event', () => {
            // when
            action.reportEvent('Some name');

            // then
            verify(
                payloadBuilder.reportEvent(action.actionId, 'Some name'),
            ).once();
            verify(payloadBuilder.reportEvent(anything(), anything())).once();
        });
    });

    describe('reportError', () => {
        it('should not be possible to report an error if the name is not a string', () => {
            // when
            // @ts-ignore
            action.reportError(action, 1337, 'message');

            // then
            verify(
                payloadBuilder.reportError(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should not be possible to report an error if the name is empty', () => {
            // when
            action.reportError('', 1337, 'message');

            // then
            verify(
                payloadBuilder.reportError(
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
            action.reportError('name', 'invalid number', 'message');

            // then
            verify(
                payloadBuilder.reportError(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should not be possible to report an error if the action is closed', () => {
            // given
            action.leaveAction();

            // when
            action.reportError('name', 1337, 'message');

            // then
            verify(
                payloadBuilder.reportError(
                    anything(),
                    anything(),
                    anything(),
                    anything(),
                ),
            ).never();
        });

        it('should be able to report an error', () => {
            // when
            action.reportError('name', 1337, 'message');

            // then
            verify(
                payloadBuilder.reportError(
                    action.actionId,
                    'name',
                    1337,
                    'message',
                ),
            ).once();
            verify(
                payloadBuilder.reportError(
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
            const wr = action.traceWebRequest(action);

            // then
            expect(wr).toBe(defaultNullWebRequestTracer);
        });

        it('should return defaultNullWebRequest if the url is empty string', () => {
            // when
            // @ts-ignore
            const wr = action.traceWebRequest('');

            // then
            expect(wr).toBe(defaultNullWebRequestTracer);
        });

        it('should return defaultNullWebRequest if the url is not valid', () => {
            // when
            const wr = action.traceWebRequest('foobar/://');

            // then
            expect(wr).toBe(defaultNullWebRequestTracer);
        });

        it('should return defaultNullWebRequest if the action is closed', () => {
            // when
            action.leaveAction();
            const wr = action.traceWebRequest('https://example.com');

            // then
            expect(wr).toBe(defaultNullWebRequestTracer);
        });

        it('should return a webRequestTracer object with valid inputs', () => {
            // when
            const wr = action.traceWebRequest('https://example.com');

            // then
            expect(wr).toBeInstanceOf(WebRequestTracerImpl);
        });
    });
});
