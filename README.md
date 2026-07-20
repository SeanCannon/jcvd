# JCVD
### Javascript Can Validate Data

![GitHub Logo](/jcvd.png)

Runtime type validation with descriptive error paths. Compose predicates from libraries like [check-types](https://www.npmjs.com/package/check-types) or [prettycats](https://www.npmjs.com/package/prettycats), or write your own.

```js
const {
  isObjectOf,
  isArrayOf,
  isOptional,
  isRequired
} = require('jcvd');

const isString = isRequired(n => typeof n === 'string');
const isNumber = isRequired(n => typeof n === 'number');

const isAddress = isPartialObjectOf({
  street      : isString,
  houseNumber : isNumber
});

const isMyType = isPartialObjectOf({
  foo       : isOptional(isString),
  bar       : isNumber,
  arr       : isArrayOf(isNumber),
  addresses : isOptional(isArrayOf(isAddress))
});

isMyType({
  foo       : 'derp',
  bar       : 3,
  arr       : [3, 3],
  addresses : [
    {
      street      : 'penny lane',
      houseNumber : '13' // <- should be a number
    }
  ]
});

// Throws: 'addresses [0] houseNumber invalid'
```

# Interface

- [Schema Validators](#schema-validators)
- [Predicate Modifiers](#predicate-modifiers)
- [Utilities](#utilities)
- [Custom Errors](#custom-errors)

## Schema Validators

### isObjectOf
`Schema → Object → Boolean | throws`

Creates a **strict** validator — rejects objects containing keys not defined in the schema.

```
const isAddress = isObjectOf({
  street : isRequired(v => typeof v === 'string'),
  number : isRequired(v => typeof v === 'number')
});

isAddress({ street : 'penny lane', number : 13 }); // true
isAddress({ street : 'penny lane' });               // throws 'number -> missing'
isAddress({ street : 'penny lane', number : 13, foo : 'bar' }); // throws 'foo -> unsupported'
isAddress(undefined);                                // throws 'missing'
isAddress('foo');                                    // throws 'invalid'
```

---

### isPartialObjectOf
`Schema → Object → Boolean | throws`

Creates a **lenient** validator — allows extra keys not defined in the schema.

```
const isAddress = isPartialObjectOf({
  street : isRequired(v => typeof v === 'string')
});

isAddress({ street : 'penny lane', number : 13 }); // true (extra keys OK)
isAddress(undefined);                                // throws 'missing'
isAddress([]);                                       // throws 'invalid'
isAddress(123);                                      // throws 'invalid'
```

---

### isArrayOf
`Predicate → Array → Boolean | throws`

Validates every element in an array against a predicate. Returns the index of the failing element in the error path.

```
const isNumbers = isArrayOf(v => typeof v === 'number');

isNumbers([1, 2, 3]);       // true
isNumbers([1, 'two', 3]);   // throws '[1] invalid'
isNumbers(undefined);        // throws 'missing'
isNumbers('foo');            // throws 'invalid'
```

## Predicate Modifiers

### isRequired
`Predicate → Value → Boolean | throws`

Wraps a predicate to reject `null` and `undefined` before delegating.

```
const isString = isRequired(v => typeof v === 'string');

isString('hello'); // true
isString(123);     // false
isString(null);    // throws 'missing'
isString(undefined); // throws 'missing'
```

---

### isOptional
`Predicate → Value → Boolean`

Wraps a predicate to accept `null` and `undefined` without delegating.

```
const isString = v => typeof v === 'string';
const maybeString = isOptional(isString);

maybeString('hello'); // true
maybeString(null);    // true (skips predicate)
maybeString(undefined); // true (skips predicate)
maybeString(123);     // false
```

## Utilities

### label
`String → Predicate → Value → Value | throws`

Prefixes error messages with a label. Allows nesting validators without losing context. Returns the original value when validation passes (useful for tap flow).

```
const isAddress = isPartialObjectOf({
  street : isRequired(v => typeof v === 'string'),
  number : isRequired(v => typeof v === 'number')
});

const checkAddress = label('home', isAddress);

checkAddress({ street : 'penny lane', number : 13 }); // returns the object
checkAddress({ street : 'penny lane' });               // throws 'home -> number -> missing'

// Tap-flow example
const value = { street : 'penny lane', number : 13 };
const validated = label('home', isAddress)(value); // validated === value
```

## Custom Errors

### customErrors
`Handlers → { isObjectOf, isPartialObjectOf, isArrayOf, isRequired, isOptional, label }`

Creates a new set of validators with custom error handlers. Each handler must be a function that returns an `Error`.

```
const {
  isObjectOf,
  isArrayOf,
  isRequired
} = customErrors({
  handleInvalid     : () => new Error('nope'),
  handleMissing     : () => new Error('missing'),
  handleUnsupported : () => new Error('forbidden')
});

const isString = isRequired(v => typeof v === 'string');

const isCar = isObjectOf({
  wheels : isArrayOf(isString)
});

isCar({ wheels : ['left', 3] });
// throws 'wheels [1] nope'

isCar({ wheels : ['left'], extra : 'key' });
// throws 'extra -> forbidden'
```

---

# CHANGELOG
 - 1.0.0 - initial commit
 - 1.0.1 - fork from nested-validate with the latest improvements
 - 1.0.2 - update tests
 - 1.0.3 - return true for passing isArrayOf
 - 1.0.4 - update readme
 - 1.0.5 - make isOptional consider both null and undefined as missing
 - 1.1.0 - label now returns value instead of true for tap flow
 - 1.1.1 - clean code semantics
 - 1.1.2 - change map to forEach in getOwnPropertyNames
 - 1.1.3 - update readme
 - 1.1.4 - make isRequired consider both null and undefined as missing
 - 2.0.0 - port to TypeScript
