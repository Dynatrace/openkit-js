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

/**
 * Name of Dynatrace HTTP header which is used for tracing web requests.
 */
export const webRequestTagHeader = 'X-dynaTrace';

/**
 * This interface allows tracing and timing of a web request.
 */
export interface WebRequestTracer {
    /**
     * Returns the Dynatrace tag which has to be set manually as Dynatrace HTTP header ({@link webRequestTagHeader}).
     *
     * @see {@link webRequestTagHeader}
     * @return the Dynatrace tag to be set as HTTP header value or an empty String if capture is off
     */
    getTag(): string;

    /**
     * Sets the amount of sent data of this web request. Has to be called before {@link stop}.
     *
     * @param bytesSent number of bytes
     */
    setBytesSent(bytesSent: number): this;

    /**
     * Sets the amount of received data of this web request. Has to be called before {@link stop}.
     *
     * @param bytesReceived number of bytes
     */
    setBytesReceived(bytesReceived: number): this;

    /**
     * Starts the web request timing. Should be called when the web request is initiated.
     */
    start(): this;

    /**
     * Stops the web request timing. Should be called when the web request is finished.
     */
    stop(responseCode: number): void;
}
