/**
 * EnrollmentAnalyticsPanel - Admin Component
 * 
 * SSOT COMPLIANCE:
 * - Referral source labels from betaEnrollmentConfig.ts
 * - Chart colors from BRANDING (src/config/branding.ts)
 * - Displays data collected during Public Beta enrollment
 * 
 * PURPOSE:
 * Shows admin analytics on:
 * 1. Referral Sources - How users discovered the platform
 * 2. Church Directory - Churches represented by users
 * 
 * Created: January 1, 2026
 * Updated: January 15, 2026 - SSOT color compliance
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Users, Church, RefreshCw, TrendingUp, Download } from 'lucide-react';
import { BETA_ENROLLMENT_CONFIG } from '@/constants/betaEnrollmentConfig';
import { BRANDING } from '@/config/branding';

// ============================================================================
// SSOT: Chart Colors (derived from brand colors)
// These must be hex values for Recharts compatibility
// ============================================================================
const CHART_COLORS_SSOT = {
  primary: BRANDING.colors.primary.DEFAULT,       // Forest green
  primaryLight: BRANDING.colors.primary.light,    // Light green
  secondary: BRANDING.colors.secondary.DEFAULT,   // Antique gold
  secondaryDark: BRANDING.colors.secondary.dark,  // Dark gold
  accent: BRANDING.colors.accent.DEFAULT,         // Deep gold
  burgundy: BRANDING.colors.burgundy.DEFAULT,     // Burgundy
  muted: BRANDING.colors.text.light,              // Muted text
};

// Array of colors for generic charts - uses brand palette
const CHART_COLORS = [
  CHART_COLORS_SSOT.primary,        // Forest green (primary)
  CHART_COLORS_SSOT.secondary,      // Antique gold (secondary)
  CHART_COLORS_SSOT.primaryLight,   // Light green
  CHART_COLORS_SSOT.burgundy,       // Burgundy (for contrast)
  CHART_COLORS_SSOT.accent,         // Deep gold
  CHART_COLORS_SSOT.secondaryDark,  // Dark gold
  CHART_COLORS_SSOT.muted,          // Muted (neutral)
  CHART_COLORS_SSOT.primary,        // Repeat primary for overflow
];

interface ReferralData {
  source: string;
  count: number;
  label: string;
}

interface ChurchData {
  church_name: string;
  user_count: number;
  latest_join: string;
}

export function EnrollmentAnalyticsPanel() {
  const [referralData, setReferralData] = useState<ReferralData[]>([]);
  const [churchData, setChurchData] = useState<ChurchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);

  // Get referral source labels from SSOT
  const referralLabels = useMemo(() => {
    const map: Record<string, string> = {};
    BETA_ENROLLMENT_CONFIG.referralSources.forEach((source) => {
      map[source.value] = source.label;
    });
    return map;
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch referral source counts
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('referral_source, church_name, created_at')
        .not('referral_source', 'is', null);

      if (profilesError) throw profilesError;

      // Process referral sources
      const referralCounts: Record<string, number> = {};
      const churchCounts: Record<string, { count: number; latest: string }> = {};

      profiles?.forEach((profile) => {
        // Count referral sources
        if (profile.referral_source) {
          referralCounts[profile.referral_source] = (referralCounts[profile.referral_source] || 0) + 1;
        }

        // Count churches
        if (profile.church_name && profile.church_name.trim()) {
          const churchKey = profile.church_name.trim();
          if (!churchCounts[churchKey]) {
            churchCounts[churchKey] = { count: 0, latest: profile.created_at };
          }
          churchCounts[churchKey].count += 1;
          if (profile.created_at > churchCounts[churchKey].latest) {
            churchCounts[churchKey].latest = profile.created_at;
          }
        }
      });

      // Transform referral data
      const referralArray: ReferralData[] = Object.entries(referralCounts)
        .map(([source, count]) => ({
          source,
          count,
          label: referralLabels[source] || source,
        }))
        .sort((a, b) => b.count - a.count);

      // Transform church data
      const churchArray: ChurchData[] = Object.entries(churchCounts)
        .map(([church_name, data]) => ({
          church_name,
          user_count: data.count,
          latest_join: data.latest,
        }))
        .sort((a, b) => b.user_count - a.user_count);

      setReferralData(referralArray);
      setChurchData(churchArray);
      setTotalUsers(profiles?.length || 0);

    } catch (error) {
      console.error('Error fetching enrollment analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Chart data for referral sources
  const referralChartData = useMemo(() => {
    return referralData.map((item, index) => ({
      name: item.label,
      value: item.count,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [referralData]);

  // Export to CSV
  const exportToCSV = (type: 'referrals' | 'churches') => {
    let csvContent = '';
    let filename = '';

    if (type === 'referrals') {
      csvContent = 'Referral Source,Count\n';
      referralData.forEach((item) => {
        csvContent += `"${item.label}",${item.count}\n`;
      });
      filename = `referral-sources-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      csvContent = 'Church Name,User Count,Latest Join\n';
      churchData.forEach((item) => {
        csvContent += `"${item.church_name}",${item.user_count},${new Date(item.latest_join).toLocaleDateString()}\n`;
      });
      filename = `church-directory-${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Enrollment Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Enrollment Analytics
            </CardTitle>
            <CardDescription>
              Track how users discover the platform and which churches are represented
            </CardDescription>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">{totalUsers}</div>
            <div className="text-sm text-muted-foreground">Users with Referral Data</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-secondary">{referralData.length}</div>
            <div className="text-sm text-muted-foreground">Referral Sources</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">{churchData.length}</div>
            <div className="text-sm text-muted-foreground">Churches Represented</div>
          </div>
        </div>

        <Tabs defaultValue="referrals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Referral Sources</span>
            </TabsTrigger>
            <TabsTrigger value="churches" className="flex items-center gap-2">
              <Church className="h-4 w-4" />
              <span>Church Directory</span>
            </TabsTrigger>
          </TabsList>

          {/* Referral Sources Tab */}
          <TabsContent value="referrals" className="mt-4">
            {referralData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No Referral Data Yet</p>
                <p className="text-sm">Referral sources will appear when users enroll via Public Beta.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={referralChartData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {referralChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Bar Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">By Count</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={referralChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" name="Users">
                            {referralChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Table */}
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Referral Source Details</h4>
                  <Button variant="outline" size="sm" onClick={() => exportToCSV('referrals')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referral Source</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referralData.map((item) => (
                        <TableRow key={item.source}>
                          <TableCell className="font-medium">{item.label}</TableCell>
                          <TableCell className="text-right">{item.count}</TableCell>
                          <TableCell className="text-right">
                            {totalUsers > 0 ? `${((item.count / totalUsers) * 100).toFixed(1)}%` : '0%'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Church Directory Tab */}
          <TabsContent value="churches" className="mt-4">
            {churchData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Church className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No Church Data Yet</p>
                <p className="text-sm">Churches will appear when users provide their church name during enrollment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Churches Represented ({churchData.length})</h4>
                  <Button variant="outline" size="sm" onClick={() => exportToCSV('churches')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Church Name</TableHead>
                        <TableHead className="text-right">Teachers</TableHead>
                        <TableHead className="text-right">Latest Join</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {churchData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Church className="h-4 w-4 text-muted-foreground" />
                              {item.church_name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{item.user_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {new Date(item.latest_join).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
