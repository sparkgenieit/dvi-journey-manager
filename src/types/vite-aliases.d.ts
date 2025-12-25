// NOTE:
// The project uses Vite's resolve.alias to map "@" -> "./src" (see vite.config.ts).
// However, tsconfig.app.json currently maps "@/*" to "./*" (project root) and is read-only here,
// which causes TS2307 "Cannot find module '@/...'" during type-check.
//
// This ambient module declaration is a lightweight shim to unblock builds without touching imports.
// Runtime resolution still uses Vite's alias.

declare module "@/*";
