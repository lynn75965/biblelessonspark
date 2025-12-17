import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  METRICS_DISPLAY,
  METRICS_COLUMNS,
  STATUS_BADGES,
  formatDuration,
  getDurationColor,
} from '@/constants/metricsViewerConfig';

// -----------------------------------------------------
// TYPES
// -----------------------------------------------------
interface MetricsRecord {
  id: string;
  user_id: string;
  device_type: string;
  browser: string | null;
  os: string | null;
  generation_duration_ms: number | null;
  status: string;
  sections_requested: number;
  sections_generated: number | null;
  error_message: string | null;
  created_at: string;
}

interface MetricsSummary {
  total: number;
  completed: number;
  timeouts: number;
  errors: number;
  avgDuration: number | null;
  deviceBreakdown: Record<string, number>;
}

// -----------------------------------------------------
// DEVICE ICON COMPONENT
// -----------------------------------------------------
const DeviceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'mobile':
      return <Smartphone className="h-4 w-4" />;
    case 'tablet':
      return <Tablet className="h-4 w-4" />;
    case 'desktop':
      return <Monitor className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};

// -----------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------
export function GenerationMetricsPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<MetricsRecord[]>([]);
  const [summary, setSummary] = useState<MetricsSummary>({
    total: 0,
    completed: 0,
    timeouts: 0,
    errors: 0,
    avgDuration: null,
    deviceBreakdown: {},
  });

  // Sorting state
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // -----------------------------------------------------
  // DATA FETCHING
  // -----------------------------------------------------
  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('generation_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(METRICS_DISPLAY.defaultLimit);

      if (error) throw error;

      setMetrics(data || []);

      // Calculate summary statistics
      const records = data || [];
      const completed = records.filter(r => r.status === 'completed');
      const timeouts = records.filter(r => r.status === 'timeout');
      const errors = records.filter(r => r.status === 'error');

      // Average duration for completed generations only
      const completedDurations = completed
        .map(r => r.generation_duration_ms)
        .filter((d): d is number => d !== null);

      const avgDuration = completedDurations.length > 0
        ? Math.round(completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length)
        : null;

      // Device breakdown
      const deviceBreakdown: Record<string, number> = {};
      records.forEach(r => {
        const device = r.device_type || 'unknown';
        deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
      });

      setSummary({
        total: records.length,
        completed: completed.length,
        timeouts: timeouts.length,
        errors: errors.length,
        avgDuration,
        deviceBreakdown,
      });

    } catch (error) {
      console.error('Error fetching generation metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load generation metrics.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // -----------------------------------------------------
  // EVENT HANDLERS
  // -----------------------------------------------------
  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
    toast({
      title: 'Refreshing',
      description: 'Loading latest metrics data...',
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // -----------------------------------------------------
  // SORTING LOGIC
  // -----------------------------------------------------
  const sortedMetrics = [...metrics].sort((a, b) => {
    let comparison = 0;
    const aVal = a[sortField as keyof MetricsRecord];
    const bVal = b[sortField as keyof MetricsRecord];

    if (sortField === 'created_at') {
      comparison = new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
    } else if (sortField === 'generation_duration_ms') {
      comparison = ((aVal as number) || 0) - ((bVal as number) || 0);
    } else if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // -----------------------------------------------------
  // SORT ICON COMPONENT
  // -----------------------------------------------------
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc'
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  // -----------------------------------------------------
  // LOADING STATE
  // -----------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // -----------------------------------------------------
  // RENDER
  // -----------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card">
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{summary.total}</p>
            <p className="text-xs text-muted-foreground">Total Generations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{summary.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{formatDuration(summary.avgDuration)}</p>
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold">{summary.timeouts + summary.errors}</p>
            <p className="text-xs text-muted-foreground">Timeouts/Errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Device Breakdown */}
      <Card className="bg-gradient-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Device Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(summary.deviceBreakdown).map(([device, count]) => (
              <div key={device} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <DeviceIcon type={device} />
                <span className="capitalize">{device}</span>
                <Badge variant="secondary">{count}</Badge>
                {summary.total > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((count / summary.total) * 100)}%)
                  </span>
                )}
              </div>
            ))}
            {Object.keys(summary.deviceBreakdown).length === 0 && (
              <p className="text-muted-foreground text-sm">No device data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Table */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Generation History
              </CardTitle>
              <CardDescription>
                Recent lesson generation metrics (last {METRICS_DISPLAY.defaultLimit})
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {METRICS_COLUMNS.map(col => (
                    <TableHead
                      key={col.key}
                      className={col.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.sortable && <SortIcon field={col.key} />}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMetrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={METRICS_COLUMNS.length} className="text-center py-8 text-muted-foreground">
                      No generation metrics found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedMetrics.map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {format(new Date(record.created_at), METRICS_DISPLAY.dateFormat)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon type={record.device_type} />
                          <span className="capitalize">{record.device_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{record.browser || '—'}</TableCell>
                      <TableCell>{record.os || '—'}</TableCell>
                      <TableCell className={getDurationColor(record.generation_duration_ms)}>
                        {formatDuration(record.generation_duration_ms)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGES[record.status]?.variant || 'outline'}>
                          {STATUS_BADGES[record.status]?.label || record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {record.sections_generated ?? '—'}/{record.sections_requested}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
