export type Optional<T> = T | undefined;
export type Defined<T = any> = T extends undefined ? never : T;
export type Nil = null | undefined;
export type ArrayItem<A> = A extends readonly (infer T)[] ? T : never

export const isNil = (value: any): value is Nil => value === null || value === undefined;
export const isDefined = (value: any): value is Defined  => value !== undefined;
export const isString = (value: any): value is string => !isNil(value) && typeOf(value) === 'string';
export const isBoolean = (value: any): value is boolean => !isNil(value) && typeOf(value) === 'boolean';
export const isNumber = (value: any): value is number => !isNil(value) && typeOf(value) === 'number';
export const isDate = (value: any): value is Date => !isNil(value) && typeOf(value) === 'Date';
export const isError = (value: any): value is Error => !isNil(value) && value instanceof Error;
export const isArray = (value: any): value is any[] => !isNil(value) && Array.isArray(value);
export const isObject = (value: any): value is {
    [key: string | number | symbol]: any
} => !isNil(value) && typeOf(value) === 'Object';


const OBJECT_TYPE_REGEX = () => /\[object (.+)]/;
const typeOf = value => {
    if (Array.isArray(value)) {
        return 'array';
    }
    if (value === null) {
        return 'null';
    }
    const type = typeof value;
    switch (type) {
        case 'object':
            const desc = Object.prototype.toString.call(value);
            const result = OBJECT_TYPE_REGEX().exec(desc);
            // @ts-ignore
            return result[1];
        default:
            return type;
    }
};