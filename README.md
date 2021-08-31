# bitecs-serializer-test
Demonstration of some issues I've found with bitECS serialization

bitECS 0.3.19-1

## Issues

- Component with `uint16` array field with 1024 elements breaks the serializer
- Piping a query into a serializer doesn't work
- Putting `Changed` in a serializer config throws an error

## How to run

- open index.html
- open dev console

Source code is in `src/index.js`. You can see that only `testVector2Serializer` is executing correctly, all other systems are throwing errors when I believe they should not.

## How to build

- `npm i`
- `npm run build`