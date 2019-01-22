/// <reference path="../OpenKitBuilder.ts">

import {Configuration} from "../src/api/Configuration";
import {OpenKitBuilder} from "../src/OpenKitBuilder";

describe('OpenKitBuilder', () => {

    it('should create an object', () => {
        const builder = new OpenKitBuilder("url", "url", 4);

        expect(builder).toBeTruthy();
    });

    it('should return the correct configuration', () => {
        const builder = new OpenKitBuilder('https://example.com', 'appId-1337', 42);

        expect(builder.getConfig()).toEqual(<Configuration>{
            deviceID: 42,
            beaconURL: 'https://example.com',
            applicationID: 'appId-1337'
        });
    })
});
