/**
 * Admin Panel: Tenant Branding & White Label Configuration
 * 
 * ARCHITECTURE: Imports types, defaults, and utilities from SSOT (tenantConfig.ts)
 * Added to Admin Panel: December 19, 2025
 * Updated: January 8, 2026 - Added beta text editing section
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Palette, Type, ToggleRight, Save, RefreshCw, FlaskConical, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  TenantConfig,
  TenantConfigRow,
  FONT_OPTIONS,
  FEATURE_FLAGS,
  CONTACT_FIELDS,
  BETA_FIELD_GROUPS,
  PRODUCTION_FIELD_GROUPS,
  mapRowToConfig,
  mapConfigToRow,
  validateTenantConfig,
  applyTenantStyles,
  DEFAULT_TENANT_ID,
} from "@/constants/tenantConfig";

export function TenantBrandingPanel() {
  const { toast } = useToast();
  const tenantId = DEFAULT_TENANT_ID;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TenantConfig | null>(null);
  
  // Collapsible state for beta sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    landingPage: false,
    form: false,
    dashboardPrompt: false,
    messages: false,
    validation: false,
  });

  // ---------------------------------------------------------------------------
  // LOAD TENANT CONFIG
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("tenant_config")
        .select("*")
        .eq("tenant_id", tenantId)
        .single();

      if (!alive) return;

      if (error || !data) {
        toast({
          title: "Error Loading Configuration",
          description: "Could not load tenant configuration. Please check the tenant_config table.",
          variant: "destructive",
        });
        setForm(null);
        setLoading(false);
        return;
      }

      const config = mapRowToConfig(data as TenantConfigRow);
      setForm(config);
      setLoading(false);
    }

    load();
    return () => { alive = false; };
  }, [tenantId, toast]);

  // ---------------------------------------------------------------------------
  // UPDATE HANDLERS
  // ---------------------------------------------------------------------------

  function updateBranding<K extends keyof TenantConfig["branding"]>(
    key: K,
    value: TenantConfig["branding"][K]
  ) {
    if (!form) return;
    setForm({
      ...form,
      branding: { ...form.branding, [key]: value },
    });
  }

  function updateUiText<K extends keyof TenantConfig["uiText"]>(
    key: K,
    value: TenantConfig["uiText"][K]
  ) {
    if (!form) return;
    setForm({
      ...form,
      uiText: { ...form.uiText, [key]: value },
    });
  }

  function updateFeature<K extends keyof TenantConfig["features"]>(
    key: K,
    value: TenantConfig["features"][K]
  ) {
    if (!form) return;
    setForm({
      ...form,
      features: { ...form.features, [key]: value },
    });
  }

  // Contact section update handler
  function updateContact<K extends keyof TenantConfig["contact"]>(
    key: K,
    value: string
  ) {
    if (!form) return;
    setForm({
      ...form,
      contact: { ...form.contact, [key]: value },
    });
  }

  // Beta section update handlers
  function updateBetaLandingPage<K extends keyof TenantConfig["beta"]["landingPage"]>(
    key: K,
    value: string
  ) {
    if (!form) return;
    setForm({
      ...form,
      beta: {
        ...form.beta,
        landingPage: { ...form.beta.landingPage, [key]: value },
      },
    });
  }

  function updateBetaForm<K extends keyof TenantConfig["beta"]["form"]>(
    key: K,
    value: string
  ) {
    if (!form) return;
    setForm({
      ...form,
      beta: {
        ...form.beta,
        form: { ...form.beta.form, [key]: value },
      },
    });
  }

  function updateBetaDashboardPrompt<K extends keyof TenantConfig["beta"]["dashboardPrompt"]>(
    key: K,
    value: string
  ) {
    if (!form) return;
    setForm({
      ...form,
      beta: {
        ...form.beta,
        dashboardPrompt: { ...form.beta.dashboardPrompt, [key]: value },
      },
    });
  }

  function updateBetaMessages<K extends keyof TenantConfig["beta"]["messages"]>(
    key: K,
    value: string
  ) {
    if (!form) return;
    setForm({
      ...form,
      beta: {
        ...form.beta,
        messages: { ...form.beta.messages, [key]: value },
      },
    });
  }

  function updateBetaValidation<K extends keyof TenantConfig["beta"]["validation"]>(
    key: K,
    value: string
  ) {
    if (!form) return;
    setForm({
      ...form,
      beta: {
        ...form.beta,
        validation: { ...form.beta.validation, [key]: value },
      },
    });
  }

  // Production section update handler
  function updateProductionLandingPage<K extends keyof TenantConfig["production"]["landingPage"]>(
    key: K,
    value: string
  ) {
    if (!form) return;
    setForm({
      ...form,
      production: {
        ...form.production,
        landingPage: { ...form.production.landingPage, [key]: value },
      },
    });
  }

  function toggleSection(section: string) {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }

  // ---------------------------------------------------------------------------
  // SAVE
  // ---------------------------------------------------------------------------

  async function save() {
    if (!form) return;

    setSaving(true);

    const errors = validateTenantConfig(form);
    if (errors.length > 0) {
      setSaving(false);
      toast({
        title: "Validation Error",
        description: errors.join(". "),
        variant: "destructive",
      });
      return;
    }

    const rowData = mapConfigToRow(form);

    const { error } = await supabase
      .from("tenant_config")
      .update(rowData)
      .eq("tenant_id", tenantId);

    setSaving(false);

    if (error) {
      toast({
        title: "Save Failed",
        description: `You may not be authorized (admin role required). Error: ${error.message}`,
        variant: "destructive",
      });
      return;
    }

    applyTenantStyles(form);

    toast({
      title: "Settings Saved",
      description: "Branding changes saved. Reload the page to see changes everywhere.",
    });
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="p-8 text-center">
          <Palette className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading branding configuration...</p>
        </CardContent>
      </Card>
    );
  }

  if (!form) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Could not load tenant configuration.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                White Label Configuration
              </CardTitle>
              <CardDescription>
                Customize branding, UI text, and features for white-label deployments
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Preview
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Branding Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-4 w-4" />
            Branding
          </CardTitle>
          <CardDescription>Logo, colors, and typography</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={form.branding.name}
                onChange={(e) => updateBranding("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL (optional)</Label>
              <Input
                id="logoUrl"
                value={form.branding.logoUrl ?? ""}
                onChange={(e) => updateBranding("logoUrl", e.target.value || null)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.branding.primaryColor}
                  onChange={(e) => updateBranding("primaryColor", e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  id="primaryColor"
                  value={form.branding.primaryColor}
                  onChange={(e) => updateBranding("primaryColor", e.target.value)}
                  placeholder="#E4572E"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.branding.secondaryColor}
                  onChange={(e) => updateBranding("secondaryColor", e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
                <Input
                  id="secondaryColor"
                  value={form.branding.secondaryColor}
                  onChange={(e) => updateBranding("secondaryColor", e.target.value)}
                  placeholder="#1F2937"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select
                value={form.branding.fontFamily}
                onValueChange={(value) => updateBranding("fontFamily", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Live Preview */}
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-3">Live Preview:</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: form.branding.primaryColor,
                  color: "white",
                  fontFamily: form.branding.fontFamily,
                  cursor: "pointer",
                }}
              >
                {form.uiText.primaryCta || "Primary Button"}
              </button>
              <span style={{ 
                color: form.branding.secondaryColor, 
                fontFamily: form.branding.fontFamily 
              }}>
                Secondary text preview
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UI Text Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type className="h-4 w-4" />
            UI Text
          </CardTitle>
          <CardDescription>Customize application text and messaging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appTitle">App Title</Label>
              <Input
                id="appTitle"
                value={form.uiText.appTitle}
                onChange={(e) => updateUiText("appTitle", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryCta">Primary CTA Text</Label>
              <Input
                id="primaryCta"
                value={form.uiText.primaryCta}
                onChange={(e) => updateUiText("primaryCta", e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={form.uiText.tagline}
                onChange={(e) => updateUiText("tagline", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ToggleRight className="h-4 w-4" />
            Feature Flags
          </CardTitle>
          <CardDescription>Enable or disable features per tenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {FEATURE_FLAGS.map((flag) => (
            <div key={flag.key} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{flag.label}</p>
                <p className="text-sm text-muted-foreground">{flag.description}</p>
              </div>
              <Switch
                checked={form.features[flag.key]}
                onCheckedChange={(checked) => updateFeature(flag.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact & Email Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            {CONTACT_FIELDS.label}
          </CardTitle>
          <CardDescription>{CONTACT_FIELDS.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONTACT_FIELDS.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`contact-${field.key}`}>{field.label}</Label>
              <Input
                id={`contact-${field.key}`}
                value={form.contact[field.key as keyof TenantConfig["contact"]]}
                onChange={(e) => updateContact(field.key as keyof TenantConfig["contact"], e.target.value)}
                placeholder={field.placeholder}
              />
              <p className="text-xs text-muted-foreground">{field.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Beta Program Text Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="h-4 w-4" />
            Beta Program Text
          </CardTitle>
          <CardDescription>
            Customize all text for your beta program. Visibility controlled by Platform Mode in System Settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Landing Page CTA */}
          <Collapsible open={openSections.landingPage} onOpenChange={() => toggleSection("landingPage")}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                <div className="text-left">
                  <p className="font-medium">{BETA_FIELD_GROUPS.landingPage.label}</p>
                  <p className="text-sm text-muted-foreground">{BETA_FIELD_GROUPS.landingPage.description}</p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.landingPage ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {BETA_FIELD_GROUPS.landingPage.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`beta-landing-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`beta-landing-${field.key}`}
                      value={form.beta.landingPage[field.key as keyof typeof form.beta.landingPage] ?? ""}
                      onChange={(e) => updateBetaLandingPage(field.key as keyof TenantConfig["beta"]["landingPage"], e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Enrollment Form */}
          <Collapsible open={openSections.form} onOpenChange={() => toggleSection("form")}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                <div className="text-left">
                  <p className="font-medium">{BETA_FIELD_GROUPS.form.label}</p>
                  <p className="text-sm text-muted-foreground">{BETA_FIELD_GROUPS.form.description}</p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.form ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {BETA_FIELD_GROUPS.form.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`beta-form-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`beta-form-${field.key}`}
                      value={form.beta.form[field.key as keyof typeof form.beta.form] ?? ""}
                      onChange={(e) => updateBetaForm(field.key as keyof TenantConfig["beta"]["form"], e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Dashboard Prompt */}
          <Collapsible open={openSections.dashboardPrompt} onOpenChange={() => toggleSection("dashboardPrompt")}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                <div className="text-left">
                  <p className="font-medium">{BETA_FIELD_GROUPS.dashboardPrompt.label}</p>
                  <p className="text-sm text-muted-foreground">{BETA_FIELD_GROUPS.dashboardPrompt.description}</p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.dashboardPrompt ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {BETA_FIELD_GROUPS.dashboardPrompt.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`beta-dashboard-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`beta-dashboard-${field.key}`}
                      value={form.beta.dashboardPrompt[field.key as keyof typeof form.beta.dashboardPrompt] ?? ""}
                      onChange={(e) => updateBetaDashboardPrompt(field.key as keyof TenantConfig["beta"]["dashboardPrompt"], e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Status Messages */}
          <Collapsible open={openSections.messages} onOpenChange={() => toggleSection("messages")}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                <div className="text-left">
                  <p className="font-medium">{BETA_FIELD_GROUPS.messages.label}</p>
                  <p className="text-sm text-muted-foreground">{BETA_FIELD_GROUPS.messages.description}</p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.messages ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {BETA_FIELD_GROUPS.messages.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`beta-msg-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`beta-msg-${field.key}`}
                      value={form.beta.messages[field.key as keyof typeof form.beta.messages] ?? ""}
                      onChange={(e) => updateBetaMessages(field.key as keyof TenantConfig["beta"]["messages"], e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Validation Messages */}
          <Collapsible open={openSections.validation} onOpenChange={() => toggleSection("validation")}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                <div className="text-left">
                  <p className="font-medium">{BETA_FIELD_GROUPS.validation.label}</p>
                  <p className="text-sm text-muted-foreground">{BETA_FIELD_GROUPS.validation.description}</p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.validation ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {BETA_FIELD_GROUPS.validation.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`beta-val-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`beta-val-${field.key}`}
                      value={form.beta.validation[field.key as keyof typeof form.beta.validation] ?? ""}
                      onChange={(e) => updateBetaValidation(field.key as keyof TenantConfig["beta"]["validation"], e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

        </CardContent>
      </Card>

      {/* Production Mode Text Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Production Mode Text
          </CardTitle>
          <CardDescription>
            Text shown when Platform Mode is set to "production" (not beta). Customize for your launched product.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Landing Page */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div>
              <p className="font-medium">{PRODUCTION_FIELD_GROUPS.landingPage.label}</p>
              <p className="text-sm text-muted-foreground">{PRODUCTION_FIELD_GROUPS.landingPage.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {PRODUCTION_FIELD_GROUPS.landingPage.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`prod-landing-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`prod-landing-${field.key}`}
                    value={form.production.landingPage[field.key as keyof TenantConfig["production"]["landingPage"]]}
                    onChange={(e) => updateProductionLandingPage(field.key as keyof TenantConfig["production"]["landingPage"], e.target.value)}
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Help Text */}
      <p className="text-sm text-muted-foreground text-center">
        If Save fails with "not authorized", sign out and sign back in to refresh your admin token.
      </p>
    </div>
  );
}
