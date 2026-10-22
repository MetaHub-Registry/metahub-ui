# Agent Instructions

## Build and Test

```sh
npm ci
npm run build          # tsc -b && vite build
npm run lint           # eslint .
npm run test           # vitest run
npm run test:coverage
```

A change is complete when `npm run build`, `npm run lint` and `npm run test`
pass.
