export function createBuffer<T>(rootName = 'root') {
    const calls = new Map<string, any[]>();

    const dynHandler = {
        get: (target, prop) => {
            if (!target[prop]) {
                const mock = Object.assign(
                    (...args) => calls.set(mock.__getKey(), args),
                    {
                        __getKey: () => `${target.__getKey()}.${prop}`
                    }
                );

                target[prop] = new Proxy(mock, dynHandler);
            }

            return target[prop];
        }
    };

    return {
        calls,
        root: new Proxy({__getKey: () => rootName}, dynHandler) as T,
        invokeFor: async (obj: Object, options : InvocationOptions = {}) => {
            for (const k of calls.keys()) {
                const lastProperty = k.lastIndexOf('.');
                const ctxStr = k.substr(0, lastProperty);
                const ctxGetter = new Function(rootName, `return ${ctxStr}`);
                const ctx = ctxGetter(obj);
                const fnName = k.substr(lastProperty + 1);

                try {
                    const res = ctx[fnName].apply(ctx, calls.get(k));
                    if (options.sync && res instanceof Promise) await res;
                }
                catch (e) {
                    if (!options.errorHandler) {
                        throw e;
                    }
                    else {
                        options.errorHandler(k, calls.get(k), e);
                    }
                }
            }
        }
    };
}

export interface InvocationOptions {
    sync? : boolean;
    errorHandler? : (callName : string, args : any[], e : any) => void;
}