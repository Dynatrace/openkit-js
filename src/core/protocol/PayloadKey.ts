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

export const enum PayloadKey {
    ProtocolVersion = 'vv',
    OpenKitVersion = 'va',
    ApplicationId = 'ap',
    ApplicationName = 'an',
    ApplicationVersion = 'vn',
    PlatformType = 'pt',
    AgentTechnologyType = 'tt',
    VisitorId = 'vi',
    SessionNumber = 'sn',
    ClientIpAddress = 'ip',
    Multiplicity = 'mp',
    DataCollectionLevel = 'dl',
    CrashReportingLevel = 'cl',

    // Additional metadata
    DeviceOs = 'os',
    DeviceManufacturer = 'mf',
    DeviceModel = 'md',
    ScreenWidth = 'sw',
    ScreenHeight = 'sh',
    UserLanguage = 'ul',
    Orientation = 'so',

    // timestamp constants
    SessionStartTime = 'tv',
    TransmissionTime = 'tx',

    // Action related
    EventType = 'et',
    KeyName = 'na',
    ThreadId = 'it',
    ActionId = 'ca',
    ParentActionId = 'pa',
    StartSequenceNumber = 's0',
    Time0 = 't0',
    EndSequenceNumber = 's1',
    Time1 = 't1',

    // Error & Crash
    Reason = 'rs',
    ErrorValue = 'ev',
    Stacktrace = 'st',

    // Report Values
    Value = 'vl',

    // Web request
    ResponseCode = 'rc',
    BytesSent = 'bs',
    BytesReceived = 'br',

}
