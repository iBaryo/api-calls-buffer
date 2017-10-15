# Api Calls Buffer
When your api object takes a few ticks to initialize, use this package to buffer its usage then play it on the real one!

* Supported in ES2015 and above.

## Installation
```
npm i api-calls-buffer --save
```

## Usage
```typescript
import {createBuffer} from "api-calls-buffer";

// Lets say I want to expose an api object
//   but it takes some ticks to initialize

// So I can create a buffer (
const buffer = createBuffer<any>();

// And expose its root as my dynamic api object
const api = buffer.root;

// Now I can access whatever method i desire with any parameter
api.whatever.method.i.desire(1, '2', () => 3, Promise.resolve(4));

// And when finally my real api resolves...
Promise.resolve({
    realApi: true,
    whatever: {
        method: {
            i: {
                desire: (...args) => console.log(`real api called!`, args)
            }
        }
    }
})
    .then(realApi => {
        // I can invoke all the buffered calls to it:
        buffer.invokeFor(realApi); // real api called! [ 1, '2', [Function], Promise { 4 } ]
    });
```

## Running the example
After cloning, run:
```
npm i & npm start
```

For running the tests:
```
npm test
```