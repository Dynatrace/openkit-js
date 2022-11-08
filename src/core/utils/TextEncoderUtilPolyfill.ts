declare const window: any;
declare const globalThis: any;

export const lengthInUtf8Bytes = (str: string): number => {
    if (
        typeof globalThis === 'object' &&
        globalThis !== null &&
        typeof globalThis.TextEncoder === 'function'
    ) {
        return new globalThis.TextEncoder().encode(str).length;
    } else if (
        typeof window === 'object' &&
        window !== null &&
        typeof window.TextEncoder === 'function'
    ) {
        return new window.TextEncoder().encode(str).length;
    } else {
        // returns the byte length of an utf8 string
        let s = str.length;
        for (let i = str.length - 1; i >= 0; i--) {
            const code = str.charCodeAt(i);
            if (code > 0x7f && code <= 0x7ff) {
                s++;
            } else if (code > 0x7ff && code <= 0xffff) {
                s += 2;
            }

            if (code >= 0xdc00 && code <= 0xdfff) {
                i--;
            }
        }

        return s;
    }
};
