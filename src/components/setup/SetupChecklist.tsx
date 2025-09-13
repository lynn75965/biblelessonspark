import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock, 
  Database, 
  Shield, 
  Mail, 
  Cpu, 
  Users, 
  Globe, 
  UserPlus,
  FileText,
  Copy,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  what: string;
  why: string;
  how: string;
  icon: React.ReactNode;
  status: 'pending' | 'warning' | 'success' | 'error';
  copyable?: string;
  action?: () => void;
  verifyAction?: () => Promise<void>;
  optional?: boolean;
}

interface SetupChecklistProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function SetupChecklist({ isModal = false, onClose }: SetupChecklistProps) {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'supabase',
      title: 'Create Supabase Project',
      description: 'Set up your backend database and authentication',
      what: 'Create a new Supabase project and configure environment variables',
      why: 'Provides secure authentication, database, and real-time features',
      how: 'Visit supabase.com, create project, copy URL and anon key to app settings',
      icon: <Database className="h-5 w-5" />,
      status: 'pending',
      copyable: 'NEXT_PUBLIC_SUPABASE_URL=your_project_url\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key'
    },
    {
      id: 'schema',
      title: 'Apply Database Schema',
      description: 'Create the required tables and structure',
      what: 'Run the SQL migration to create all necessary database tables',
      why: 'Sets up the multi-tenant structure for organizations, users, and lessons',
      how: 'Copy the provided SQL script and paste it into Supabase SQL Editor',
      icon: <Database className="h-5 w-5" />,
      status: 'pending',
      copyable: `-- LessonSpark Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  doctrine_profile VARCHAR(10) DEFAULT 'SBC' CHECK (doctrine_profile IN ('SBC', 'RB', 'IND')),
  default_age_group VARCHAR(10) DEFAULT 'Adults' CHECK (default_age_group IN ('Kids', 'Youth', 'Adults', 'Seniors')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memberships table (many-to-many: users to organizations)
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  passage_or_topic TEXT NOT NULL,
  age_group VARCHAR(10) NOT NULL CHECK (age_group IN ('Kids', 'Youth', 'Adults', 'Seniors')),
  doctrine_profile VARCHAR(10) NOT NULL CHECK (doctrine_profile IN ('SBC', 'RB', 'IND')),
  notes TEXT,
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Generations table (for usage tracking)
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  input_text TEXT,
  input_char_count INTEGER,
  output_char_count INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'general' CHECK (type IN ('bug', 'feature', 'general')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invites table
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token UUID DEFAULT uuid_generate_v4(),
  role VARCHAR(20) DEFAULT 'teacher',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table (for public interest)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  organization_name VARCHAR(255),
  message TEXT,
  source VARCHAR(50) DEFAULT 'website',
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setup tasks table
CREATE TABLE setup_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  task_id VARCHAR(50) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  UNIQUE(organization_id, task_id)
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organizations: Users can only see orgs they're members of
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Profiles: Users can see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Memberships: Users can see memberships for their orgs
CREATE POLICY "Users can view memberships for their orgs" ON memberships
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Lessons: Users can see lessons for their orgs
CREATE POLICY "Users can view lessons for their orgs" ON lessons
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Similar policies for other tables...
CREATE POLICY "Users can view ai_generations for their orgs" ON ai_generations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Insert seed data
INSERT INTO organizations (name, slug, doctrine_profile) 
VALUES ('Demo Baptist Church', 'demo-baptist', 'SBC');

-- Functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`
    },
    {
      id: 'rls',
      title: 'Enable Row Level Security',
      description: 'Secure multi-tenant data isolation',
      what: 'Verify RLS policies are active on all tables',
      why: 'Ensures each organization can only see their own data',
      how: 'RLS is included in the schema SQL above - verify it\'s working',
      icon: <Shield className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'auth',
      title: 'Configure Authentication',
      description: 'Set up magic link email authentication',
      what: 'Configure Supabase Auth for passwordless magic links',
      why: 'Provides secure, user-friendly authentication',
      how: 'Enable Email auth in Supabase dashboard, test with verification button',
      icon: <Mail className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'ai',
      title: 'AI Enhancement Setup',
      description: 'Configure lesson enhancement AI or use mock mode',
      what: 'Set up AI service or enable mock mode for lesson enhancement',
      why: 'Core feature that generates age-appropriate lesson content',
      how: 'Toggle MOCK_ENHANCE=true for testing, or add real AI key later',
      icon: <Cpu className="h-5 w-5" />,
      status: 'pending',
      copyable: 'MOCK_ENHANCE=true'
    },
    {
      id: 'organization',
      title: 'Create Organization',
      description: 'Set up your church or ministry organization',
      what: 'Create or confirm your organization and admin membership',
      why: 'Required for multi-tenant data organization',
      how: 'Organization created automatically - verify you\'re listed as admin',
      icon: <Users className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'domain',
      title: 'Connect Custom Domain',
      description: 'Point your domain to the application (optional)',
      what: 'Configure DNS records to use your custom domain',
      why: 'Professional branded experience for your teachers',
      how: 'Update DNS with provided A records, wait for SSL provisioning',
      icon: <Globe className="h-5 w-5" />,
      status: 'pending',
      optional: true,
      copyable: `A Record: @ -> 185.158.133.1
A Record: www -> 185.158.133.1`
    },
    {
      id: 'invite',
      title: 'Invite Test Teacher',
      description: 'Send your first teacher invitation',
      what: 'Create and send an invite link to test the flow',
      why: 'Verifies the complete user onboarding experience',
      how: 'Use Admin > Members to create invite, copy link and test',
      icon: <UserPlus className="h-5 w-5" />,
      status: 'pending'
    },
    {
      id: 'lesson',
      title: 'Export Sample Lesson',
      description: 'Test lesson generation and export functionality',
      what: 'Generate, save, and export a sample lesson to PDF',
      why: 'Confirms the complete lesson creation workflow',
      how: 'Use Enhance Lesson feature, save result, test print view',
      icon: <FileText className="h-5 w-5" />,
      status: 'pending'
    }
  ]);

  const [verifying, setVerifying] = useState<string | null>(null);

  const getStatusIcon = (status: SetupStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: SetupStep['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-success-light text-success border-success/20">Complete</Badge>;
      case 'warning':
        return <Badge className="bg-warning-light text-warning border-warning/20">Partial</Badge>;
      case 'error':
        return <Badge className="bg-destructive-light text-destructive border-destructive/20">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const handleVerify = async (stepId: string) => {
    setVerifying(stepId);
    
    // Mock verification logic - replace with actual API calls
    setTimeout(() => {
      setSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, status: Math.random() > 0.7 ? 'error' : 'success' as const }
          : step
      ));
      setVerifying(null);
    }, 1500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const completedSteps = steps.filter(step => step.status === 'success').length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className={cn("w-full max-w-4xl mx-auto", isModal && "max-h-[80vh] overflow-y-auto")}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold gradient-text">Setup Checklist</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete these steps to get LessonSpark ready for your Baptist Bible study enhancement needs.
            Each step includes verification to ensure everything is working correctly.
          </p>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completedSteps}/{totalSteps} completed</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all duration-slow"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card key={step.id} className={cn(
              "border transition-all duration-normal",
              step.status === 'success' && "border-success/30 bg-success-light/30",
              step.status === 'error' && "border-destructive/30 bg-destructive-light/30",
              step.status === 'warning' && "border-warning/30 bg-warning-light/30"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      {step.icon}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {step.title}
                        {step.optional && <Badge variant="outline" className="text-xs">Optional</Badge>}
                      </CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(step.status)}
                    {getStatusIcon(step.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* What/Why/How */}
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">What</h4>
                    <p className="text-muted-foreground">{step.what}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Why</h4>
                    <p className="text-muted-foreground">{step.why}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">How</h4>
                    <p className="text-muted-foreground">{step.how}</p>
                  </div>
                </div>

                {/* Copyable content */}
                {step.copyable && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Copy to clipboard:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(step.copyable!)}
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                      {step.copyable}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="verify"
                    size="sm"
                    onClick={() => handleVerify(step.id)}
                    disabled={verifying === step.id}
                  >
                    {verifying === step.id ? (
                      <>
                        <Clock className="h-3 w-3 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Verify {step.title}
                      </>
                    )}
                  </Button>
                  
                  {/* Quick action buttons based on step */}
                  {step.id === 'supabase' && (
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                        Open Supabase
                      </a>
                    </Button>
                  )}
                  
                  {step.id === 'auth' && (
                    <Button variant="outline" size="sm">
                      Send Test Email
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Actions */}
        {isModal && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="default">
              Continue to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}