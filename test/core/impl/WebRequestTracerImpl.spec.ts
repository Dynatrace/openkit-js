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

import { anything, instance, mock, reset, when } from 'ts-mockito';
import { PayloadBuilderHelper } from '../../../src/core/impl/PayloadBuilderHelper';
import { createTag, WebRequestTracerImpl } from '../../../src/core/impl/WebRequestTracerImpl';
import { defaultNullLogger } from '../../../src/core/logging/NullLogger';
import { defaultNullLoggerFactory } from '../../../src/core/logging/NullLoggerFactory';

describe('WebRequestTracerImpl', () => {
    let payloadBuilder = mock(PayloadBuilderHelper);
    let webRequest: WebRequestTracerImpl;

    beforeEach(() => {
        reset(payloadBuilder);

        when(payloadBuilder.createSequenceNumber()).thenReturn(6, 9);
        when(payloadBuilder.currentTimestamp()).thenReturn(500, 800, 1400);
        when(payloadBuilder.getWebRequestTracerTag(anything(), anything(), anything(), anything(), anything()))
            .thenCall((actionId: number,sessionNumber: number, sequenceNumber: number,deviceId: string,appId: string,) =>
                createTag(actionId, sessionNumber, sequenceNumber, 5, deviceId, appId),
        );

        webRequest = new WebRequestTracerImpl(
            instance(payloadBuilder),
            70,
            'https://example.com',
            defaultNullLoggerFactory,
            '123456',
            '1234-65434-86123',
            98765,
        );
    });

    describe('setBytesReceived', () => {
        it('should not update bytesReceived if the request is stopped', () => {
            // given
            webRequest.setBytesReceived(1000);
            webRequest.stop();

            // when
            webRequest.setBytesReceived(2000);

            // then
            expect(webRequest.getBytesReceived()).toBe(1000);
        });

        it('should have a default value of -1', () => {
            // then
            expect(webRequest.getBytesReceived()).toBe(-1);
        });

        it('should update bytesReceived if the request is not stopped', () => {
            // when
            webRequest.setBytesReceived(400);

            // then
            expect(webRequest.getBytesReceived()).toBe(400);
        });
    });

    describe('setBytesSent', () => {
        it('should not update bytesSent if the request is stopped', () => {
            // given
            webRequest.setBytesSent(1000);
            webRequest.stop();

            // when
            webRequest.setBytesSent(2000);

            // then
            expect(webRequest.getBytesSent()).toBe(1000);
        });

        it('should have a default value of -1', () => {
            // then
            expect(webRequest.getBytesSent()).toBe(-1);
        });

        it('should update bytesSent if the request is not stopped', () => {
            // when
            webRequest.setBytesSent(400);

            // then
            expect(webRequest.getBytesSent()).toBe(400);
        });
    });

    describe('start', () => {
       it('should have the sequenceNumber and startTime without call of start()', () => {
           // then
           expect(webRequest.getStart()).toBe(500);
           expect(webRequest.getStartSequenceNumber()).toBe(6);
       });

       it('should set update startTime after a call to start()', () => {
           // when
           webRequest.start();

           // then
           expect(webRequest.getStart()).toBe(800);
           expect(webRequest.getStartSequenceNumber()).toBe(6);
       });

       it('should not update startTime if the webRequest is stopped', () => {
           // when
           webRequest.stop();
           webRequest.start();

           // then
           expect(webRequest.getStart()).toBe(500);
           expect(webRequest.getStartSequenceNumber()).toBe(6);
       });

       it('should return itself as return value', () => {
           // then
           expect(webRequest.start()).toBe(webRequest);
       });
    });

    describe('stop', () => {
        it('should set the duration after stop has been called', () => {
            // when
            webRequest.stop();

            // then
            expect(webRequest.getDuration()).toBe(300);
        });

        it('should set the end sequence number after stop has been called', () => {
            // when
            webRequest.stop();

            // then
            expect(webRequest.getEndSequenceNumber()).toBe(9);
        });

        it('should set the response code if one is passed', () => {
            // when
            webRequest.stop(404);

            // then
            expect(webRequest.getResponseCode()).toBe(404);
        });

        it('should have a default response code of -1', () => {
            // when
            webRequest.stop();

            // then
            expect(webRequest.getResponseCode()).toBe(-1);
        });

        it('should not update the response code if it is already stopped', () => {
            // given
            webRequest.stop();

            // when
            webRequest.stop(300);

            // then
            expect(webRequest.getResponseCode()).toBe(-1);
        });
    });

    describe('duration', () => {
        it('should return -1 if the webRequest is not stopped', () =>{
            // then
            expect(webRequest.getDuration()).toBe(-1);
        });

        it('should return the duration if the webRequest is stopped', () =>{
            // when
            webRequest.stop();

            // then
            expect(webRequest.getDuration()).toBe(300);
        });
    });

    it('should return the passed url', () => {
        // then
        expect(webRequest.getUrl()).toEqual('https://example.com');
    });

    describe('tag', () => {
       it('should build a valid tag', () => {
           // when
           const tag = webRequest.getTag();

           // then
           expect(tag).toEqual('MT_3_5_123456_98765_1234-65434-86123_70_1_6');
       });
    });
});
