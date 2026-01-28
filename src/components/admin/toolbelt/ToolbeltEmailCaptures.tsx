/**
 * ToolbeltEmailCaptures.tsx
 * Displays captured emails from Teacher Toolbelt
 * Location: src/components/admin/toolbelt/ToolbeltEmailCaptures.tsx
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Download, Mail, Calendar, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TOOLBELT_TOOLS, ToolbeltToolId } from '@/constants/toolbeltConfig';

interface EmailCapture {
  id: string;
  email: string;
  tool_id: string;
  reflection_sent: boolean;
  created_at: string;
}

export function ToolbeltEmailCaptures() {
  const [captures, setCaptures] = useState<EmailCapture[]>([]);
  const [filteredCaptures, setFilteredCaptures] = useState<EmailCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCaptures();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredCaptures(
        captures.filter(c => 
          c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.tool_id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredCaptures(captures);
    }
  }, [searchTerm, captures]);

  async function fetchCaptures() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('toolbelt_email_captures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCaptures(data || []);
      setFilteredCaptures(data || []);
    } catch (err) {
      console.error('Error fetching captures:', err);
      toast({
        title: 'Error',
        description: 'Failed to load email captures',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function getToolName(toolId: string): string {
    const tool = TOOLBELT_TOOLS[toolId as ToolbeltToolId];
    return tool ? tool.name : toolId;
  }

  function exportToCSV() {
    const headers = ['Email', 'Tool', 'Reflection Sent', 'Captured At'];
    const rows = filteredCaptures.map(c => [
      c.email,
      getToolName(c.tool_id),
      c.reflection_sent ? 'Yes' : 'No',
      new Date(c.created_at).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toolbelt-captures-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: `${filteredCaptures.length} records exported to CSV`,
    });
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Captures</CardDescription>
            <CardTitle className="text-2xl">{captures.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reflections Sent</CardDescription>
            <CardTitle className="text-2xl">
              {captures.filter(c => c.reflection_sent).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Week</CardDescription>
            <CardTitle className="text-2xl">
              {captures.filter(c => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(c.created_at) > weekAgo;
              }).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-2xl">
              {captures.filter(c => {
                const today = new Date().toDateString();
                return new Date(c.created_at).toDateString() === today;
              }).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Captures</CardTitle>
              <CardDescription>
                {filteredCaptures.length} of {captures.length} records
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or tool..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredCaptures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {captures.length === 0 
                ? 'No email captures yet. Captures will appear here when users opt in.'
                : 'No results match your search.'
              }
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Tool Used</TableHead>
                    <TableHead>Reflection Sent</TableHead>
                    <TableHead>Captured</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCaptures.map((capture) => (
                    <TableRow key={capture.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {capture.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          {getToolName(capture.tool_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={capture.reflection_sent ? 'default' : 'secondary'}>
                          {capture.reflection_sent ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(capture.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
