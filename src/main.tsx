import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "quill/dist/quill.snow.css";
import "./styles/quill-custom.css";
async function enableMsw() {
  const { startMswOnce } = await import("./mocks/startMsw.ts");
  await startMswOnce();
}

enableMsw().then(() => {
  // render your app here (ReactDOM.createRoot...)
});

createRoot(document.getElementById("root")!).render(<App />);