import {createBuffer} from "../index";
describe('createBuffer', () => {
    const mockArgs = [1, '2', () => 3, Promise.resolve(4)];

    let buffer : {
        calls: Map<string, any[]>;
        root: any;
        invokeFor: (obj: Object) => void;
    };

    beforeEach(() => {
        buffer = createBuffer<any>();
    });

    function getDeepProp(bufferRoot, limit = 500) {
        let dynObj = bufferRoot;
        for (let i = 1; i <= limit; i++) {
            dynObj = dynObj[`a${i}`];
        }
        return dynObj;
    }

    it('should generate properties as requested', () => {
        expect(getDeepProp(buffer.root)).toBeDefined();
    });
    it('should return an invokable function at the end', () => {
        expect(typeof getDeepProp(buffer.root)).toBe('function');
    });
    it('should register the call for an invoked function', () => {
        getDeepProp(buffer.root)(...mockArgs);
        expect(buffer.calls.size).toBe(1);
        expect(Array.from(buffer.calls.values())[0]).toEqual(mockArgs);
    });
    it('should invoke calls for real object', () => {
        buffer.root.a.b.c();
        buffer.root.withArgs(...mockArgs);
        buffer.root.contextDep();

        const mockApi = {
            a: {
                b: {
                    c: jasmine.createSpy('deep')
                }
            },
            withArgs: jasmine.createSpy('with args'),
            context: true,
            contextDep: jasmine.createSpy('context dep').and.callFake(function() {
                expect(this.context).toBeTruthy();
            })
        };

        buffer.invokeFor(mockApi);

        expect(mockApi.a.b.c).toHaveBeenCalled();
        expect(mockApi.withArgs).toHaveBeenCalledWith(...mockArgs);
        expect(mockApi.contextDep).toHaveBeenCalled();
    });
});