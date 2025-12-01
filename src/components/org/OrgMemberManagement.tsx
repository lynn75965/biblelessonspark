import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useInvites } from "@/hooks/useInvites";
import { Users, UserPlus, Mail, RefreshCw, XCircle, Send, UserMinus, Crown } from "lucide-react";

// SSOT Imports
import { ORG_ROLES } from "@/constants/accessControl";

interface OrgMember {
  id: string;
  full_name: string | null;
  email?: string;
  organization_role: string | null;
  created_at: string;
}

interface PendingInvite {
  id: string;
  email: string;
  created_at: string;
  claimed_at: string | null;
}

interface OrgMemberManagementProps {
  organizationId: string;
  organizationName: string;
  isLeader: boolean;
}

export function OrgMemberManagement({ organizationId, organizationName, isLeader }: OrgMemberManagementProps) {
  const { toast } = useToast();
  const { sendInvite, getOrgInvites, cancelInvite, resendInvite, loading: inviteLoading } = useInvites();
  
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, organization_role, created_at")
        .eq("organization_id", organizationId)
        .order("organization_role", { ascending: true })
        .order("full_name", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "Error",
        description: "Failed to load organization members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    const invites = await getOrgInvites(organizationId);
    setPendingInvites(invites.filter(inv => !inv.claimed_at));
  };

  useEffect(() => {
    fetchMembers();
    fetchInvites();
  }, [organizationId]);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    const success = await sendInvite({
      email: inviteEmail.trim(),
      organization_id: organizationId,
    });

    if (success) {
      setInviteDialogOpen(false);
      setInviteEmail("");
      fetchInvites();
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    const success = await cancelInvite(inviteId);
    if (success) {
      fetchInvites();
    }
  };

  const handleResendInvite = async (invite: PendingInvite) => {
    await resendInvite(invite as any);
  };

  const handlePromoteToCoLeader = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ organization_role: ORG_ROLES.coLeader })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member promoted to Co-Leader",
      });
      fetchMembers();
    } catch (error) {
      console.error("Error promoting member:", error);
      toast({
        title: "Error",
        description: "Failed to promote member",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          organization_id: null, 
          organization_role: null 
        })
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member removed from organization",
      });
      fetchMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case ORG_ROLES.leader:
        return <Badge className="bg-purple-500"><Crown className="h-3 w-3 mr-1" />Leader</Badge>;
      case ORG_ROLES.coLeader:
        return <Badge className="bg-blue-500"><Crown className="h-3 w-3 mr-1" />Co-Leader</Badge>;
      case ORG_ROLES.member:
        return <Badge variant="secondary">Member</Badge>;
      default:
        return <Badge variant="outline">Member</Badge>;
    }
  };

  const refresh = () => {
    fetchMembers();
    fetchInvites();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Organization Members
              </CardTitle>
              <CardDescription>
                Manage members for {organizationName}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {isLeader && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite New Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join {organizationName}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email Address *</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="teacher@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSendInvite} disabled={inviteLoading}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{members.length}</p>
            <p className="text-sm text-muted-foreground">Active Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-yellow-600">{pendingInvites.length}</p>
            <p className="text-sm text-muted-foreground">Pending Invites</p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members yet. Invite someone to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  {isLeader && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.full_name || "Unnamed Member"}
                    </TableCell>
                    <TableCell>{getRoleBadge(member.organization_role)}</TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                    {isLeader && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {member.organization_role === ORG_ROLES.member && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePromoteToCoLeader(member.id)}
                                title="Promote to Co-Leader"
                              >
                                <Crown className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => handleRemoveMember(member.id)}
                                title="Remove from organization"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {member.organization_role === ORG_ROLES.coLeader && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleRemoveMember(member.id)}
                              title="Remove from organization"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites Table */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Sent</TableHead>
                  {isLeader && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.email}</TableCell>
                    <TableCell>
                      {new Date(invite.created_at).toLocaleDateString()}
                    </TableCell>
                    {isLeader && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendInvite(invite)}
                            disabled={inviteLoading}
                            title="Resend invitation"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleCancelInvite(invite.id)}
                            disabled={inviteLoading}
                            title="Cancel invitation"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
