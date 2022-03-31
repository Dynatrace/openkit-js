/**
 * Replacement for send timestamp. This will be replaced in the payload when data gets sent.
 */
export const SEND_TIMESTAMP_PLACEHOLDER: string =
    'DT_SEND_TIMESTAMP_PLACEHOLDER';

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
