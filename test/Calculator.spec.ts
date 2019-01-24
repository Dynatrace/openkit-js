import {anyNumber, instance, mock, when} from 'ts-mockito';

class Calculator {
    public add(a: number, b: number): number {
        return a + b;
    }
}

describe('Calculator', () => {
    it('should add correctly two numbers', () => {
        const calc = new Calculator();

        expect(calc.add(1, 5)).toBe(6);
    });

    it('should work with ts-mockito', () => {
        const addMock = mock(Calculator);
        when(addMock.add(anyNumber(), anyNumber())).thenReturn(12);

        const calc = instance(addMock);

        expect(calc.add(5, 6)).toBe(12);
    });
});
