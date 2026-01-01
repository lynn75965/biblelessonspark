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
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, UserPlus, RefreshCw, Shield, User, Mail, Loader2, Clock, Send, X, Gift } from "lucide-react";
import { format, isPast, addDays } from "date-fns";
import { useAdminOperations } from "@/hooks/useAdminOperations";
import { useInvites } from "@/hooks/useInvites";
import { TRIAL_CONFIG, getDefaultGrantDays } from "@/constants/trialConfig";

interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
  founder_status: string;
  created_at: string;
  user_roles?: Array<{ role: string }>;
  trial_full_lesson_granted_until?: string | null;
}

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
  
  // Trial grant state - uses SSOT for default value
  const [trialDialogOpen, setTrialDialogOpen] = useState(false);
  const [trialGrantDays, setTrialGrantDays] = useState(getDefaultGrantDays().toString());
  const [grantingTrialUserId, setGrantingTrialUserId] = useState<string | null>(null);
  const [trialUser, setTrialUser] = useState<UserProfile | null>(null);
  
  // Trial revoke state
  const [revokingTrialUserId, setRevokingTrialUserId] = useState<string | null>(null);
  
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
      const days = parseInt(trialGrantDays) || getDefaultGrantDays();
      const grantedUntil = addDays(new Date(), days);
      const expireDateFormatted = format(grantedUntil, 'MMM d, yyyy');
      
      const { error } = await supabase
        .from('profiles')
        .update({ trial_full_lesson_granted_until: grantedUntil.toISOString() })
        .eq('id', trialUser.id);

      if (error) {
        throw error;
      }

      // Use SSOT for success message
      toast({
        title: TRIAL_UI.successTitle,
        description: TRIAL_UI.successDescription(
          trialUser.full_name || 'User',
          days,
          expireDateFormatted
        ),
      });

      setTrialDialogOpen(false);
      setTrialUser(null);
      setTrialGrantDays(getDefaultGrantDays().toString());
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

  useEffect(() => {
    fetchUsers();
    fetchPendingInvites();
  }, []);

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{invite.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(invite.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invite.expires_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isExpired ? 'destructive' : 'outline'}>
                              {isExpired ? 'Expired' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvite(invite.id, invite.email)}
                                disabled={resendingInviteId === invite.id || inviteLoading}
                                title="Resend Invitation"
                              >
                                {resendingInviteId === invite.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    disabled={cancelingInviteId === invite.id}
                                    title="Cancel Invitation"
                                  >
                                    {cancelingInviteId === invite.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to cancel the invitation for {invite.email}? 
                                      They will no longer be able to use their invitation link.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Invite</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleCancelInvite(invite.id, invite.email)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Cancel Invitation
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
      )}

      {/* Users Table */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Complete list of registered users and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchTerm ? "No users match your search." : "No users found."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const RoleIcon = getRoleIcon(user.role);
                    const userHasActiveTrial = hasActiveTrial(user.trial_full_lesson_granted_until);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <RoleIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                              <p className="text-xs text-muted-foreground">{user.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline">
                              {user.founder_status}
                            </Badge>
                            {/* SSOT: Trial badge controlled by TRIAL_BADGE config */}
                            {TRIAL_BADGE.show && userHasActiveTrial && (
                              <Badge variant="secondary" className="text-xs">
                                <Gift className="h-3 w-3 mr-1" />
                                {TRIAL_BADGE.prefix} {format(new Date(user.trial_full_lesson_granted_until!), 'MMM d')}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            {/* Edit Role Dialog */}
                            <Dialog open={editDialogOpen && selectedUser?.id === user.id} onOpenChange={setEditDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
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
                                <div className="py-4">
                                  <Label htmlFor="role">Role</Label>
                                  <Select 
                                    defaultValue={user.role}
                                    onValueChange={(value) => setSelectedUser(prev => prev ? {...prev, role: value} : null)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Administrator</SelectItem>
                                      <SelectItem value="teacher">Teacher</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => {
                                      if (selectedUser) {
                                        handleUpdateRole(user.id, selectedUser.role);
                                      }
                                    }}
                                    className="bg-warning text-warning-foreground hover:bg-warning/90"
                                  >
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Grant Trial Button - SSOT: Only show if adminGrant.enabled */}
                            {TRIAL_CONFIG.adminGrant.enabled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setTrialUser(user);
                                  setTrialGrantDays(getDefaultGrantDays().toString());
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

                            {/* Revoke Trial Button - SSOT: Only show if adminRevoke.enabled AND user has active trial */}
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
            <div className="text-sm text-muted-foreground">
              {TRIAL_UI.expirationLabel} <strong>{format(addDays(new Date(), parseInt(trialGrantDays) || getDefaultGrantDays()), 'MMMM d, yyyy')}</strong>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTrialDialogOpen(false);
                setTrialUser(null);
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
              Send an invitation email to a new user to join LessonSpark USA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@church.org"
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
