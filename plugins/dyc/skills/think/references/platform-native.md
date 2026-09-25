# Platform-Native Solutions

Before reaching for a package, scan here. The platform ships with your app for free, doesn't break on updates, and was written by people whose job is exactly that problem.

## Principle

Every layer of your stack — HTML, CSS, browser JS APIs, Node/Python/Swift stdlib, the database — ships replacements for the most-installed packages: pickers, dialogs, accordions, sticky headers, debounce, UUIDs, date/number formatting, deep clone, query strings, observers, pagination, window functions, constraints. A current model already knows these; the failure mode is not ignorance but **forgetting to check before adding a dependency**.

So the rule is procedural, not encyclopedic: before proposing any library, name the platform or stdlib call that covers the need, and justify the dependency only when the native option genuinely falls short (old browser targets, edge cases, ergonomics at scale).

例：`structuredClone` / `URLSearchParams` / `<dialog>` / `Intl.*` / `crypto.randomUUID` / CSS `clamp()` / `:has()` / SQL window functions / `CHECK` constraints 已覆盖常见需求；写代码前先查平台能力再引依赖。

## When the Library Earns Its Place

When the native solution is genuinely insufficient (old browser support, edge cases it doesn't handle, ergonomics that matter at scale), the library earns its place. Install it then, not before — and say in the plan which native option was rejected and why.
