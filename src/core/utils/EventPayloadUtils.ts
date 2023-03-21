import { JSONArray, JSONObject, JSONValue } from '../../api';

/**
 * Maxium payload size for sending an event
 */
export const EVENT_MAX_PAYLOAD = 16 * 1024;

/**
 * Calculate the size of the string in bytes and returns if it is to
 * big for the event payload
 *
 * @param str string which should be used for event payload
 * @returns true if the payload is too big
 */
export const isEventPayloadTooBig = (str: string): boolean => {
    let s = str.length;

    for (let i = str.length - 1; i >= 0; i--) {
        const code = str.charCodeAt(i);

        if (code > 0x7f && code <= 0x7ff) {
            s++;
        } else if (code > 0x7ff && code <= 0xffff) {
            s += 2;
        }

        if (code >= 0xdc00 && code <= 0xdfff) {
            i--; // trail surrogate
        }
    }

    return s > EVENT_MAX_PAYLOAD;
};

/**
 * Goes through the attributes which are sent with the event and returns true
 * if NaN, -Inf or Inf is used.
 *
 * @param attributes Attributes sent via an event
 * @returns True if attributes contain NaN, -Inf or Inf
 */
export const isEventContainingNonFiniteNumericValues = (attributes: JSONObject): boolean => {
    for (const key in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
            if(isElementNonFiniteNumericValue(attributes[key])){
                return true;
            }
        }
    }

    return false;
};

/**
 * @param obj Argument to be checked
 * @returns   True if passed in obj argument is a plain javascript object
 */
export const isPOJO = (obj: unknown): obj is JSONObject => {
    if (obj === null || typeof obj !== 'object') {
        return false;
    }

    return Object.getPrototypeOf(obj) === Object.prototype;
};


/**
 * Goes through the JSON array and returns true if NaN, -Inf or Inf is used.
 *
 * @param array JSONArray which should be checked
 * @returns True if array contain NaN, -Inf or Inf
 */
const isArrayContainingNonFiniteNumericValues = (array: JSONArray): boolean => {
    for (const item of array) {
        if (isElementNonFiniteNumericValue(item)) {
            return true;
        }
    }

    return false;
};

/**
 * Checks a JSONValue if NaN, -Inf or Inf is used.
 *
 * @param item JSONValue which should be checked
 * @returns True if item is/contains NaN, -Inf or Inf
 */
const isElementNonFiniteNumericValue = (item: JSONValue): boolean =>
    (isPOJO(item) && isEventContainingNonFiniteNumericValues(item))
    || (Array.isArray(item) && isArrayContainingNonFiniteNumericValues(item))
    || (typeof item === 'number' && !isFinite(item));
