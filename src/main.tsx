
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  const path = window.location.pathname;

  // solo permitir admin si la URL es /admin
  const allowAdmin = path === "/admin";

  createRoot(document.getElementById("root")!).render(
    <App allowAdmin={allowAdmin} />
  );