import "./config/i18n";
import "./index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import { TenantProvider } from "@/contexts/TenantContext";
import { getTenantConfig } from "@/lib/tenant/getTenantConfig";
import { BrandingProvider } from "@/components/BrandingProvider";

async function bootstrap() {
  const host = window.location.hostname;

  const tenant = await getTenantConfig(host);

  // Legacy: Apply tenant branding as CSS variables (for any code using --tenant-* vars)
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
      {/* 
        BrandingProvider:
        1. Injects base CSS variables from branding.ts (SSOT)
        2. If tenant has custom colors, overrides --primary/--secondary
        3. White-label tenants get their Admin Panel colors applied automatically
      */}
      <BrandingProvider tenantBranding={tenant.branding}>
        <TenantProvider config={tenant}>
          <App />
        </TenantProvider>
      </BrandingProvider>
    </React.StrictMode>
  );
}

bootstrap();
