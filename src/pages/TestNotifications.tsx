import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';

export default function TestNotifications() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const seedNotifications = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to seed notifications',
          variant: 'destructive',
        });
        return;
      }

      const response = await supabase.functions.invoke('seed-test-notifications', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: 'Success',
        description: '2 test notifications created! Check the bell icon.',
      });
    } catch (error) {
      console.error('Error seeding notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Test Notifications</CardTitle>
          </div>
          <CardDescription>
            Click the button below to create 2 test notifications for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={seedNotifications} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Seed Test Notifications'}
          </Button>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            After seeding, navigate to /admin to see the notification bell with a red "2" badge
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
