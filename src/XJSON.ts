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

const VALUE_REGEXP =  /@@([a-zA-Z]+)\((.*)\)$/;

export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONArray = JSONValue[];
export type JSONObject = { [key: string]: JSONValue };
export type JSONPrimitive = string | number | boolean | null;
export const isJSONPrimitive = (value: any): value is JSONPrimitive => value === null || isString(value) || isBoolean(value) || isNumber(value);

export type ToXJSON<T> = (item: T) => XJSON.Value;
export type FromXJSON<T> = (json: XJSON.Value) => T;

export class XJSON {

    static readonly EmptyObject = Object.freeze({});
    static readonly isEmpty = <T extends XJSON.Object = XJSON.Object>(v: T): boolean => {
        return v === XJSON.EmptyObject || Object.keys(v).length === 0;
    }

    static readonly register = <T = any>(descriptor: XJSON.ValueDescriptor<T>) => Registry.register<T>(descriptor);
    static readonly unregister = (tag: string) => Registry.unregister(tag);
    static readonly descriptors = () => Registry.descriptors;

    static readonly toJSON = (value?: XJSON.Value): Optional<JSONValue> => {
        if (value === undefined) {
            return undefined;
        }
        if (isJSArray(value)) {
            return XJSON.toJSONArray(value);
        }
        for (const descriptor of Registry.descriptors) {
            if (descriptor.is(value)) {
                return `@@${descriptor.tag}(${descriptor.toString(value)})`
            }
        }
        if (XJSON.isObject(value)) {
            return XJSON.toJSONObject(value);
        }
        return value as JSONValue;
    }

    static readonly toJSONArray = (array?: XJSON.Value[]): Optional<JSONArray> => {
        if (array == undefined) {
            return undefined;
        }
        return array.map(item => XJSON.toJSON(item));
    }

    static readonly toJSONObject = (obj?: XJSON.Object): Optional<JSONObject> => {
        if (obj === undefined) {
            return undefined;
        }
        return Object.keys(obj).reduce((result, key) => {
            result[key] = XJSON.toJSON(obj[key]);
            return result;
        }, {} as JSONObject);
    }

    static readonly fromJSON = (value?: JSONValue): XJSON.Value | undefined => {
        if (value == undefined) {
            return undefined;
        }
        if (isJSArray(value)) {
            return XJSON.fromJSONArray(value);
        }
        if (isJSObject(value)) {
            return XJSON.fromJSONObject(value);
        }
        if (isString(value)) {
            const match = value.match(VALUE_REGEXP);
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

    static readonly fromJSONArray = (array?: JSONArray): Optional<XJSON.Array> => {
        if (array === undefined) {
            return undefined;
        }
        return array.map(item => XJSON.fromJSON(item));
    }

    static readonly fromJSONObject = (obj?: JSONObject): Optional<XJSON.Object> => {
        if (obj == undefined) {
            return undefined;
        }
        return Object.keys(obj).reduce((result, key) => {
            result[key] = XJSON.fromJSON(obj[key]);
            return result;
        }, {} as XJSON.Object);
    }

    static readonly stringify = (value?: XJSON.Value, style: XJSON.StringifyStyle = 'default', tabSize?: number) => {
        const replacer = style === 'human' ? humanReplacer : defaultReplacer;
        const space = isDefined(tabSize) ? tabSize : style === 'default' ? 0 : 2;
        return JSON.stringify(value, replacer, space);
    };

    static readonly parse = <T extends XJSON.Value = XJSON.Value>(text: string): T => {
        return JSON.parse(text, jsonReviver);
    };

    static readonly isPrimitive = (value: any): value is XJSON.Primitive => isJSONPrimitive(value) || Registry.isValue(value);
    static readonly isObject = (value: any): value is XJSON.Object => isJSObject(value) && !XJSON.isPrimitive(value);

}

export namespace XJSON {

    // This is the base that you guarantee
    export type BaseDescriptor<T = any> = {
        tag: string;
        is: (value: any) => value is T;
        toString: (value: T) => string;
        fromString: (jsonValue: string) => T;
        toHumanString: (value: T) => string;
    }

    // Extension hook: consumers can augment this interface
    export interface ValueDescriptorExtension<T = any> {}

    // Final descriptor type = base + extension
    export type ValueDescriptor<T = any> = BaseDescriptor<T> & ValueDescriptorExtension<T>;

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

    export type Value = XJSON.Primitive | XJSON.Object | XJSON.Array | undefined;
    export type Primitive = JSONPrimitive | Date | ValueMap[keyof ValueMap]
    export type Object = { [key: string]: Value };
    export type Array = Value[];

    export type StringifyStyle = 'default' | 'human';

}

const defaultReplacer = jsonReplacer(false);
const humanReplacer = jsonReplacer(true);

function jsonReplacer(human: boolean) {
    return function replacer(this: any, key: string) {
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
    if (!isString(value)) {
        return value;
    }
    const match = value.match(VALUE_REGEXP);
    if (match) {
        const [ _, tag, stringValue ] = match;
        const descriptor = Registry.get(tag);
        if (!descriptor) {
            throw new Error(`Failed to parse JSON value [${value}]. Unknown json field type [@@${tag}] (can only match @@${Registry.tags.join('|')})`);
        }
        return descriptor.fromString(stringValue);
    }
    return value;
}
