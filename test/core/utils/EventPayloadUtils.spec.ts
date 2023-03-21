import { isEventContainingNonFiniteNumericValues, isEventPayloadTooBig, isPOJO } from '../../../src/core/utils/EventPayloadUtils';

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

    describe('isEventContainingNonFiniteNumericValues', () => {
        it('Empty Object', () => {
            expect(isEventContainingNonFiniteNumericValues({})).toBe(false);
        });

        it('Sample Object', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: 'Value',
                b: 3,
                c: {
                    d: 4,
                    e: [5, 'Value'],
                    f: {
                        g: 'Value',
                    },
                },
                h: [6],
            })).toBe(false);
        });

        it('Object with NaN', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: NaN,
            })).toBe(true);
        });

        it('Object with Inf', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: Number.POSITIVE_INFINITY,
            })).toBe(true);
        });

        it('Object with -Inf', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: Number.NEGATIVE_INFINITY,
            })).toBe(true);
        });

        it('Object with Array containing NaN', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: [NaN],
            })).toBe(true);
        });

        it('Object with Array containing Inf', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: [Number.POSITIVE_INFINITY],
            })).toBe(true);
        });

        it('Object with Array containing -Inf', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: [Number.NEGATIVE_INFINITY],
            })).toBe(true);
        });

        it('Object with Nested Object containg NaN', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: 'Value',
                b: {
                    c: NaN,
                },
            })).toBe(true);
        });

        it('Object with Nested Object containg Inf', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: 'Value',
                b: {
                    c: Number.POSITIVE_INFINITY,
                },
            })).toBe(true);
        });

        it('Object with Nested Object containg -Inf', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: 'Value',
                b: {
                    c: Number.NEGATIVE_INFINITY,
                },
            })).toBe(true);
        });

        it('Object with Nested Object containg Array with Inf', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: 'Value',
                b: {
                    c: ['Value', Number.POSITIVE_INFINITY],
                },
            })).toBe(true);
        });

        it('Object with Nested Object containg Array with -Inf', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: 'Value',
                b: {
                    c: ['Value', Number.NEGATIVE_INFINITY],
                },
            })).toBe(true);
        });

        it('Object with Nested Object containg Array with NaN', () => {
            expect(isEventContainingNonFiniteNumericValues({
                a: 'Value',
                b: {
                    c: ['Value', NaN],
                },
            })).toBe(true);
        });
    });

    describe('isPOJO', () => {
        it('returns false for array', () => {
            expect(isPOJO([])).toBe(false);
        });

        it('returns false for null', () => {
            expect(isPOJO(null)).toBe(false);
        });

        it('returns false for object like instances', () => {
            expect(isPOJO(new RegExp('regex'))).toBe(false);
            expect(isPOJO(new Array(1))).toBe(false);
        });

        it('returns true for plain objects', () => {
            expect(isPOJO({})).toBe(true);
            expect(isPOJO({ a: 1 })).toBe(true);
        });
    });
});
