import { worker } from "./browser";

let started = false;

export async function startMswOnce() {
  if (started) return;

  started = true;

  await worker.start({
    onUnhandledRequest: "bypass", // 🔥 VERY IMPORTANT
  });

  console.log("✅ MSW started");
}
