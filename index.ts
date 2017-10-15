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
        root: new Proxy({__getKey: () => 'root'}, dynHandler) as T,
        invokeFor: (obj: Object) => {
            for (const k of calls.keys()) {
                const lastProperty = k.lastIndexOf('.');
                const ctxStr = k.substr(0, lastProperty);
                const ctxGetter = new Function(rootName, `return ${ctxStr}`);
                const ctx = ctxGetter(obj);
                const fnName = k.substr(lastProperty + 1);
                ctx[fnName].apply(ctx, calls.get(k));
            }
        }
    };
}