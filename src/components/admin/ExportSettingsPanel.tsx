/**
 * ExportSettingsPanel - Admin UI for export formatting settings
 *
 * SSOT: src/constants/exportSettingsConfig.ts
 * Storage: system_settings table, key = 'export_formatting'
 * Location: Admin Panel → "Export Settings" tab
 *
 * Features:
 * - Edit fonts, sizes, spacing, colors, labels
 * - Batch save (edit multiple, save once)
 * - Reset to defaults
 * - Shows count of customized settings
 * - Unsaved changes indicator
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Save,
  RotateCcw,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Palette,
  Type,
  Ruler,
  Tag,
} from "lucide-react";
import { useExportSettings } from "@/hooks/useExportSettings";
import {
  EXPORT_SETTING_CATEGORIES,
  EXPORT_SETTINGS,
  getExportSettingsByCategory,
  type ExportSettingCategory,
  type ExportSetting,
} from "@/constants/exportSettingsConfig";

const CATEGORY_ICONS: Record<ExportSettingCategory, React.ReactNode> = {
  typography: <Type className="h-5 w-5" />,
  spacing: <Ruler className="h-5 w-5" />,
  colors: <Palette className="h-5 w-5" />,
  labels: <Tag className="h-5 w-5" />,
};

export function ExportSettingsPanel() {
  const {
    values,
    loading,
    saving,
    hasChanges,
    customCount,
    defaults,
    updateValue,
    saveSettings,
    resetToDefaults,
    discardChanges,
  } = useExportSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render a single setting input based on its type
  const renderSetting = (setting: ExportSetting) => {
    const value = values[setting.key];
    const isCustomized = value !== defaults[setting.key];

    return (
      <div
        key={setting.key}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b last:border-0"
      >
        <div className="space-y-0.5 flex-1">
          <div className="flex items-center gap-2">
            <Label className="text-base font-medium">{setting.label}</Label>
            {isCustomized && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                Custom
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{setting.description}</p>
        </div>

        <div className="flex items-center gap-2 sm:min-w-[200px] sm:justify-end">
          {setting.type === "number" && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={value}
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  if (!isNaN(num) && num >= setting.min && num <= setting.max) {
                    updateValue(setting.key, num);
                  }
                }}
                min={setting.min}
                max={setting.max}
                step={setting.step}
                className="w-24 text-right"
              />
              <span className="text-sm text-muted-foreground w-6">{setting.unit}</span>
            </div>
          )}

          {setting.type === "select" && (
            <Select
              value={String(value)}
              onValueChange={(v) => updateValue(setting.key, v)}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {setting.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {setting.type === "text" && (
            <Input
              value={String(value)}
              onChange={(e) => updateValue(setting.key, e.target.value)}
              maxLength={setting.maxLength}
              className="w-full sm:w-56"
            />
          )}

          {setting.type === "color" && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={`#${value}`}
                onChange={(e) =>
                  updateValue(setting.key, e.target.value.replace("#", ""))
                }
                className="w-10 h-10 rounded border cursor-pointer"
                style={{ padding: 2 }}
              />
              <Input
                value={String(value).toUpperCase()}
                onChange={(e) => {
                  const hex = e.target.value.replace("#", "").replace(/[^0-9A-Fa-f]/g, "");
                  if (hex.length <= 6) {
                    updateValue(setting.key, hex);
                  }
                }}
                className="w-24 font-mono text-sm"
                maxLength={6}
                placeholder="RRGGBB"
              />
            </div>
          )}

          {/* Reset individual setting to default */}
          {isCustomized && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => updateValue(setting.key, defaults[setting.key])}
              title="Reset to default"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const categories = (
    Object.keys(EXPORT_SETTING_CATEGORIES) as ExportSettingCategory[]
  ).sort(
    (a, b) =>
      EXPORT_SETTING_CATEGORIES[a].order - EXPORT_SETTING_CATEGORIES[b].order
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Export Formatting Settings
                {customCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {customCount} customized
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Adjust fonts, sizes, spacing, and colors for Print, DOCX, and PDF exports
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button variant="outline" size="sm" onClick={discardChanges} disabled={saving}>
                  Discard
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={saving}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all export formatting settings to their original values.
                      You will still need to click "Save Changes" to apply the reset.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={resetToDefaults}>
                      Reset All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={saveSettings}
                disabled={!hasChanges || saving}
                size="sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {hasChanges && (
          <CardContent className="pt-0">
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                You have unsaved changes. Click "Save Changes" to apply them to future exports.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Setting Categories */}
      {categories.map((categoryKey) => {
        const category = EXPORT_SETTING_CATEGORIES[categoryKey];
        const settings = getExportSettingsByCategory(categoryKey);

        return (
          <Card key={categoryKey} className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {CATEGORY_ICONS[categoryKey]}
                {category.label}
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {settings.map((setting) => renderSetting(setting))}
            </CardContent>
          </Card>
        );
      })}

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                Changes apply to all future Print, DOCX, and PDF exports.
                Previously exported documents are not affected.
              </p>
              <p>
                Only customized values are stored. Default values are maintained
                in the codebase as a fallback.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
