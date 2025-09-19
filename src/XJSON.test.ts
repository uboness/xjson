import { XJSON } from './XJSON';

declare module './XJSON' {
    // If your Duration class is defined in test code, import its type:
    // import type { Duration } from './duration';
    // Or re-declare a minimal shape if you prefer.

    class Duration {
        ms: number;
    }

    namespace XJSON {
        interface ValueMap {
            duration: Duration;
        }
    }

}

export class Duration {
    constructor(public ms: number) {}

    toString() {
        return `${this.ms}ms`;
    }

    static parse(str: string) {
        const match = /^(\d+)ms$/.exec(str);
        if (match) {
            return new Duration(parseInt(match[1], 10));
        }
        throw new Error('Invalid duration string');
    }
}

// Register Duration with XJSON before tests
beforeAll(() => {
    XJSON.register<Duration>({
        tag: 'duration',
        is: (value: any) => {
            return value instanceof Duration;
        },
        toString: (value) => {
            return value.toString();
        },
        fromString: (jsonValue: string) => {
            return Duration.parse(jsonValue);
        },
        toHumanString: (value) => {
            return `${value.ms} milliseconds`;
        }
    });
});

describe('XJSON', () => {
    it('should handle JSON primitives', () => {
        expect(XJSON.toJSON(42)).toBe(42);
        expect(XJSON.toJSON('foo')).toBe('foo');
        expect(XJSON.toJSON(true)).toBe(true);
        expect(XJSON.toJSON(null)).toBe(null);
    });

    it('should handle objects', () => {
        const obj = { foo: 'bar', n: 123 };
        const json = XJSON.toJSON(obj);
        expect(json).toEqual({ foo: 'bar', n: 123 });

        const parsed = XJSON.fromJSON(json);
        expect(parsed).toEqual(obj);
    });

    it('should handle arrays', () => {
        const arr = [1, 'x', true];
        const json = XJSON.toJSON(arr);
        expect(json).toEqual([1, 'x', true]);

        const parsed = XJSON.fromJSON(json);
        expect(parsed).toEqual(arr);
    });

    it('should handle Date via built-in registry', () => {
        const date = new Date('2020-01-01T00:00:00Z');
        const json = XJSON.toJSON(date);

        expect(typeof json).toBe('string');
        expect(json).toMatch(/^@@date\(\d+\)$/);

        const parsed = XJSON.fromJSON(json);
        expect(parsed instanceof Date).toBe(true);
        expect((parsed as Date).getTime()).toBe(date.getTime());
    });

    it('should handle custom Duration type', () => {
        const duration = new Duration(1500);
        const json = XJSON.toJSON(duration);

        expect(typeof json).toBe('string');
        expect(json).toBe('@@duration(1500ms)');

        const parsed = XJSON.fromJSON(json) as Duration;
        expect(parsed).toBeInstanceOf(Duration);
        expect(parsed.ms).toBe(1500);
    });

    it('should stringify and parse with default style', () => {
        const value = {
            name: 'Alice',
            joined: new Date('2021-06-01T12:00:00Z'),
            duration: new Duration(5000)
        };

        const text = XJSON.stringify(value);
        const parsed = XJSON.parse(text);

        expect(parsed).toMatchObject({
            name: 'Alice',
            duration: expect.any(Duration),
            joined: expect.any(Date)
        });
    });

    it('should stringify with human style', () => {
        const duration = new Duration(2500);
        const text = XJSON.stringify(duration, 'human');

        expect(text).toContain('2500 milliseconds');
    });

    // NEGATIVE TESTS

    it('should throw when parsing unknown tag', () => {
        const badJson = '"@@unknown(123)"';

        expect(() => {
            XJSON.parse(badJson);
        }).toThrow(/Unknown json field type/);
    });

    it('should throw when custom type parser receives invalid string', () => {
        const badValue = '@@duration(bad-string)';

        expect(() => {
            XJSON.fromJSON(badValue);
        }).toThrow('Invalid duration string');
    });
});