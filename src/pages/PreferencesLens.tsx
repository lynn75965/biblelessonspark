import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { getTheologyProfilesSorted } from '@/constants/theologyProfiles';

export default function PreferencesLens() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get all 10 theology profiles from SSOT
  const theologyProfiles = getTheologyProfilesSorted();

  useEffect(() => {
    loadCurrentPreference();
  }, [user]);

  async function loadCurrentPreference() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('theology_profile_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data?.theology_profile_id) {
        setSelected(data.theology_profile_id);
      }
    } catch (error) {
      console.error('Error loading preference:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user || !selected) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theology_profile_id: selected })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Theological lens saved successfully');
      navigate('/setup');
    } catch (error) {
      console.error('Error saving preference:', error);
      toast.error('Failed to save preference');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <BookOpen className="h-8 w-8 animate-pulse text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-primary">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">Choose Your Theological Lens</CardTitle>
            <CardDescription className="text-lg">
              Select your preferred Baptist theological perspective for lesson enhancement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {theologyProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelected(profile.id)}
                className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                  selected === profile.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    selected === profile.id
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}>
                    {selected === profile.id && (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">{profile.summary}</p>
                  </div>
                </div>
              </button>
            ))}

            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                onClick={() => navigate('/setup')}
                className="flex-1"
              >
                Back to Setup
              </Button>
              <Button
                onClick={handleSave}
                disabled={!selected || saving}
                className="flex-1 bg-gradient-primary"
              >
                {saving ? 'Saving...' : 'Save & Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
