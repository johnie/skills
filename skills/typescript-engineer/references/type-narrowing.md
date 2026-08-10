---
name: type-narrowing
description: Narrowing types through control flow analysis
---

# Type Narrowing

## Contents

- [Built-in Narrowing](#built-in-narrowing)
- [Discriminated Unions](#discriminated-unions)
- [Custom Type Guards](#custom-type-guards)
- [Narrowing with Opaque Types](#narrowing-with-opaque-types)
- [Array Filtering with Type Guards](#array-filtering-with-type-guards)
- [Control Flow Analysis Limitations](#control-flow-analysis-limitations)
- [Practical Example: API Response Handling](#practical-example-api-response-handling)
- [When to Use Each Technique](#when-to-use-each-technique)
- [Common Pitfalls](#common-pitfalls)
- [See also](#see-also)

## Overview

Type narrowing is TypeScript's ability to refine types based on control flow analysis. When you check a type condition, TypeScript narrows the type within that code block.

## Built-in Narrowing

### `typeof` Guards

```typescript
function processValue(value: string | number) {
  if (typeof value === "string") {
    // value is string here
    return value.toUpperCase();
  }
  // value is number here
  return value.toFixed(2);
}
```

### `instanceof` Guards

```typescript
function logError(error: Error | string) {
  if (error instanceof Error) {
    // error is Error here
    console.log(error.stack);
  } else {
    // error is string here
    console.log(error);
  }
}
```

### Truthiness Narrowing

```typescript
function printName(name: string | null | undefined) {
  if (name) {
    // name is string here (truthy)
    console.log(name.toUpperCase());
  }
}
```

### Equality Narrowing

```typescript
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // Both are string here (only common type)
    console.log(x.toUpperCase());
    console.log(y.toUpperCase());
  }
}
```

### `in` Operator

```typescript
interface Fish {
  swim: () => void;
}

interface Bird {
  fly: () => void;
}

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    // animal is Fish here
    animal.swim();
  } else {
    // animal is Bird here
    animal.fly();
  }
}
```

## Discriminated Unions

Use a common property to discriminate between types:

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // shape is Circle here
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // shape is Rectangle here
      return shape.width * shape.height;
    case "triangle":
      // shape is Triangle here
      return (shape.base * shape.height) / 2;
  }
}
```

### Exhaustiveness Checking

Use `never` to ensure all cases are handled:

```typescript
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // If a new shape is added, this will error
      const _exhaustiveCheck: never = shape;
      throw new Error(`Unhandled shape: ${_exhaustiveCheck}`);
  }
}
```

## Custom Type Guards

### Inferred Type Predicates (TS 5.5+)

Since TypeScript 5.5 you usually should not write `value is Type` by hand. When a function has no explicit return type and returns a boolean expression that narrows one of its parameters, the compiler infers the predicate:

```typescript
// No annotation needed — TS infers `value is string`
function isString(value: unknown) {
  return typeof value === "string";
}

// The change that matters most in practice: inline callbacks now narrow
const values = [1, null, 2, undefined, 3];
const numbers = values.filter((v) => v !== null && v !== undefined);
// numbers: number[]   (before 5.5: (number | null | undefined)[])
```

Write an explicit predicate only when inference can't apply. It does not fire when:

- the function has an explicit return type — annotating `: boolean` opts out
- the parameter is reassigned anywhere in the body
- the narrowing isn't derivable from a single returned expression, e.g. several `return` statements each narrowing differently
- you need to assert a *different* type than control flow proves — most importantly a brand, where nothing in the body establishes it

That last point is why the branded validator further down still needs `email is ValidEmail`: no amount of `includes("@")` tells the compiler about a nominal brand.

An explicit predicate is an unchecked assertion — the compiler takes your word for it. When you write one, prove it with a type test (see [type-testing.md](type-testing.md)); a wrong predicate silently lies for the life of the codebase.

### Type Predicates

Functions that return `value is Type`:

```typescript
interface Fish {
  swim: () => void;
}

interface Bird {
  fly: () => void;
}

function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

function move(pet: Fish | Bird) {
  if (isFish(pet)) {
    // pet is Fish here
    pet.swim();
  } else {
    // pet is Bird here
    pet.fly();
  }
}
```

### Generic Type Guards

```typescript
function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

const values = [1, null, 2, undefined, 3];
const filtered = values.filter(isNotNull);
// filtered is number[]
```

On TS 5.5+ an inline `values.filter((v) => v != null)` narrows on its own, so this helper is about naming and reuse across call sites, not about unlocking the narrowing. Keep it if the predicate is shared; drop it if it's used once.

### Object Property Check

```typescript
function hasProperty<T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

const data: unknown = { name: "Alice" };

if (typeof data === "object" && data !== null && hasProperty(data, "name")) {
  // data.name is now accessible
  console.log(data.name);
}
```

## Narrowing with Opaque Types

Combine type predicates with opaque types for validated data:

```typescript
type ValidEmail = string & { __brand: "ValidEmail" };

function isValidEmail(email: string): email is ValidEmail {
  return email.includes("@") && email.includes(".");
}

function sendEmail(email: ValidEmail) {
  // We know email has been validated
}

function handleSubmit(email: string) {
  if (!isValidEmail(email)) {
    throw new Error("Invalid email");
  }
  // email is ValidEmail here
  sendEmail(email);
}
```

## Array Filtering with Type Guards

```typescript
type Item = { type: "a"; value: string } | { type: "b"; count: number };

const items: Item[] = [
  { type: "a", value: "hello" },
  { type: "b", count: 42 },
];

// Filter to specific type
const typeAItems = items.filter(
  (item): item is { type: "a"; value: string } => item.type === "a"
);
// typeAItems is { type: "a"; value: string }[]
```

## Control Flow Analysis Limitations

TypeScript can't always track narrowing across function calls:

```typescript
function isString(x: unknown): x is string {
  return typeof x === "string";
}

function example(value: string | number) {
  const isStr = isString(value);

  if (isStr) {
    // value is still string | number here!
    // TypeScript doesn't narrow based on boolean variables
  }

  // Must check inline
  if (isString(value)) {
    // value is string here
  }
}
```

## Practical Example: API Response Handling

```typescript
interface SuccessResponse<T> {
  status: "success";
  data: T;
}

interface ErrorResponse {
  status: "error";
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

function isSuccess<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.status === "success";
}

async function fetchUser(): Promise<ApiResponse<User>> {
  // ...
}

async function handleUser() {
  const response = await fetchUser();

  if (isSuccess(response)) {
    // response.data is User
    console.log(response.data.name);
  } else {
    // response.error is accessible
    console.error(response.error.message);
  }
}
```

## When to Use Each Technique

| Technique | Use Case |
|-----------|----------|
| `typeof` | Primitive type checks |
| `instanceof` | Class instance checks |
| `in` operator | Property existence checks |
| Discriminated unions | Multiple related types with common discriminant |
| Type predicates | Custom narrowing logic |
| Assertion functions | Validation with early error throwing — see [assertion-functions.md](assertion-functions.md) |

## Common Pitfalls

### Narrowing Doesn't Persist Across Callbacks

```typescript
function example(value: string | null) {
  if (value !== null) {
    // value is string here

    setTimeout(() => {
      // value is string | null again!
      // TypeScript is conservative about callbacks
    }, 0);
  }
}
```

### Type Guards Must Return Boolean

```typescript
// Wrong - doesn't narrow
function isFish(pet: Fish | Bird) {
  return "swim" in pet; // Just returns boolean
}

// Correct - narrows the type
function isFish(pet: Fish | Bird): pet is Fish {
  return "swim" in pet;
}
```

### Be Careful with Complex Conditions

```typescript
function example(value: { a?: string; b?: number }) {
  // This doesn't narrow as expected
  if (value.a || value.b) {
    // Neither a nor b is guaranteed to exist
  }

  // Use specific checks
  if (value.a !== undefined) {
    // value.a is string here
  }
}
```

## See also

- [assertion-functions.md](assertion-functions.md) — Assertion functions that throw on invalid input and narrow the type
