---
name: check
description: Run all checks and fix issues until clean
---

Run typechecking and linting using the exact scripts from package.json, then fix all errors and warnings until the codebase is clean.

## Steps

1. Run `npm run build` to perform typechecking and build validation with Next.js and Turbopack
2. Run `npm run lint` to check for ESLint issues
3. Analyze and fix all errors found in the build output
4. Analyze and fix all warnings found in the linting output
5. Re-run both `npm run build` and `npm run lint` to verify all issues are resolved
6. Repeat steps 3-5 until both commands complete without any errors or warnings

Continue iterating until the codebase passes all checks cleanly.
