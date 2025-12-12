import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { 
  SYSTEM_SETTINGS, 
  SETTING_CATEGORIES,
  getSettingsByCategory,
  type SettingKey,
  type SettingCategory
} from '@/constants/systemSettings';

export function SystemSettingsPanel() {
  const { settings, loading, saving, error, updateSetting, refetch } = useSystemSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load settings: {error}</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderSetting = (key: SettingKey) => {
    const setting = SYSTEM_SETTINGS[key];
    const value = settings[key];

    if (setting.type === 'toggle') {
      return (
        <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
          <div className="space-y-0.5">
            <Label htmlFor={key} className="text-base font-medium cursor-pointer">
              {setting.label}
            </Label>
            <p className="text-sm text-muted-foreground">{setting.description}</p>
          </div>
          <Switch
            id={key}
            checked={value as boolean}
            onCheckedChange={(checked) => updateSetting(key, checked)}
            disabled={saving}
          />
        </div>
      );
    }

    if (setting.type === 'select' && 'options' in setting) {
      return (
        <div key={key} className="py-3 border-b last:border-0 space-y-2">
          <div className="space-y-0.5">
            <Label htmlFor={key} className="text-base font-medium">
              {setting.label}
            </Label>
            <p className="text-sm text-muted-foreground">{setting.description}</p>
          </div>
          <Select
            value={value as string}
            onValueChange={(newValue) => updateSetting(key, newValue)}
            disabled={saving}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {setting.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (setting.type === 'text') {
      return (
        <div key={key} className="py-3 border-b last:border-0 space-y-2">
          <div className="space-y-0.5">
            <Label htmlFor={key} className="text-base font-medium">
              {setting.label}
            </Label>
            <p className="text-sm text-muted-foreground">{setting.description}</p>
          </div>
          <Input
            id={key}
            value={value as string}
            onChange={(e) => updateSetting(key, e.target.value)}
            className="w-full sm:w-64"
            disabled={saving}
          />
        </div>
      );
    }

    return null;
  };

  const categories = Object.keys(SETTING_CATEGORIES) as SettingCategory[];

  return (
    <div className="space-y-6">
      {categories
        .sort((a, b) => SETTING_CATEGORIES[a].order - SETTING_CATEGORIES[b].order)
        .map((categoryKey) => {
          const category = SETTING_CATEGORIES[categoryKey];
          const categorySettings = getSettingsByCategory(categoryKey);

          return (
            <Card key={categoryKey} className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {category.label}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {categorySettings.map((setting) => renderSetting(setting.key as SettingKey))}
              </CardContent>
            </Card>
          );
        })}

      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
