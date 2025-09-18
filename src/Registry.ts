import { XJSON } from './XJSON';
import { isDate, isDefined } from './general';

export const Registry = new class {

    readonly #registry = new Map<string, XJSON.ValueDescriptor>();
    #descriptors: XJSON.ValueDescriptor[] = [];
    #tags: string[] = [];

    constructor() {
        this.register({
            tag: 'date',
            is: isDate,
            toString: (date: Date) => String(date.getTime()),
            fromString: (jsonValue: string) => new Date(parseInt(jsonValue)),
            toHumanString: (value: Date) => value.toUTCString()
        });
    }

    get descriptors() {
        return this.#descriptors;
    }

    get tags() {
        return this.#tags;
    }

    register(descriptor: XJSON.ValueDescriptor) {
        this.#registry.set(descriptor.tag, descriptor);
        this.#descriptors =  Array.from(this.#registry.values());
        this.#tags =  Array.from(this.#registry.keys());
    }

    unregister(tag: string) {
        if (this.#registry.delete(tag)) {
            this.#descriptors =  Array.from(this.#registry.values());
            this.#tags =  Array.from(this.#registry.keys());
        }
    }

    get(tag: string) {
        return this.#registry.get(tag);
    }

    isValue(value: any): boolean {
        return isDefined(this.#descriptors.find(descriptor => descriptor.is(value)));
    }

}