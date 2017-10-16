import {createBuffer} from "../index";
import {InvocationOptions} from "../index";
describe('createBuffer', () => {
    const mockArgs = [1, '2', () => 3, Promise.resolve(4)];

    let buffer: {
        calls: Map<string, any[]>;
        root: any;
        invokeFor: (obj: Object, options? : InvocationOptions) => Promise<void>
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

    describe('invokeFor', () => {

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
                contextDep: jasmine.createSpy('context dep').and.callFake(function () {
                    expect(this.context).toBeTruthy();
                })
            };

            buffer.invokeFor(mockApi);

            expect(mockApi.a.b.c).toHaveBeenCalled();
            expect(mockApi.withArgs).toHaveBeenCalledWith(...mockArgs);
            expect(mockApi.contextDep).toHaveBeenCalled();
        });

        describe('invoke options', () => {
           it('should perform all calls in a sync matter', (done) => {
               buffer.root.first();
               buffer.root.second();
               buffer.root.third();
               buffer.root.fourth();

               let count = 0;
               buffer.invokeFor({
                   first: async () => {expect(++count).toBe(1);},
                   second: () => {expect(++count).toBe(2);},
                   third: async () => {expect(++count).toBe(3);},
                   fourth: done
               }, {
                   sync:true
               })
           });

           it('should pass exceptions to the error handler', (done)=> {
               // arrange
               const methodName = 'methodThatThrows';
               const error = 'err';
               buffer.root[methodName](...mockArgs);

               // Act
               buffer.invokeFor({
                   [methodName]: () => {
                       throw error;
                   }
               },
                   {
                       errorHandler: (method, args, e) => {
                           // Assert
                           expect(method.substr(method.lastIndexOf('.') + 1)).toBe(methodName);
                           expect(args).toEqual(mockArgs);
                           expect(e).toBe(error);
                           done();
                       }
                   });
           });
        });
    });
});