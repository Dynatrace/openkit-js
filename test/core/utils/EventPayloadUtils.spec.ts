import { isEventPayloadTooBig } from '../../../src/core/utils/EventPayloadUtils';

describe('EventPayloadUtils', () => {
    describe('isEventPayloadTooBig', () => {
        it('should return false when payload is small enough', () => {
            const payloadStr = '{}';

            expect(isEventPayloadTooBig(payloadStr)).toEqual(false);
        });

        it('should return true when payload is too big', () => {
            const jsonObject: { [key: string]: string } = {};

            for (let i = 0; i < 1000; i++) {
                jsonObject['Test' + i] =
                    'This is a Test String, so the payload is big enough';
            }

            expect(isEventPayloadTooBig(JSON.stringify(jsonObject))).toEqual(
                true,
            );
        });
    });
});
