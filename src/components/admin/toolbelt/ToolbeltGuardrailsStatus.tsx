/**
 * ToolbeltGuardrailsStatus.tsx
 * Displays current guardrails configuration for Teacher Toolbelt
 * Location: src/components/admin/toolbelt/ToolbeltGuardrailsStatus.tsx
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { 
  TOOLBELT_THEOLOGICAL_GUARDRAILS, 
  TOOLBELT_VOICE_GUARDRAILS,
  TOOLBELT_THRESHOLDS,
  TOOLBELT_ADMIN_CONFIG
} from '@/constants/toolbeltConfig';

export function ToolbeltGuardrailsStatus() {
  const { guardrailsDisplay } = TOOLBELT_ADMIN_CONFIG;

  const statusItems = [
    {
      label: 'Theological Baseline',
      value: guardrailsDisplay.theologicalBaseline,
      status: 'active',
    },
    {
      label: 'Voice Mode',
      value: guardrailsDisplay.voiceMode,
      status: 'active',
    },
    {
      label: 'Product Mentions',
      value: guardrailsDisplay.productMentions,
      status: 'active',
    },
    {
      label: 'Doctrinal Positions',
      value: guardrailsDisplay.doctrinalPositions,
      status: 'active',
    },
    {
      label: 'Monthly Call Threshold',
      value: `${TOOLBELT_THRESHOLDS.monthlyCallLimit.toLocaleString()} calls`,
      status: 'active',
    },
    {
      label: 'Max Tokens per Call',
      value: `~${TOOLBELT_THRESHOLDS.maxTokensPerCall.toLocaleString()} tokens`,
      status: 'active',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
  };

  // Extract prohibition keywords for display
  const voiceProhibitions = [
    'prescriptive_advice',
    'diagnose_problems', 
    'product_mentions',
    'pricing_features',
    'doctrinal_positions',
    'bullet_points',
    'questions_in_output',
    'imply_failure',
    'exclamation_points',
  ];

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Guardrails Status</CardTitle>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            All Active
          </Badge>
        </div>
        <CardDescription>
          Voice and theological constraints protecting all tool reflections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {statusItems.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-lg border"
            >
              <span className="text-sm font-medium text-muted-foreground">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{item.value}</span>
                {getStatusIcon(item.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Voice Prohibitions Summary */}
        <div className="mt-4 p-3 bg-white rounded-lg border">
          <p className="text-sm font-medium text-muted-foreground mb-2">Voice Prohibitions</p>
          <div className="flex flex-wrap gap-2">
            {voiceProhibitions.map((prohibition) => (
              <Badge key={prohibition} variant="secondary" className="text-xs">
                {prohibition.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>

        {/* Topics to Avoid */}
        <div className="mt-3 p-3 bg-white rounded-lg border">
          <p className="text-sm font-medium text-muted-foreground mb-2">Theological Topics Avoided</p>
          <div className="flex flex-wrap gap-2">
            {TOOLBELT_THEOLOGICAL_GUARDRAILS.topicsToAvoid.map((topic, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {topic.length > 30 ? topic.substring(0, 30) + '...' : topic}
              </Badge>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Guardrails are embedded in prompts and cannot be modified via UI. 
          Changes require code updates to toolbeltConfig.ts.
        </p>
      </CardContent>
    </Card>
  );
}
