---
name: assertion-functions
description: Assertion functions that validate and narrow types by throwing on invalid input
---

# Assertion Functions

## Overview

Assertion functions validate a condition and narrow the type for subsequent code. If the condition fails, they throw — there is no `false` branch. This makes the happy path clean and linear compared to `if`/`else` with type predicates.

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`Expected string, got ${typeof value}`);
  }
}

function processInput(input: unknown) {
  assertIsString(input);
  // input is string from here onward
  console.log(input.toUpperCase());
}
```

## Syntax rule: `function` declaration required

Assertion functions **must** use the `function` keyword. Arrow functions do not work:

```typescript
// WRONG — arrow functions don't support asserts
const assertString = (value: unknown): asserts value is string => {
  if (typeof value !== "string") throw new Error("Not a string");
};
// Error: Assertions require every name in the call target to be
// declared with an explicit type annotation.

// CORRECT — function declaration
function assertString(value: unknown): asserts value is string {
  if (typeof value !== "string") throw new Error("Not a string");
}
```

## Asserting object shapes

```typescript
interface User {
  id: string;
  name: string;
}

function assertIsUser(value: unknown): asserts value is User {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    !("name" in value)
  ) {
    throw new Error("Invalid user object");
  }
}

function handleData(data: unknown) {
  assertIsUser(data);
  // data is User here
  console.log(data.name);
}
```

## Asserting non-null

```typescript
function assertDefined<T>(value: T | null | undefined, label?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${label ?? "value"} to be defined`);
  }
}

const el = document.getElementById("app");
assertDefined(el, "app element");
// el is HTMLElement here
```

## Combining with opaque/brand types

Assertion functions pair naturally with [opaque types](opaque-types.md) to validate **and** brand in one step:

```typescript
type Opaque<TValue, TBrand> = TValue & { __brand: TBrand };
type ValidEmail = Opaque<string, "ValidEmail">;

function assertValidEmail(email: string): asserts email is ValidEmail {
  if (!email.includes("@") || !email.includes(".")) {
    throw new Error("Invalid email format");
  }
}

// Usage
function createUser(input: { email: string }) {
  assertValidEmail(input.email);
  // input.email is ValidEmail from here
  saveUser({ email: input.email });
}
```

## Type predicates vs assertion functions

| Aspect | Type predicate (`is`) | Assertion function (`asserts`) |
|---|---|---|
| Return type | `boolean` | `void` (throws on failure) |
| Usage pattern | `if (isX(v)) { … }` | `assertX(v); // continue` |
| Error handling | Caller decides | Function throws |
| Syntax | Arrow or `function` | **Must** be `function` |

```typescript
// Type predicate — caller handles the false branch
if (!isValidEmail(email)) {
  return { error: "Invalid email" };
}
sendEmail(email);

// Assertion function — cleaner when throwing is acceptable
assertValidEmail(email);
sendEmail(email);
```

**Rule of thumb:** Use type predicates when the caller needs to handle failure gracefully. Use assertion functions when invalid input is an error that should throw.

## Complete example: validated registration

```typescript
type Opaque<TValue, TBrand> = TValue & { __brand: TBrand };
type ValidEmail = Opaque<string, "ValidEmail">;
type ValidPassword = Opaque<string, "ValidPassword">;

function assertValidEmail(email: string): asserts email is ValidEmail {
  if (!email.includes("@") || email.length < 5) {
    throw new Error("Invalid email format");
  }
}

function assertValidPassword(pw: string): asserts pw is ValidPassword {
  if (pw.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
}

async function handleRegistration(input: { email: string; password: string }) {
  assertValidEmail(input.email);
  assertValidPassword(input.password);

  // Both are branded — downstream functions require branded types
  return createUser({ email: input.email, password: input.password });
}
```

## See also

- [type-narrowing.md](type-narrowing.md) — Type predicates and control-flow narrowing
- [opaque-types.md](opaque-types.md) — Brand types that assertion functions can produce
