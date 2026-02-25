import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, UserPlus, RefreshCw, Shield, User, Users, Mail, Loader2, Clock, Send, X, Gift, Calendar, Layers, Download, Filter } from "lucide-react";
import { format, isPast, addDays, differenceInDays } from "date-fns";
import { useAdminOperations } from "@/hooks/useAdminOperations";
import { useInvites } from "@/hooks/useInvites";
import { TRIAL_CONFIG, getDefaultGrantDays, getDefaultGrantMode, getDefaultPresetDate, TrialGrantMode } from "@/constants/trialConfig";

interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
  founder_status: string;
  created_at: string;
  user_roles?: Array<{ role: string }>;
  trial_full_lesson_granted_until?: string | null;
  // Feature Adoption fields
  lessons_count?: number;
  shaped_lessons_count?: number;
  team_role?: string | null;
  team_name?: string | null;
}

type AdoptionFilter = 'all' | 'no_lessons' | 'has_lessons_no_shapes' | 'has_shapes' | 'no_team' | 'has_team';

interface PendingInvite {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  token: string;
}

// SSOT: Extract UI config for cleaner JSX
const TRIAL_UI = TRIAL_CONFIG.adminGrant.ui;
const TRIAL_BADGE = TRIAL_CONFIG.adminGrant.badge;
const TRIAL_REVOKE_UI = TRIAL_CONFIG.adminRevoke.ui;

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [cancelingInviteId, setCancelingInviteId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Trial grant state - uses SSOT for default values
  const [trialDialogOpen, setTrialDialogOpen] = useState(false);
  const [trialGrantMode, setTrialGrantMode] = useState<TrialGrantMode>(getDefaultGrantMode());
  const [trialGrantDays, setTrialGrantDays] = useState(getDefaultGrantDays().toString());
  const [trialGrantDate, setTrialGrantDate] = useState(getDefaultPresetDate());
  const [grantingTrialUserId, setGrantingTrialUserId] = useState<string | null>(null);
  const [trialUser, setTrialUser] = useState<UserProfile | null>(null);
  
  // Trial revoke state
  const [revokingTrialUserId, setRevokingTrialUserId] = useState<string | null>(null);
  
  // Feature Adoption filter state
  const [adoptionFilter, setAdoptionFilter] = useState<AdoptionFilter>('all');
  
  const { toast } = useToast();
  const { updateUserRole, deleteUser, loading: adminLoading } = useAdminOperations();
  const { sendInvite, loading: inviteLoading } = useInvites();

  const fetchUsers = async () => {
    try {
      // Use admin function that bypasses RLS
      const { data, error } = await supabase
        .rpc('get_all_users_for_admin');

      if (error) {
        throw error;
      }

      // Map user_role back to role for component compatibility
      const mappedUsers = (data || []).map(u => ({
        ...u,
        role: u.user_role || 'teacher'
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvites = async () => {
    setInvitesLoading(true);
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('id, email, created_at, expires_at, token')
        .is('claimed_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPendingInvites(data || []);
    } catch (error) {
      console.error('Error fetching pending invites:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending invites.",
        variant: "destructive",
      });
    } finally {
      setInvitesLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchUsers(), fetchPendingInvites()]);
      toast({
        title: "Refreshed",
        description: "User data has been refreshed.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelInvite = async (inviteId: string, email: string) => {
    setCancelingInviteId(inviteId);
    try {
      const { error } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId);

      if (error) {
        throw error;
      }

      toast({
        title: "Invite Canceled",
        description: `Invitation for ${email} has been canceled.`,
      });

      await fetchPendingInvites();
    } catch (error) {
      console.error('Error canceling invite:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation.",
        variant: "destructive",
      });
    } finally {
      setCancelingInviteId(null);
    }
  };

  const handleResendInvite = async (inviteId: string, email: string) => {
    setResendingInviteId(inviteId);
    try {
      // Step 1: Delete the old invite
      const { error: deleteError } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId);

      if (deleteError) {
        throw deleteError;
      }

      // Step 2: Send a new invite using the existing hook
      const success = await sendInvite({ email });

      if (success) {
        toast({
          title: "Invite Resent",
          description: `A new invitation has been sent to ${email}.`,
        });
        await fetchPendingInvites();
      }
    } catch (error) {
      console.error('Error resending invite:', error);
      toast({
        title: "Error",
        description: "Failed to resend invitation.",
        variant: "destructive",
      });
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await deleteUser(userId);
      await fetchUsers();
      toast({
        title: "Success",
        description: `${userName || 'User'} has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleGrantTrial = async () => {
    if (!trialUser) return;
    
    setGrantingTrialUserId(trialUser.id);
    try {
      let grantedUntil: Date;
      let days: number;
      
      if (trialGrantMode === 'days') {
        // Days from today mode
        days = parseInt(trialGrantDays) || getDefaultGrantDays();
        grantedUntil = addDays(new Date(), days);
      } else {
        // Specific date mode
        // Parse the date and set to end of day (23:59:59)
        grantedUntil = new Date(trialGrantDate + 'T23:59:59');
        days = differenceInDays(grantedUntil, new Date());
      }
      
      const expireDateFormatted = format(grantedUntil, 'MMM d, yyyy');
      
      // CRITICAL: Also clear trial_full_lesson_last_used to reset usage flag
      // Without this, extending a trial doesn't work if user already used their trial
      const { error } = await supabase
        .from('profiles')
        .update({ 
          trial_full_lesson_granted_until: grantedUntil.toISOString(),
          trial_full_lesson_last_used: null  // Reset usage flag
        })
        .eq('id', trialUser.id);

      if (error) {
        throw error;
      }

      // Use appropriate SSOT success message based on mode
      const successMessage = trialGrantMode === 'days'
        ? TRIAL_UI.successDescription(trialUser.full_name || 'User', days, expireDateFormatted)
        : TRIAL_UI.successDescriptionDate(trialUser.full_name || 'User', expireDateFormatted);
      
      toast({
        title: TRIAL_UI.successTitle,
        description: successMessage,
      });

      setTrialDialogOpen(false);
      setTrialUser(null);
      setTrialGrantDays(getDefaultGrantDays().toString());
      setTrialGrantDate(getDefaultPresetDate());
      setTrialGrantMode(getDefaultGrantMode());
      await fetchUsers();
    } catch (error) {
      console.error('Error granting trial:', error);
      toast({
        title: TRIAL_UI.errorTitle,
        description: TRIAL_UI.errorDescription,
        variant: "destructive",
      });
    } finally {
      setGrantingTrialUserId(null);
    }
  };

  const handleRevokeTrial = async (user: UserProfile) => {
    setRevokingTrialUserId(user.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ trial_full_lesson_granted_until: null })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Use SSOT for success message
      toast({
        title: TRIAL_REVOKE_UI.successTitle,
        description: TRIAL_REVOKE_UI.successDescription(user.full_name || 'User'),
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error revoking trial:', error);
      toast({
        title: TRIAL_REVOKE_UI.errorTitle,
        description: TRIAL_REVOKE_UI.errorDescription,
        variant: "destructive",
      });
    } finally {
      setRevokingTrialUserId(null);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    const success = await sendInvite({ email: inviteEmail });
    if (success) {
      setInviteDialogOpen(false);
      setInviteEmail("");
      await fetchPendingInvites();
    }
  };

  // Helper: Calculate expiration date based on current mode
  const getExpirationDate = (): Date => {
    if (trialGrantMode === 'days') {
      const days = parseInt(trialGrantDays) || getDefaultGrantDays();
      return addDays(new Date(), days);
    } else {
      return new Date(trialGrantDate + 'T23:59:59');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPendingInvites();
  }, []);

  const filteredUsers = users.filter(user => {
    // Text search filter
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Adoption filter
    switch (adoptionFilter) {
      case 'no_lessons':
        return (user.lessons_count || 0) === 0;
      case 'has_lessons_no_shapes':
        return (user.lessons_count || 0) > 0 && (user.shaped_lessons_count || 0) === 0;
      case 'has_shapes':
        return (user.shaped_lessons_count || 0) > 0;
      case 'no_team':
        return !user.team_role;
      case 'has_team':
        return !!user.team_role;
      default:
        return true;
    }
  });

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Name', 'Role', 'Lessons', 'Shaped', 'Team Status', 'Team Name', 'Trial Status', 'Created'];
    const rows = filteredUsers.map(user => [
      user.full_name || 'Unnamed',
      user.role,
      (user.lessons_count || 0).toString(),
      (user.shaped_lessons_count || 0).toString(),
      user.team_role || 'None',
      user.team_name || '',
      hasActiveTrial(user.trial_full_lesson_granted_until) 
        ? `Active until ${format(new Date(user.trial_full_lesson_granted_until!), 'MMM d, yyyy')}` 
        : 'None',
      format(new Date(user.created_at), 'yyyy-MM-dd'),
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `biblelessonspark-users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "CSV Exported",
      description: `${filteredUsers.length} users exported to CSV.`,
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      default: return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? Shield : User;
  };

  const getInviteStatus = (expiresAt: string) => {
    return isPast(new Date(expiresAt)) ? 'expired' : 'pending';
  };

  // Check if user has active trial grant
  const hasActiveTrial = (grantedUntil: string | null | undefined): boolean => {
    if (!grantedUntil) return false;
    return new Date(grantedUntil) > new Date();
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 max-w-sm">
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by name, role, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                onClick={() => setInviteDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite User
              </Button>
            </div>
          </div>

          {/* Feature Adoption Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select value={adoptionFilter} onValueChange={(v) => setAdoptionFilter(v as AdoptionFilter)}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Filter by feature adoption..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="no_lessons">Never Generated a Lesson</SelectItem>
                  <SelectItem value="has_lessons_no_shapes">Has Lessons, Never Reshaped</SelectItem>
                  <SelectItem value="has_shapes">Has Used Lesson Shapes</SelectItem>
                  <SelectItem value="no_team">Not on a Teaching Team</SelectItem>
                  <SelectItem value="has_team">On a Teaching Team</SelectItem>
                </SelectContent>
              </Select>
              {adoptionFilter !== 'all' && (
                <Button variant="ghost" size="sm" onClick={() => setAdoptionFilter('all')}>
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              disabled={filteredUsers.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV ({filteredUsers.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-xs text-muted-foreground">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'teacher').length}</p>
                <p className="text-xs text-muted-foreground">Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{pendingInvites.length}</p>
                <p className="text-xs text-muted-foreground">Pending Invites</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <Card className="bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Pending Invitations ({pendingInvites.length})
            </CardTitle>
            <CardDescription>
              Manage unclaimed beta tester invitations. Resend or cancel invites as needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                        <p className="text-muted-foreground">Loading invites...</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingInvites.map((invite) => {
                      const status = getInviteStatus(invite.expires_at);
                      const isExpired = status === 'expired';
                      
                      return (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {invite.email}
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(invite.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{format(new Date(invite.expires_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                              {isExpired ? 'Expired' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvite(invite.id, invite.email)}
                                disabled={resendingInviteId === invite.id}
                                title="Resend Invitation"
                              >
                                {resendingInviteId === invite.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelInvite(invite.id, invite.email)}
                                disabled={cancelingInviteId === invite.id}
                                className="text-destructive hover:text-destructive"
                                title="Cancel Invitation"
                              >
                                {cancelingInviteId === invite.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle>
            Registered Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription>
            All registered users and their current roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Lessons</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Shapes</TableHead>
                  <TableHead className="hidden lg:table-cell">Team</TableHead>
                  <TableHead className="hidden md:table-cell">Trial Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No users found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const RoleIcon = getRoleIcon(user.role);
                    const userHasActiveTrial = hasActiveTrial(user.trial_full_lesson_granted_until);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div>
                            {user.full_name || 'Unnamed'}
                            <span className="block text-xs text-muted-foreground truncate max-w-[150px]">
                              {user.id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {user.role}
                          </Badge>
                        </TableCell>
                        {/* Feature Adoption: Lessons Count */}
                        <TableCell className="hidden md:table-cell text-center">
                          <span className={`text-sm font-medium ${(user.lessons_count || 0) === 0 ? 'text-muted-foreground' : ''}`}>
                            {user.lessons_count || 0}
                          </span>
                        </TableCell>
                        {/* Feature Adoption: Shaped Lessons */}
                        <TableCell className="hidden md:table-cell text-center">
                          {(user.shaped_lessons_count || 0) > 0 ? (
                            <Badge variant="outline" className="text-primary border-primary">
                              <Layers className="h-3 w-3 mr-1" />
                              {user.shaped_lessons_count}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        {/* Feature Adoption: Teaching Team */}
                        <TableCell className="hidden lg:table-cell">
                          {user.team_role ? (
                            <Badge variant="outline" className="text-success border-success">
                              <Users className="h-3 w-3 mr-1" />
                              {user.team_role === 'lead' ? 'Lead' : 'Member'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {userHasActiveTrial && TRIAL_BADGE.show ? (
                            <Badge variant="outline" className="text-success border-success">
                              <Gift className="h-3 w-3 mr-1" />
                              {TRIAL_BADGE.prefix} {format(new Date(user.trial_full_lesson_granted_until!), 'MMM d')}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {/* Grant/Extend Trial Button */}
                            {TRIAL_CONFIG.adminGrant.enabled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setTrialUser(user);
                                  setTrialDialogOpen(true);
                                }}
                                disabled={grantingTrialUserId === user.id}
                                title={userHasActiveTrial ? TRIAL_UI.buttonTitleExtend : TRIAL_UI.buttonTitle}
                                className="text-success hover:text-success"
                              >
                                {grantingTrialUserId === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Gift className="h-4 w-4" />
                                )}
                              </Button>
                            )}

                            {/* Edit Role Dialog */}
                            <Dialog 
                              open={editDialogOpen && selectedUser?.id === user.id} 
                              onOpenChange={(open) => {
                                setEditDialogOpen(open);
                                if (!open) setSelectedUser(null);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setEditDialogOpen(true);
                                  }}
                                  title="Edit Role"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit User Role</DialogTitle>
                                  <DialogDescription>
                                    Change the role for {user.full_name || 'this user'}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select
                                      defaultValue={user.role}
                                      onValueChange={(value) => handleUpdateRole(user.id, value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Revoke Trial Dialog */}
                            {TRIAL_CONFIG.adminRevoke.enabled && userHasActiveTrial && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={revokingTrialUserId === user.id}
                                    title={TRIAL_REVOKE_UI.buttonTitle}
                                    className="text-warning hover:text-warning"
                                  >
                                    {revokingTrialUserId === user.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{TRIAL_REVOKE_UI.dialogTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {TRIAL_REVOKE_UI.dialogDescription}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{TRIAL_REVOKE_UI.cancelButton}</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleRevokeTrial(user)}
                                      className="bg-warning text-warning-foreground hover:bg-warning/90"
                                    >
                                      {TRIAL_REVOKE_UI.confirmButton}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}

                            {/* Delete User Dialog */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.full_name || 'this user'}? 
                                    This action cannot be undone and will permanently remove all user data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(user.id, user.full_name || 'User')}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Grant Trial Dialog - All text from SSOT */}
      <Dialog open={trialDialogOpen} onOpenChange={setTrialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-success" />
              {TRIAL_UI.dialogTitle}
            </DialogTitle>
            <DialogDescription>
              {TRIAL_UI.dialogDescription.replace('temporary access to full lessons (all 8 sections)', 
                `temporary access to full lessons (all ${TRIAL_CONFIG.sectionsGranted} sections)`)}
              {trialUser && hasActiveTrial(trialUser.trial_full_lesson_granted_until) && (
                <span className="block mt-2 text-warning">
                  {TRIAL_UI.activeTrialWarning.replace(
                    'This user already has an active trial.',
                    `This user already has an active trial until ${format(new Date(trialUser.trial_full_lesson_granted_until!), 'MMM d, yyyy')}.`
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Mode Toggle - SSOT labels */}
            <div className="space-y-2">
              <Label>{TRIAL_UI.modeLabel}</Label>
              <Tabs value={trialGrantMode} onValueChange={(v) => setTrialGrantMode(v as TrialGrantMode)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="days">{TRIAL_UI.modeDays}</TabsTrigger>
                  <TabsTrigger value="date" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {TRIAL_UI.modeDate}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Days Mode */}
            {trialGrantMode === 'days' && (
              <div className="space-y-2">
                <Label htmlFor="trial-days">{TRIAL_UI.daysLabel}</Label>
                {/* SSOT: Dropdown options from TRIAL_CONFIG.adminGrant.dayOptions */}
                <Select value={trialGrantDays} onValueChange={setTrialGrantDays}>
                  <SelectTrigger id="trial-days">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIAL_CONFIG.adminGrant.dayOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Mode */}
            {trialGrantMode === 'date' && (
              <div className="space-y-3">
                {/* Preset dates dropdown - SSOT */}
                <div className="space-y-2">
                  <Label>{TRIAL_UI.presetDateLabel}</Label>
                  <Select value={trialGrantDate} onValueChange={setTrialGrantDate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a date..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIAL_CONFIG.adminGrant.presetDates.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Custom date input */}
                <div className="space-y-2">
                  <Label htmlFor="custom-date">{TRIAL_UI.customDateLabel}</Label>
                  <Input
                    id="custom-date"
                    type="date"
                    value={trialGrantDate}
                    onChange={(e) => setTrialGrantDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>
            )}

            {/* Expiration preview */}
            <div className="text-sm text-muted-foreground">
              {TRIAL_UI.expirationLabel}{' '}
              <strong>{format(getExpirationDate(), 'MMMM d, yyyy')}</strong>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTrialDialogOpen(false);
                setTrialUser(null);
                setTrialGrantMode(getDefaultGrantMode());
              }}
              disabled={grantingTrialUserId !== null}
            >
              {TRIAL_UI.cancelButton}
            </Button>
            <Button
              onClick={handleGrantTrial}
              disabled={grantingTrialUserId !== null}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {grantingTrialUserId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {TRIAL_UI.confirmingButton}
                </>
              ) : (
                <>
                  <Gift className="mr-2 h-4 w-4" />
                  {TRIAL_UI.confirmButton}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invite New User
            </DialogTitle>
            <DialogDescription>
              Send an invitation email to a new user to join BibleLessonSpark.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="you@yourplace.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={inviteLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInviteDialogOpen(false);
                setInviteEmail("");
              }}
              disabled={inviteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={inviteLoading || !inviteEmail}
            >
              {inviteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
