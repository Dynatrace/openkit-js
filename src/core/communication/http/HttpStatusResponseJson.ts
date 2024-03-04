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

import { CaptureMode } from '../../../api';
import { HttpStatusResponseBase } from './HttpStatusResponseBase';
import { StatusResponseJson, Status } from './StatusResponseJson';

const checkNumber = (num: number, defaultValue: number): number =>
    num >= 0 ? num : defaultValue;

const checkNumberWithMaxValue = (
    num: number,
    defaultValue: number,
    maxValue: number,
): number => {
    const value = checkNumber(num, defaultValue);
    return Math.min(value, maxValue);
};

/**
 * Class which is checking the json response and is sanitizing
 * the values if they are wrong.
 */
export class HttpStatusResponseJson extends HttpStatusResponseBase {
    public applicationId: string | undefined;
    public timestamp: number | undefined;

    protected parsePayload(payload: string): void {
        if (payload.startsWith('type=m')) {
            this.valid = false;
            this.logger.debug('Invalid response type');

            return;
        }

        try {
            const jsonResponse: StatusResponseJson = JSON.parse(payload);

            if (
                typeof jsonResponse !== 'object' ||
                Array.isArray(jsonResponse)
            ) {
                this.valid = false;
                this.logger.debug('Invalid JSON - Not an object!');
            }

            if (jsonResponse.dynamicConfig !== undefined) {
                if (
                    jsonResponse.dynamicConfig.status !== undefined &&
                    jsonResponse.dynamicConfig.status === Status.Error
                ) {
                    this.valid = false;
                    return;
                }

                if (jsonResponse.dynamicConfig.multiplicity !== undefined) {
                    this.multiplicity = checkNumber(
                        jsonResponse.dynamicConfig.multiplicity,
                        0,
                    );
                }

                if (jsonResponse.dynamicConfig.serverId !== undefined) {
                    this.serverId = checkNumber(
                        jsonResponse.dynamicConfig.serverId,
                        1,
                    );
                }
            }

            if (jsonResponse.mobileAgentConfig !== undefined) {
                if (
                    jsonResponse.mobileAgentConfig.maxBeaconSizeKb !== undefined
                ) {
                    this.maxBeaconSizeInKb = checkNumber(
                        jsonResponse.mobileAgentConfig.maxBeaconSizeKb,
                        0,
                    );
                }
            }

            if (jsonResponse.appConfig !== undefined) {
                if (jsonResponse.appConfig.applicationId !== undefined) {
                    this.applicationId = jsonResponse.appConfig.applicationId;
                }

                if (jsonResponse.appConfig.capture !== undefined) {
                    this.captureMode =
                        jsonResponse.appConfig.capture === 1
                            ? CaptureMode.On
                            : CaptureMode.Off;
                }

                if (jsonResponse.appConfig.reportCrashes !== undefined) {
                    this.captureCrashes =
                        jsonResponse.appConfig.reportCrashes === 1
                            ? CaptureMode.On
                            : CaptureMode.Off;
                }

                if (jsonResponse.appConfig.reportErrors !== undefined) {
                    this.captureErrors =
                        jsonResponse.appConfig.reportErrors === 1
                            ? CaptureMode.On
                            : CaptureMode.Off;
                }

                if (
                    jsonResponse.appConfig.trafficControlPercentage !==
                    undefined
                ) {
                    this.trafficControlPercentage = checkNumberWithMaxValue(
                        jsonResponse.appConfig.trafficControlPercentage,
                        100,
                        100,
                    );
                }
            }

            if (jsonResponse.timestamp !== undefined) {
                this.timestamp = checkNumber(jsonResponse.timestamp, 0);
            }
        } catch (error) {
            this.valid = false;
            this.logger.debug('Invalid JSON - Parsing failed!');
        }
    }
}
