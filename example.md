# Dynatrace OpenKit - JavaScript Example

The following document provides an in depth overview, how OpenKit can be used from
developer's point of view. It explains the usage of all the API methods.

## Obtaining an OpenKit Instance

For Dynatrace SaaS and Dynatrace Managed the `DynatraceOpenKitBuilder` is used to build new OpenKit instances. 

```javascript
const applicationId = 'application-id';
const deviceId = 42;
const beaconUrl = 'https://tenantid.beaconurl.com/mbeacon';

const openKit = new OpenKitBuilder(beaconUrl, applicationId, deviceId).build();
```

* The `beaconUrl` denotes the Dynatrace endpoint OpenKit communicates with and 
  is shown when creating the application in Dynatrace. The endpoint URL can be found 
  in the settings page of the custom application in Dynatrace.
* The `applicationId` parameter is the unique identifier of the application in Dynatrace Saas. The
  application's id can be found in the settings page of the custom application in Dynatrace.
* The `deviceId` is a unique identifier, which might be used to uniquely identify a device.

❕ For Dynatrace Managed the endpoint URL looks a bit different.

### Optional Configuration

In addition to the mandatory parameters described above, the builder provides additional methods to further 
customize OpenKit. This includes device specific information like operating system, manufacturer, or model id. 

| Method Name                   | Description                       | Default Value                 |
| ----------------------------- | --------------------------------- | ----------------------------- |
| `withApplicationName`         | sets the application name         | ` ` (empty string)            | 
| `withApplicationVersion`      | sets the application version      |                               |
| `withOperatingSystem`         | sets the operating system name    |                               |
| `withManufacturer`            | sets the manufacturer             |                               |
| `withModelId`                 | sets the model id                 |                               |
| `withUserLanguage`            | sets the user language            |                               |
| `withScreenResolution`        | sets the screen resolution        |                               |
| `withScreenOrientation`       | sets the screen orientation       |                               |
| `withDataCollectionLevel`     | sets the data collection level    | `2` (User Behavior)           |
| `withCrashReportingLevel`     | sets the crash reporting level    | `2` (OptIn)                   |
| `withCommunicationChannel`    | sets the communication channel    | `HttpCommunicationChannel`    |
| `withRandomNumberProvider`    | sets the random number provider   | `DefaultRandomNumberProvider` |
| `withLoggerFactory`           | sets the logger factory           | `ConsoleLoggerFactory`        |
| `withLogLevel`                | sets the log level                | `LogLevel.Info`               |  


❕ Please refer to the the TypeDoc for more information regarding possible configuration values.

## Logging

By default, OpenKit uses a logger implementation that logs to the console. If the default logger is used, the desired
minimum log level can be set by calling `withLogLevel` in the builder, and only messages with the same or higher 
priorities are logged.

A custom logger can be set by calling `withLoggerFactory` in the builder. When a custom logger is used, a call to 
`withLogLevel` has no effect.

## Initializing OpenKit

When obtaining an OpenKit instance from the OpenKit builder the instance starts an automatic 
initialization phase. By default, initialization is performed asynchronously. 

There might be situations when a developer wants to ensure that initialization is completed before proceeding with 
the program logic. For example, short-lived applications where a valid init and shutdown cannot be guaranteed. In
such a case `waitForInit` can be used.

```javascript
openKit.waitForInit((initializedSuccessfully) => {
    
});
```

❕ Please refer to the TypeDoc for additional information.

The callback value indicates whether the OpenKit instance has been initialized successfully or `shutdown` 
has been called meanwhile.

An optional parameter exists to wait a given amount of time for OpenKit to initialize as shown in the
following example.
```javascript
// wait 10 seconds for OpenKit to complete initialization
const timeoutInMilliseconds = 10 * 1000;
openKit.waitForInit(() => {
    
}, timeoutInMilliseconds);
```

To verify if OpenKit has been initialized, use the `isInitialized` method as shown in the example below.
```javascript
const isInitialized = openKit.isInitialized();
if (isInitialized) {
    console.log("OpenKit is initialized");
} else {
    console.log("OpenKit is not yet initialized");
}
```

