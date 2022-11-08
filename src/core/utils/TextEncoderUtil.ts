import { TextEncoder } from 'util';

export const lengthInUtf8Bytes = (str: string): number =>
    new TextEncoder().encode(str).length;
