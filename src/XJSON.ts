import {
    Optional,
    isArray as isJSArray,
    isBoolean,
    isDefined,
    isNumber,
    isObject as isJSObject,
    isString,
} from './general';
import { Registry } from './Registry';

export type JSON = JSONPrimitive | JSONObject | JSONArray;
export type JSONPrimitive = string | number | boolean | null;
export type JSONArray = JSON[];
export type JSONObject = { [key: string]: JSON };

export type XJSON = XJSON.Primitive | XJSON.Object | XJSON.Array | undefined;

export type ToXJSON<T> = (item: T) => XJSON;
export type FromXJSON<T> = (json: XJSON) => T;

export namespace XJSON {

    export type ValueDescriptor<T = any> = {
        tag: string,
        is: (value: any) => value is T,
        toString: (value: T) => string,
        fromString: (jsonValue: string) => T,
        toHumanString: (value: T) => string
    }

    // This is an extension mechanism for libraries to use to extend the
    // XJSONValue type. To do so, they'll just need to extend this definition
    // for example:
    //
    //      import { XJSONValueMap } from "xjson";
    //
    //      declare module "@uboness/xjson" {
    //          interface XJSONValueMap {
    //              duration: Duration;
    //          }
    //      }
    //
    // The above will effectively extend XJSONValue to also include the Duration type
    export interface ValueMap {
        date: Date;
    }


    export type Value = ValueMap[keyof ValueMap];
    export type Primitive = JSONPrimitive | Date | Value
    export type Object = { [key: string]: XJSON };
    export type Array = XJSON[];

    export namespace XJSONObject {
        export const EMPTY: Object = {} as const;
        export const isEmpty = <T extends Object = Object>(value: T): boolean => value === EMPTY;
    }

    export const register = (descriptor: ValueDescriptor) => Registry.register(descriptor);
    export const unregister = (tag: string) => Registry.unregister(tag);

    export const toJSON = (value?: XJSON): Optional<JSON> => {
        if (value === undefined) {
            return undefined;
        }
        if (isJSArray(value)) {
            return toJSONArray(value);
        }
        for (const descriptor of Registry.descriptors) {
            if (descriptor.is(value)) {
                return `@@${descriptor.tag}(${descriptor.toString(value)})`
            }
        }
        if (isObject(value)) {
            return toJSONObject(value);
        }
        return value as JSON;
    }

    export const toJSONArray = (array?: XJSON[]): Optional<JSONArray> => {
        if (array == undefined) {
            return undefined;
        }
        return array.map(item => toJSON(item));
    }

    export const toJSONObject = (obj?: Object): Optional<JSONObject> => {
        if (obj === undefined) {
            return undefined;
        }
        return Object.keys(obj).reduce((result, key) => {
            result[key] = toJSON(obj[key]);
            return result;
        }, {} as JSONObject);
    }

    export const fromJSON = (value?: JSON): XJSON | undefined => {
        if (value == undefined) {
            return undefined;
        }
        if (isJSArray(value)) {
            return fromJSONArray(value);
        }
        if (isObject(value)) {
            return fromJSONObject(value);
        }
        if (isString(value)) {
            const match = value.match(/@@([a-zA-Z]+)\((.*)\)/);
            if (match) {
                const [ _, tag, stringValue ] = match;
                const descriptor = Registry.get(tag);
                if (!descriptor) {
                    throw new Error(`Failed to parse JSON value [${value}]. Unknown json field type [@@${match[1]}] (can only match @@${Registry.tags.join('|')})`);
                }
                return descriptor.fromString(stringValue);
            }
        }
        return value;
    }

    export const fromJSONArray = (array?: JSONArray): Optional<Array> => {
        if (array === undefined) {
            return undefined;
        }
        return array.map(item => fromJSON(item));
    }

    export const fromJSONObject = (obj?: JSONObject): Optional<Object> => {
        if (obj == undefined) {
            return undefined;
        }
        return Object.keys(obj).reduce((result, key) => {
            result[key] = fromJSON(obj[key]);
            return result;
        }, {} as Object);
    }

    export type StringifyStyle = 'default' | 'human';

    export const stringify = (value?: XJSON, style: StringifyStyle = 'default', tabSize?: number) => {
        const replacer = style === 'human' ? humanReplacer : defaultReplacer;
        const space = isDefined(tabSize) ? tabSize : style === 'default' ? 0 : 2;
        return JSON.stringify(value, replacer, space);
    };

    export const parse = <T extends XJSON = XJSON>(text: string): T => {
        return JSON.parse(text, jsonReviver);
    };

    export const isJSONPrimitive = (value: any): value is JSONPrimitive => value === null || isString(value) || isBoolean(value) || isNumber(value);
    export const isPrimitive = (value: any): value is Primitive => isJSONPrimitive(value) || Registry.isValue(value);
    const isObject = (value: any): value is Object => isJSObject(value) && !isPrimitive(value);

}

const defaultReplacer = jsonReplacer(false);
const humanReplacer = jsonReplacer(true);

function jsonReplacer(human: boolean) {
    return function (this: any, key: string) {
        const value = this[key];
        for (const descriptor of Registry.descriptors) {
            if (descriptor.is(value)) {
                return human ? descriptor.toHumanString(value) : `@@${descriptor.tag}(${descriptor.toString(value)})`;
            }
        }
        if (isJSObject(value)) {
            if (value.toJSON) {
                return value.toJSON();
            }
        }
        return value;
    };
}

function jsonReviver(key: string, value: any) {
    if (isString(value)) {
        const match = value.match(/@@([a-zA-Z]+)\((.*)\)/);
        if (match) {
            const [ _, tag, value ] = match;
            const descriptor = Registry.get(tag);
            if (!descriptor) {
                throw new Error(`Failed to parse JSON value [${value}]. Unknown json field type [@@${match[1]}] (can only match @@${Registry.tags.join('|')})`);
            }
            return descriptor.fromString(value);
        }
    }
    return value;
}
