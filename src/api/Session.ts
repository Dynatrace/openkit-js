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

import { Action } from './Action';
import { WebRequestTracer } from './WebRequestTracer';
import { JSONObject } from './Json';

/**
 * Session public interface
 */
export interface Session {
    /**
     * Enter a new rootAction
     */
    enterAction(actionName: string): Action;

    /**
     * Identify a user
     *
     * @param userTag The tag to identify the user.
     */
    identifyUser(userTag: string): void;

    /**
     * Reports an error with a specified name, error code and reason to Dynatrace.
     *
     * @param name The name of the error.
     * @param code The error code.
     * @param message The message (reason) of the error.
     */
    reportError(name: string, code: number, message: string): void;

    /**
     * Report a crash to Dynatrace.
     *
     * @param name The name of the crash.
     * @param message Why the crash occurred.
     * @param stacktrace The stacktrace of the crash.
     */
    reportCrash(name: string, message: string, stacktrace: string): void;

    /**
     * Allows tracing and timing of a web request handled by any HTTP Client
     * (e.g. XmlHttpRequest, fetch, 'http'-module, ...).
     * In this case the Dynatrace HTTP header ({@link webRequestTagHeader}) has to be set manually to the tag value of this
     * WebRequestTracer. <br>
     * If the web request is continued on a server-side Agent (e.g. Java, .NET, ...) this Session will be correlated to
     * the resulting server-side PurePath.
     *
     * @see {@link webRequestTagHeader}
     * @param url the URL of the web request to be tagged and timed
     * @return a WebRequestTracer which allows getting the tag value and adding timing information
     */
    traceWebRequest(url: string): WebRequestTracer;

    /**
     * Sending an event with JSON payload
     *
     * @param name Name of the event
     * @param attributes Payload of the event
     */
    // sendEvent(name: string, attributes: JSONObject): void;

    /**
     * Reports a BIZ event with a mandatory type and additional attributes
     *
     * @param type Type of the BIZ event which is mandatory
     * @param attributes Additional attributes which are passed along side our internal attributes
     */
    sendBizEvent(type: string, attributes: JSONObject): void;

    /**
     * Ends the session and sends all remaining data.
     */
    end(): void;
}
