declare global {
  interface Window {
    __mswStarted?: boolean;
  }
}

export default async function startMswOnce() {
  if (import.meta.env.MODE !== "development") return;

  if (window.__mswStarted) return;
  window.__mswStarted = true;

  const mod = await import("./browser");

  // ✅ Support both named and default exports (handles mismatch safely)
  const worker = (mod as any).worker ?? (mod as any).default;

  if (!worker) {
    console.error(
      "[MSW] worker export not found from ./browser. Module keys:",
      Object.keys(mod),
      mod
    );
    return;
  }

 await worker.start({
    onUnhandledRequest(req: any, print: any) {
      const url = new URL(req.url);

      if (
        url.pathname.startsWith("/@") ||
        url.pathname.startsWith("/src/") ||
        url.pathname.startsWith("/node_modules/") ||
        url.pathname.startsWith("/favicon") ||
        url.pathname.includes("vite")
      ) {
        return;
      }

      // keep warnings for unhandled API calls (optional)
      print.warning();
    }
  });
}
