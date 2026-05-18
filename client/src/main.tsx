// src/main.tsx
import "./index.css";
import App from "./App";
import { Toaster } from "sonner";
import { StrictMode } from "react";
import { queryClient } from "@/lib/query";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" richColors />
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
