import "./config/i18n";
import "./index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import { TenantProvider } from "@/contexts/TenantContext";
import { getTenantConfig } from "@/lib/tenant/getTenantConfig";

async function bootstrap() {
  const host = window.location.hostname;

  const tenant = await getTenantConfig(host);

  // Apply tenant branding as CSS variables
  const rootEl = document.documentElement;
  rootEl.style.setProperty("--tenant-primary", tenant.branding.primaryColor);
  rootEl.style.setProperty("--tenant-secondary", tenant.branding.secondaryColor);
  rootEl.style.setProperty("--tenant-font", tenant.branding.fontFamily);

  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Root container #root not found");
  }

  createRoot(container).render(
    <React.StrictMode>
      <TenantProvider config={tenant}>
        <App />
      </TenantProvider>
    </React.StrictMode>
  );
}

bootstrap();
