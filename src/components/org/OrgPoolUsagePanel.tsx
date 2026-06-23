/**
 * OrgPoolUsagePanel -- Shepherding B5 (leader pool monitoring).
 *
 * Shows the Shepherd group leader how many lessons each member has drawn from
 * the shared pool -- this 30-day period and all-time -- plus when they last
 * drew one. Data comes from the leader-gated SECURITY DEFINER resolver
 * get_org_pool_usage(), which returns rows only for a leader/co-leader/owner of
 * the caller's own org (members see nothing; no cross-org leakage).
 *
 * @location src/components/org/OrgPoolUsagePanel.tsx
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Loader2 } from "lucide-react";

interface MemberPoolUsage {
  user_id: string;
  full_name: string | null;
  pool_lessons_this_period: number;
  pool_lessons_total: number;
  last_pool_lesson_at: string | null;
}

interface OrgPoolUsagePanelProps {
  organizationName: string;
}

const formatLastUsed = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "--";

export function OrgPoolUsagePanel({ organizationName }: OrgPoolUsagePanelProps) {
  const [rows, setRows] = useState<MemberPoolUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_org_pool_usage");
      if (cancelled) return;
      if (error) {
        console.error("Error loading pool usage by member:", error);
        setRows([]);
      } else {
        setRows((data ?? []) as MemberPoolUsage[]);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalThisPeriod = rows.reduce(
    (sum, r) => sum + (r.pool_lessons_this_period || 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-4 w-4" aria-hidden="true" />
          Pool Usage by Member
        </CardTitle>
        <CardDescription>
          Lessons each member has drawn from {organizationName}'s shared pool this
          period.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground py-6"
            role="status"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading usage...
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">
            No members to show yet.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Member</TableHead>
                  <TableHead scope="col" className="text-right">
                    This period
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Total
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Last used
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell className="font-medium">
                      {r.full_name || "Member"}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.pool_lessons_this_period}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.pool_lessons_total}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatLastUsed(r.last_pool_lesson_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">
              {totalThisPeriod} lesson{totalThisPeriod === 1 ? "" : "s"} drawn from
              the pool this period.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
