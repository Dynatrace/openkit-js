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

import { LogLevel, OpenKitBuilder, Session } from '@dynatrace/openkit-js';
import { makeGetRequest } from './RequestUtil';

executeSimpleApp();

async function executeSimpleApp(): Promise<void> {
    const endpointURL: string = '';   // the endpointURL can be found in the Dynatrace UI
    const applicationID: string = ''; // the application id can be found in the Dynatrace UI
    const deviceID: number = 42;      // an ID that uniquely identifies the device

    // create an OpenKit instance
    const openkit = new OpenKitBuilder(endpointURL, applicationID, deviceID)
        .withApplicationName('SimpleApp')
        .withApplicationVersion('1.0')
        .withOperatingSystem(process.platform)
        .withLogLevel(LogLevel.Debug)
        .build();

    // create a new session
    const session: Session = openkit.createSession();

    // identify the user
    session.identifyUser('openKitExampleUser');

    // create a root action
    const action = session.enterAction('test okjs');

    // execute a GET request to the given URL and trace request time and size
    await makeGetRequest('https://www.dynatrace.com', action, session);

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

}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
