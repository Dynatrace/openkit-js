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

import { WebRequestTracer } from './WebRequestTracer';

/**
 * Action public interface
 */
export interface Action {

    /**
     * Report a value with given name to Dynatrace.
     * If the name or value is longer than 250 characters, it is truncated to this value.
     *
     * @param name The name of the reported value.
     * @param value The value to report.
     */
    reportValue(name: string, value: number | string): void;

    /**
     * Report an event with a given name to Dynatrace.
     * If the name is longer than 250 characters, it is truncated to this length.
     *
     * @param name The name of the event
     */
    reportEvent(name: string): void;

    /**
     * Allows tracing and timing of a web request handled by any HTTP Client
     * (e.g. XMLHttpRequest, fetch, 'http'-module, ...).
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
     * Reports an error with a specified name, error code and reason to Dynatrace.
     *
     * @param name The name of the error.
     * @param code The error code.
     * @param message The message (reason) of the error.
     */
    reportError(name: string, code: number, message: string): void;

    /**
     * Leave the action.
     */
    leaveAction(): null;
}
