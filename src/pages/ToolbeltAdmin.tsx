/**
 * ToolbeltAdmin.tsx
 * Admin page for managing Teacher Toolbelt
 * Location: src/pages/ToolbeltAdmin.tsx
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3, Mail, Users } from 'lucide-react';
import { ToolbeltUsageReport } from '@/components/admin/toolbelt/ToolbeltUsageReport';
import { ToolbeltEmailManager } from '@/components/admin/toolbelt/ToolbeltEmailManager';
import { ToolbeltEmailCaptures } from '@/components/admin/toolbelt/ToolbeltEmailCaptures';
import { ToolbeltGuardrailsStatus } from '@/components/admin/toolbelt/ToolbeltGuardrailsStatus';
import { ROUTES } from '@/constants/routes';

export default function ToolbeltAdmin() {
  const [activeTab, setActiveTab] = useState('usage');

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {/* Back link and title */}
        <div className="mb-6">
          <Link to={ROUTES.ADMIN}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Teacher Toolbelt Admin
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor usage, manage emails, and view guardrails status
              </p>
            </div>
          </div>
        </div>

        {/* Guardrails Status Card - Always visible */}
        <div className="mb-6">
          <ToolbeltGuardrailsStatus />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Usage Report</span>
              <span className="sm:hidden">Usage</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email Sequences</span>
              <span className="sm:hidden">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="captures" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Email Captures</span>
              <span className="sm:hidden">Captures</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usage">
            <ToolbeltUsageReport />
          </TabsContent>

          <TabsContent value="emails">
            <ToolbeltEmailManager />
          </TabsContent>

          <TabsContent value="captures">
            <ToolbeltEmailCaptures />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
