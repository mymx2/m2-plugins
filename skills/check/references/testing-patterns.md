# Testing Patterns Reference (JavaScript/TypeScript)

JavaScript/TypeScript testing patterns (Jest, React Testing Library, Supertest, Playwright) illustrating the universal principles from `references/test-checklist.md`. The principles apply in any ecosystem; the syntax shown here is JS/TS-specific.

## Test Structure (Arrange-Act-Assert)

```typescript
it('describes expected behavior', () => {
  // Arrange: set up data and preconditions
  const input = { title: 'Test Task', priority: 'high' }
  // Act: perform the action
  const result = createTask(input)
  // Assert: verify the outcome
  expect(result.title).toBe('Test Task')
})
```

## Test Naming

Pattern: `[unit] [expected behavior] [condition]`.

```typescript
describe('TaskService.createTask', () => {
  it('creates a task with default pending status', () => {})
  it('throws ValidationError when title is empty', () => {})
  it('trims whitespace from title', () => {})
})
```

## Common Assertions

- Equality: `toBe` (strict), `toEqual` (deep), `toStrictEqual` (deep + type).
- Truthiness: `toBeTruthy/Falsy/Null/Defined/Undefined`.
- Numbers: `toBeGreaterThan`, `toBeLessThanOrEqual`, `toBeCloseTo`.
- Strings: `toMatch(/re/)`, `toContain('sub')`.
- Arrays/objects: `toContain`, `toHaveLength`, `toHaveProperty`.
- Errors: `toThrow()`, `toThrow(ErrorType)`, `toThrow('message')`.
- Async: `await expect(fn()).resolves.toBe(...)`, `.rejects.toThrow(...)`.

## Mocking

- **Mock functions:** `jest.fn()`, `.mockReturnValue`, `.mockResolvedValue`, `.mockImplementation`; assert `toHaveBeenCalled/CalledWith/CalledTimes`.
- **Mock modules:** `jest.mock('./database', () => ({ query: jest.fn().mockResolvedValue([...]) }))`, or `...jest.requireActual('./utils')` to keep real exports.
- **Mock at boundaries only:** mock database calls, HTTP requests, file system, external APIs, time. Don't mock internal utilities, business logic, data transformations, validation, or pure functions.

## React/Component Testing

Prefer `@testing-library/react` and query by accessible role/label, not test IDs. Use `findByRole` for async appearance, `fireEvent` for interaction, `waitFor` for async assertions. Test behavior (submission payload, validation errors), not internal state.

## API / Integration Testing

Use `supertest` against the app: assert status codes (201, 422, 401), response body shape with `toMatchObject`, and error body shape. Cover the happy path, validation failure, and auth-missing cases.

## E2E (Playwright)

Query by role/label (`getByRole`, `getByLabel`), follow a real user flow (login -> create -> verify), assert visibility and CSS state. Keep E2E to critical paths.

## Test Anti-Patterns

| Anti-Pattern                   | Better Approach            |
| ------------------------------ | -------------------------- |
| Testing implementation details | Test inputs/outputs        |
| Snapshot everything            | Assert specific values     |
| Shared mutable state           | Setup/teardown per test    |
| Testing third-party code       | Mock the boundary          |
| Skipping tests to pass CI      | Fix or delete the test     |
| `test.skip` permanently        | Remove or fix it           |
| Overly broad assertions        | Be specific                |
| No async error handling        | Always `await` async tests |