## Creating a Session

After setting application version and device information, which is not mandatory, but might be useful,
a `Session` can be created by invoking the `createSession` method.
The `createSession` method takes an optional argument, which might be a valid IPv4 or IPv6 address.
If no argument is passed, the IP which communicates with the server is assigned.

The example shows how to create sessions.
```javascript
const clientIpAddress = '12.34.56.78';

// create a session and pass an IP address
const sessionWithArgument = openKit.createSession(clientIpAddress);

// create a session and let the IP be assigned on the server side
const sessionWithoutArgument = openKit.createSession();
```

## Identify User

Users can be identified by calling `identifyUser` on a `Session` instance. This enables you to search and 
filter specific user sessions and analyze individual user behavior over time in the backend.

```javascript
session.identifyUser('jane.doe@example.com');
```

## Finishing a Session

When a `Session` is no longer needed, it should be ended by invoking the `end` method.  
Although all open sessions are automatically ended when OpenKit is shut down (see "Terminating the OpenKit instance")
it's highly recommended to end sessions which are no longer in use manually.

```javascript
session.end();
```

## Reporting a Crash

Unexpected application crashes can be reported via a `Session` by invoking the `reportCrash` method.  
The example below shows how an exception might be reported.
```javascript
const error = new Error('Some error');

session.reportCrash(e.name, e.message, e.stack);
```

## Starting a Action

As mentioned in the [README](#./README.md) actions are named events, where a `Action` represents the 
first hierarchy level. An `Action` is created from a `Session` as shown in the example below.
```javascript
const rootActionName = 'actionName';
const action = session.enterAction(rootActionName);
```

## Leaving Actions

To leave an `Action` simply use the `leave` method. The method returns the parent action or `null`
if it has no parent.

```javascript
action.leaveAction();
```

## Report Named Event

To report a named event use the `reportEvent` method on `Action`.
```javascript
const eventName = 'eventName';
action.reportEvent(eventName);
```

## Report Key-Value Pairs

Key-value pairs can also be reported via an `Action` as shown in the example below.
Overloaded methods exist for the following value types:
* number
* string
```javascript
// first report a numeric value
const keyNumberName = 'My reported numeric value';
const numericValue = 42;
action.reportValue(keyNumberName, numericValue);

// and also a string value
const keyStringName = 'My reported string value';
const stringValue = 'The quick brown fox jumps over the lazy dog';
action.reportValue(keyStringName, stringValue);
```

## Report an Error

An `Action` also has the possibility to report an error with a given 
name, code and a reason. The code fragment below shows how.
```javascript
const errorName = 'Unknown error';
const errorCode = 42; 
const reason = 'Not sure what\'s going on here';

action.reportError(errorName, errorCode, reason);
```

## Tracing Web Requests

One of the most powerful OpenKit features is web request tracing. When the application starts a web
request (e.g. HTTP GET) a special tag can be attached to the header. This special header allows
Dynatrace SaaS/Dynatrace Managed to correlate actions with a server side PurePath, however, 
the developer is responsible for adding the appropriate header field to the request.  
The field name can be obtained from the exported value `webRequestTagHeader` and the field's value is obtained
from the `getTag` method (see interface `WebRequestTracer`).

An example is shown below.
```javascript
const url = 'http://www.my-backend.com/api/v3/users';

// create the WebRequestTracer
const webRequestTracer = action.traceWebRequest(url);

const headerName = webRequestTagHeader; // webRequestTagHeader can be imported
const headerValue = webRequestTracer.getTag();

webRequestTracer.start();

// perform the request here & do not forget to add the HTTP header

// the following code has to be executed after the request finished
webRequestTracer.setBytesSent(12345);       // optional, 12345 bytes sent
webRequestTracer.setBytesReceived(67890);   // optional, 67890 received
webRequestTracer.stop(200);                 // stop the web request tracer, with the optional response code
```

## Terminating the OpenKit Instance

When an OpenKit instance is no longer needed (e.g. the application using OpenKit is shut down), the previously
obtained instance can be cleared by invoking the `shutdown` method.
