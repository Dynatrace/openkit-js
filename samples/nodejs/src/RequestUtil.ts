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
 *
 */

import { Action, Session } from '@dynatrace/openkit-js';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Issues a GET request with X-dynaTrace header and fills tracer with response data.
 * WebRequestTracer will be stopped when finished.
 *
 * @param url URL of service/website
 * @param action Action to create the web request tracer
 * @param session If supplied, it will report network exceptions as crash. Exception are not rethrown.
 */
export const makeGetRequest = async (url: string, action: Action, session?: Session) => {
    let response: AxiosResponse | undefined;

    // get the tracer
    const tracer = action.traceWebRequest(url);

    // add dynatrace tag to headers
    const headers = {'X-dynaTrace': tracer.getTag()};

    // prepare web request
    const requestConfig: AxiosRequestConfig = {headers};

    // start timing for web request
    tracer.start();

    try {
        // initiate the request
        response = await axios.get(url, requestConfig);

        // axios does not expose the request headers, private API has to be used if needed
        const requestHeader = response.request.socket._httpMessage._header;

        // set bytesSent, bytesReceived
        tracer
            .setBytesSent(Buffer.byteLength(requestHeader))        // bytes sent
            .setBytesReceived(approximateResponseBytes(response)); // bytes processed

        // set response code and stop the tracer
        tracer.stop(response.status);
    } catch (e) {
        if (session !== undefined) {
            // Report HTTP issue as crash
            session.reportCrash(`Error while requesting "${url}" (GET)`, e.message, e.stack);
        }

        // set response code and stop the tracer
        tracer.stop(400);
    }
};

/**
 * Estimates the number of bytes of the decompressed response.
 * @param response Axios response
 * @returns number Approximated size of response in bytes
 */
const approximateResponseBytes = (response: AxiosResponse): number => {
    let bytesReceived = 0;

    // #1: HTTP Version + Status code + Status message\r\n
    bytesReceived += Buffer.byteLength(`HTTP/X.Y ${response.status} ${response.statusText}`) + 4;

    // Headers
    bytesReceived += approximateHeaderBytes(response.headers);

    // Empty line separating headers & message
    bytesReceived += 2;

    // The message itself
    const contentLength = response.headers['Content-Length'];
    if (contentLength !== null && contentLength !== undefined) {
        bytesReceived += +contentLength;
    } else {
        bytesReceived += Buffer.byteLength(response.data);
    }

    return bytesReceived;
};

/**
 * Estimates the number of bytes of a header.
 * Note: There can be some restrictions on which headers can be accessed due to CORS, so the calculation might be slightly off.
 * @param headers Object containing a key-value pair per header
 * @returns number Approximated size of headers in bytes
 */
const approximateHeaderBytes = (headers: any): number => {
    let bytes = 0;

    // Headers assuming the following format:
    // key: value\r\n
    for (const headerKey in headers) {
        if (!headers.hasOwnProperty(headerKey)) {
            continue;
        }

        bytes += Buffer.byteLength(`${headerKey}: ${headers[headerKey]}`) + 4;
    }

    return bytes;
};
