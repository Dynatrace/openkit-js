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
import { ConnectionType } from './ConnectionType';

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
     * If the message is longer than 1000 characters, it is truncated to this value.
     *
     * @param name The name of the error.
     * @param code The error code.
     */
    reportError(name: string, code: number): void;

    /**
     * Report a crash to Dynatrace.
     * If the stacktrace is longer than 128.000 characters, it is truncated according to the last line break.
     * If the message is longer than 1000 characters, it is truncated to this value.
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
     * Send a Business Event
     *
     * With sendBizEvent, you can report a business event. These standalone events are being sent detached
     * from user actions or sessions.
     *
     * Note: The 'dt' key, as well as all 'dt.' prefixed keys are considered reserved by Dynatrace
     * and will be stripped from the passed in attributes.
     *
     * Note: Business events are only supported on Dynatrace SaaS deployments currently.
     *
     * @param type Mandatory event type
     * @param attributes Must be a valid JSON object and cannot contain functions, undefined,
     * Infinity, or NaN as values, otherwise they will be removed. Attributes need to be serializable using JSON.stringify.
     * The resulting event will be populated with the 'attributes'-parameter and enriched with additional properties.
     * Therefore, even empty objects are valid.
     */
    sendBizEvent(type: string, attributes: JSONObject): void;

    /**
     * Reports the network technology in use (e.g. 2G, 3G, 802.11x, offline, ...)
     * Use undefined to clear the value again and it will not be sent.
     *
     * @param technology the used network technology
     */
    reportNetworkTechnology(technology?: string): void;

    /**
     * Reports the type of connection with which the device is connected to the network.
     * Use undefined to clear the value again and it will not be sent.
     *
     * @param connectionType the type of connection
     */
    reportConnectionType(connectionType?: ConnectionType): void;

    /**
     * Reports the name of the cellular network carrier.
     * Use undefined to clear the value again and it will not be sent.
     *
     * <p>
     * The given value will be truncated to 250 characters.
     * </p>
     *
     * @param carrier the cellular network carrier
     */
    reportCarrier(carrier?: string): void;

    /**
     * Ends the session and sends all remaining data.
     */
    end(): void;
}
