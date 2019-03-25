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

import { instance, mock, reset, when } from 'ts-mockito';
import { PayloadBuilderHelper } from '../../../src/core/impl/PayloadBuilderHelper';
import { WebRequestTracerImpl } from '../../../src/core/impl/WebRequestTracerImpl';
import { defaultNullLoggerFactory } from '../../../src/core/logging/NullLoggerFactory';

describe('WebRequestTracerImpl', () => {
    let payloadDataMock = mock(PayloadBuilderHelper);

    beforeEach(() => {
        reset(payloadDataMock);

        when(payloadDataMock.createSequenceNumber()).thenReturn(6, 9);
        when(payloadDataMock.currentTimestamp()).thenReturn(500, 800, 1400);
    });

    const build = () => new WebRequestTracerImpl(
        instance(payloadDataMock),
        70,
        'https://example.com',
        defaultNullLoggerFactory,
        5,
        '123456',
        '1234-65434-86123',
        98765
    );

    describe('setBytesReceived', () => {
        it('should not update bytesReceived if the request is stopped', () => {
            // given
            const wr = build();
            wr.setBytesReceived(1000);
            wr.stop();

            // when
            wr.setBytesReceived(2000);

            // then
            expect(wr.getBytesReceived()).toBe(1000);
        });

        it('should have a default value of -1', () => {
            // given
            const wr = build();

            // then
            expect(wr.getBytesReceived()).toBe(-1);
        });

        it('should update bytesReceived if the request is not stopped', () => {
            // given
            const wr = build();

            // when
            wr.setBytesReceived(400);

            // then
            expect(wr.getBytesReceived()).toBe(400);
        });
    });

    describe('setBytesSent', () => {
        it('should not update bytesSent if the request is stopped', () => {
            // given
            const wr = build();
            wr.setBytesSent(1000);
            wr.stop();

            // when
            wr.setBytesSent(2000);

            // then
            expect(wr.getBytesSent()).toBe(1000);
        });

        it('should have a default value of -1', () => {
            // given
            const wr = build();

            // then
            expect(wr.getBytesSent()).toBe(-1);
        });

        it('should update bytesSent if the request is not stopped', () => {
            // given
            const wr = build();

            // when
            wr.setBytesSent(400);

            // then
            expect(wr.getBytesSent()).toBe(400);
        });
    });

    describe('start', () => {
       it('should have the sequenceNumber and startTime without call of start()', () => {
            // given, when
           const wr = build();

           // then
           expect(wr.getStart()).toBe(500);
           expect(wr.getStartSequenceNumber()).toBe(6);
       });

       it('should set update startTime after a call to start()', () => {
           // given
           const wr = build();

           // when
           wr.start();

           // then
           expect(wr.getStart()).toBe(800);
           expect(wr.getStartSequenceNumber()).toBe(6);
       });

       it('should not update startTime if the webrequest is stopped', () => {
           // given
           const wr = build();

           // when
           wr.stop();
           wr.start();

           // then
           expect(wr.getStart()).toBe(500);
           expect(wr.getStartSequenceNumber()).toBe(6);
       });

       it('should return itself as return value', () => {
           // given
           const wr = build();

           // then
           expect(wr.start()).toBe(wr);
       });
    });

    describe('stop', () => {
        it('should set the duration after stop has been called', () => {
            // given
            const wr = build();

            // when
            wr.stop();

            // then
            expect(wr.getDuration()).toBe(300);
        });

        it('should set the end sequence number after stop has been called', () => {
            // given
            const wr = build();

            // when
            wr.stop();

            // then
            expect(wr.getEndSequenceNumber()).toBe(9);
        });

        it('should set the response code if one is passed', () => {
            // given
            const wr = build();

            // when
            wr.stop(404);

            // then
            expect(wr.getResponseCode()).toBe(404);
        });

        it('should have a default response code of -1', () => {
            // given
            const wr = build();

            // when
            wr.stop();

            // then
            expect(wr.getResponseCode()).toBe(-1);
        });

        it('should not update the response code if it is already stopped', () => {
            // given
            const wr = build();
            wr.stop();

            // when
            wr.stop(300);

            // then
            expect(wr.getResponseCode()).toBe(-1);
        });
    });

    describe('duration', () => {
        it('should return -1 if the webrequest is not stopped', () =>{
            // given
            const wr = build();

            // then
            expect(wr.getDuration()).toBe(-1);
        });

        it('should return the duration if the webrequest is stopped', () =>{
            // given
            const wr = build();

            // when
            wr.stop();

            // then
            expect(wr.getDuration()).toBe(300);
        });
    });

    it('should return the passed url', () => {
        // given
        const wr = build();

        // then
        expect(wr.getUrl()).toEqual('https://example.com');
    });

    describe('tag', () => {
       it('should build a valid tag', () => {
            // given
           const wr = build();

           // when
           const tag = wr.getTag();

           // then
           expect(tag).toEqual('MT_3_5_123456_98765_1234-65434-86123_70_1_6');
       });
    });
});
