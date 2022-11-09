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

'use strict';

function getInputData() {
    const endpointURL = document.getElementById('endpointURL').value; // the endpointURL can be found in the Dynatrace UI
    const applicationID = document.getElementById('applicationID').value; // the application id can be found in the Dynatrace UI
    const deviceID = document.getElementById('deviceID').value || 42; // an ID that uniquely identifies the device
    const targetURL = document.getElementById('targetURL').value; // target URL for example web request

    createMainOpenKit(applicationID, deviceID, endpointURL, targetURL);
}

/**
 * The simpleSample includes a basic example that provides an overview of the features supported by OpenKit.
 * For more detailed information, please refer to the documentation that is available on GitHub.
 *
 * Warning: For simplicity no exception handling is performed in this example!
 */
async function createMainOpenKit(
    applicationID,
    deviceID,
    endpointURL,
    targetURL,
) {
    // create an OpenKit instance
    const openkit = new OpenKitBuilder(endpointURL, applicationID, deviceID)
        .withApplicationVersion('1.0')
        .withOperatingSystem('windows')
        .build();

    document.getElementById('response').innerHTML = 'Wait for result...';

    // we wait for OpenKit to be initialized
    openkit.waitForInit(async function (success) {
        if (success) {
            // create a new session
            const session = openkit.createSession();

            // identify the user
            session.identifyUser('openKitExampleUser');

            // create a root action
            const action = session.enterAction('test okjs');

            // execute a GET request to the given URL and trace request time and size
            await executeAndTraceWebRequest(targetURL, action);

            // wait a bit
            await sleep(1000);

            // report a value representing the desired sleep time
            action.reportValue('sleepTime', 2000);

            // wait again
            await sleep(2000);

            // report an event indicating that we finished sleeping
            action.reportEvent('I have a nightmare! Finished sleeping');

            // leave action
            action.leaveAction();

            // end the session
            session.end();

            // shutdown OpenKit
            openkit.shutdown();
        } else {
            document.getElementById('response').innerHTML =
                "Endpoint URL and Application ID don't match";
        }
    });
}

async function executeAndTraceWebRequest(link, action) {
    document.getElementById('response').innerHTML = '';

    // get the tracer
    const tracer = action.traceWebRequest(link);

    // prepare web request
    const headers = new Headers();
    headers.append('X-dynaTrace', tracer.getTag());
    // Disable CORS for demo purposes. Do not use in production!
    const disabledCorsLink = `https://cors-anywhere.herokuapp.com/${link}`;
    const request = new Request(disabledCorsLink, {
        method: 'GET',
        headers: headers,
    });

    // start timing for web request
    tracer.start();

    // initiate the request
    const response = await fetch(request);

    if (response.ok) {
        document.getElementById('response').innerHTML =
            'Web request was executed successfully';
    } else {
        document.getElementById('response').innerHTML = 'Web request failed';
    }

    // set bytesSent, bytesReceived and response code
    tracer
        .setBytesSent(byteLength(disabledCorsLink)) // fetch API does not expose the request headers
        .setBytesReceived(await approximateResponseBytes(response)) // bytes processed
        .stop(response.status); // stop the tracer
}

/**
 * Estimates the number of bytes of the decompressed response.
 * Note: There can be some restrictions on which headers can be accessed due to CORS, so the calculation might be slightly off.
 * @param response Fetch response
 * @returns {Promise<number>} Approximated size of response in bytes
 */
const approximateResponseBytes = async (response) => {
    let bytesReceived = 0;

    // #1: HTTP Version + Status code + Status message\r\n
    bytesReceived +=
        byteLength(`HTTP/X.Y ${response.status} ${response.statusText}`) + 4;

    // Headers assuming the following format:
    // key: value\r\n
    response.headers.forEach(
        (value, key) => (bytesReceived += byteLength(`${key}: ${value}`) + 4),
    );

    // Empty line separating headers & message
    bytesReceived += 2;

    // The message itself
    const contentLength = response.headers.get('Content-Length');
    if (contentLength !== null && contentLength !== undefined) {
        bytesReceived += contentLength;
    } else {
        const responseBuffer = await response.arrayBuffer();
        bytesReceived += responseBuffer.byteLength;
    }

    return bytesReceived;
};

const textEncoder = new TextEncoder('utf-8');
const byteLength = (str) => textEncoder.encode(str).length;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
