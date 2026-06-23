import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// When admin is on Replit but API is on Render, set VITE_API_DOMAIN=khadma-api-server.onrender.com
const apiDomain = import.meta.env.VITE_API_DOMAIN as string | undefined;
if (apiDomain?.trim()) {
  const host = apiDomain.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  setBaseUrl(`https://${host}`);
}

createRoot(document.getElementById("root")!).render(<App />);
