
import {instance, mock, when} from 'ts-mockito';
import {OpenKitBuilder} from '../src/OpenKitBuilder';

describe('OpenKitBuilder', () => {

    it('should create an object', () => {
        const builder = new OpenKitBuilder('url', 'url', 4);

        expect(builder).toBeTruthy();
    });

    it('should return the correct configuration', () => {
        const builder = new OpenKitBuilder('https://example.com', 'appId-1337', 42);

        expect(builder.getConfig()).toEqual({
            deviceID: 42,
            beaconURL: 'https://example.com',
            applicationID: 'appId-1337',
        });
    });

    it('should work with ts-mockito', () => {
        // given
        const builderMock = mock(OpenKitBuilder);
        when(builderMock.getConfig()).thenReturn({applicationID: 'some-app-id', beaconURL: 'https://example.com', deviceID: 42});
        const builderInstance = instance(builderMock);

        // when, then
        expect(builderInstance.getConfig()).toEqual({applicationID: 'some-app-id', beaconURL: 'https://example.com', deviceID: 42});
    });
});
