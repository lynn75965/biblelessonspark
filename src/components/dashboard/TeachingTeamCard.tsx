import { useState } from "react";
import {
  Users,
  UserPlus,
  Pencil,
  Check,
  X,
  Trash2,
  LogOut,
  Clock,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TeachingTeam, TeachingTeamMemberWithProfile } from "@/constants/contracts";

interface TeachingTeamCardProps {
  team: TeachingTeam | null;
  members: TeachingTeamMemberWithProfile[];
  isLeadTeacher: boolean;
  isMember: boolean;
  maxMembers: number;
  loading: boolean;
  // Lead Teacher actions
  onCreateTeam: (name: string) => Promise<{ error: any }>;
  onRenameTeam: (name: string) => Promise<void>;
  onInviteMember: (email: string) => Promise<{ error: boolean; message: string }>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onDisbandTeam: () => Promise<void>;
  // Member actions
  onLeaveTeam: () => Promise<void>;
}

/**
 * Phase 27: Teaching Team Card
 *
 * Three states:
 * 1. No team — "Start a Teaching Team" prompt with create form
 * 2. Lead Teacher — Team management: rename, invite, remove, disband
 * 3. Member — View team, option to leave
 *
 * Collapsible card on the Dashboard.
 */
export function TeachingTeamCard({
  team,
  members,
  isLeadTeacher,
  isMember,
  maxMembers,
  loading,
  onCreateTeam,
  onRenameTeam,
  onInviteMember,
  onRemoveMember,
  onDisbandTeam,
  onLeaveTeam,
}: TeachingTeamCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  // Invite state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ error: boolean; text: string } | null>(null);

  // Rename state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");

  if (loading) return null;

  // ── Handlers ────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    setCreating(true);
    const result = await onCreateTeam(teamName.trim());
    setCreating(false);
    if (!result.error) {
      setShowCreateForm(false);
      setTeamName("");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMessage(null);
    const result = await onInviteMember(inviteEmail.trim());
    setInviting(false);
    if (result.error) {
      setInviteMessage({ error: true, text: result.message });
    } else {
      setInviteEmail("");
      setShowInviteForm(false);
      setInviteMessage(null);
    }
  };

  const handleStartRename = () => {
    setEditName(team?.name || "");
    setEditing(true);
  };

  const handleSaveRename = async () => {
    if (!editName.trim() || editName.trim() === team?.name) {
      setEditing(false);
      return;
    }
    await onRenameTeam(editName.trim());
    setEditing(false);
  };

  const handleCancelRename = () => {
    setEditing(false);
    setEditName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") action();
    if (e.key === "Escape") {
      setEditing(false);
      setShowCreateForm(false);
      setShowInviteForm(false);
    }
  };

  const acceptedOrPending = members.filter(m => m.status === "accepted" || m.status === "pending");
  const teamFull = acceptedOrPending.length >= maxMembers;

  // ── STATE 1: No Team ──────────────────────────────────────────────

  if (!team) {
    return (
      <Card className="mb-6 border-dashed border-2 border-muted-foreground/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Start a Teaching Team</CardTitle>
              <p className="text-sm text-muted-foreground">
                Share lessons with up to {maxMembers} fellow teachers
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!showCreateForm ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Users className="h-4 w-4 mr-2" />
              Create Teaching Team
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Team name (e.g., Adult Bible Study Team)"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleCreate)}
                autoFocus
                className="flex-1"
                maxLength={60}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  disabled={!teamName.trim() || creating}
                  size="sm"
                >
                  {creating ? "Creating..." : "Create"}
                </Button>
                <Button
                  onClick={() => { setShowCreateForm(false); setTeamName(""); }}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── STATE 2 & 3: Has Team (Lead or Member) ────────────────────────

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 shrink-0">
              <Users className="h-5 w-5 text-blue-600" />
            </div>

            {/* Team Name — editable by lead */}
            {editing && isLeadTeacher ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleSaveRename)}
                  autoFocus
                  className="text-lg font-semibold h-9 max-w-xs"
                  maxLength={60}
                />
                <Button onClick={handleSaveRename} variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button onClick={handleCancelRename} variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <CardTitle className="text-lg truncate">{team.name}</CardTitle>
                {isLeadTeacher && (
                  <Button onClick={handleStartRename} variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Collapse toggle */}
          <Button
            onClick={() => setCollapsed(!collapsed)}
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 ml-2"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {/* Role badge */}
        <p className="text-sm text-muted-foreground ml-12">
          {isLeadTeacher ? "You are the Lead Teacher" : "You are a team member"}
          {" · "}
          {acceptedOrPending.filter(m => m.status === "accepted").length + 1} member{acceptedOrPending.filter(m => m.status === "accepted").length + 1 !== 1 ? "s" : ""}
        </p>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-4">
          {/* ── Members List ────────────────────────────────────── */}
          <div className="space-y-2">
            {acceptedOrPending.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {member.status === "accepted" ? (
                    <UserCheck className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">
                    {member.display_name || member.email || "Unknown"}
                  </span>
                  {member.status === "pending" && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                      Pending
                    </span>
                  )}
                </div>
                {isLeadTeacher && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {member.display_name || "This teacher"} will be removed from your Teaching Team.
                          They will no longer see your team's shared lessons.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onRemoveMember(member.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}

            {acceptedOrPending.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-2">
                No team members yet. Invite fellow teachers to get started!
              </p>
            )}
          </div>

          {/* ── Invite Form (Lead Teacher only) ─────────────────── */}
          {isLeadTeacher && !teamFull && (
            <div>
              {!showInviteForm ? (
                <Button
                  onClick={() => { setShowInviteForm(true); setInviteMessage(null); }}
                  variant="outline"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Teacher ({acceptedOrPending.length}/{maxMembers})
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Teacher's email address"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => { setInviteEmail(e.target.value); setInviteMessage(null); }}
                      onKeyDown={(e) => handleKeyDown(e, handleInvite)}
                      autoFocus
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleInvite}
                        disabled={!inviteEmail.trim() || inviting}
                        size="sm"
                      >
                        {inviting ? "Sending..." : "Send Invite"}
                      </Button>
                      <Button
                        onClick={() => { setShowInviteForm(false); setInviteEmail(""); setInviteMessage(null); }}
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  {inviteMessage && (
                    <p className={`text-sm ${inviteMessage.error ? "text-red-600" : "text-green-600"}`}>
                      {inviteMessage.text}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {isLeadTeacher && teamFull && (
            <p className="text-sm text-muted-foreground">
              Team is full ({maxMembers} members maximum)
            </p>
          )}

          {/* ── Action Buttons ──────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {/* Lead Teacher: Disband */}
            {isLeadTeacher && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Disband Team
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disband Teaching Team?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently disband "{team.name}" and remove all members.
                      Team members will no longer see each other's shared lessons through this team.
                      This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDisbandTeam}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Disband Team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Member: Leave Team */}
            {isMember && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <LogOut className="h-4 w-4 mr-1" />
                    Leave Team
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Teaching Team?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will leave "{team.name}" and will no longer see shared lessons
                      from your team members. You can join or create a new team later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onLeaveTeam}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Leave Team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
