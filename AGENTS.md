# React Coding Guidelines

## React

- Use React 19.
- Do not add `useMemo` or `useCallback` unless explicitly required.
- Use `use(Context)` instead of `useContext(Context)` when appropriate.
- Prefer named exports. Avoid default exports.

## Components

- Keep component props minimal.
- Prefer shared/global state over prop drilling.
- Design components to be composable.
- Split large or deeply nested components into smaller components.
- Keep files focused. Do not collect unrelated helpers, components, and logic in one file.
- Do not extract trivial logic into functions unnecessarily.
- Avoid unnecessary prop drilling. Import it or transport it to the component that needs it instead.

## Utilities

- Extract reusable non-UI logic into utility functions.
- Prefer utilities over passing reusable logic through component props.
- Prefer named exports.
- If a function needs many arguments, use one options object:

```ts
doSomething({ userId, amount, currency });
```

instead of:

```ts
doSomething(userId, amount, currency);
```

## Third-Party Libraries

- Prefer the library's documented API directly.
- Do not create unnecessary abstractions or wrappers around third-party libraries.
- Do not reimplement functionality already provided by the library.

## General

- Prefer the simplest implementation that satisfies the requirement.
- Avoid premature abstraction and unnecessary indirection.
- Optimize for readability, composability, and small focused files.
