import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const DELETE_CONFIRM_TEXT = "DELETE";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed = confirmText === DELETE_CONFIRM_TEXT;

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setConfirmText("");
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      // Single privileged call: delete-own-account derives the caller's id
      // from their own JWT server-side and owns the full teardown (personal
      // data cleanup + the auth user delete). No client-side data delete
      // happens here -- the function is the sole writer for this flow.
      const { data, error } = await supabase.functions.invoke("delete-own-account", {
        body: {},
      });

      if (error || data?.error) {
        let errorMessage = "Failed to delete your account. Please try again.";

        if (error?.context) {
          // error.context is the Response object for non-2xx status codes.
          try {
            const responseBody = await error.context.json();
            errorMessage = responseBody.error || responseBody.message || errorMessage;
          } catch {
            errorMessage = error.message || errorMessage;
          }
        } else if (data?.error) {
          // 200 response carrying an error -> the function ran and rejected the request.
          errorMessage = data.error;
        } else if (error) {
          errorMessage = error.message || errorMessage;
        }

        console.error("Error deleting account:", error || data?.error);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
      });

      await supabase.auth.signOut();
      navigate(ROUTES.AUTH);
    } catch (error) {
      console.error("Delete account error:", error);
      toast({
        title: "Error",
        description: (error as { message?: string }).message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-6">Account Settings</h1>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-destructive/30 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-red-800 mb-2">What will be deleted:</h3>
              <ul className="list-disc list-inside text-destructive space-y-1">
                <li>Your account and login credentials</li>
                <li>All generated Bible study lessons</li>
                <li>Your preferences and settings</li>
                <li>Your usage history</li>
              </ul>
            </div>

            <AlertDialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  aria-disabled={isDeleting}
                  onClick={(e) => {
                    if (isDeleting) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete My Account"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers, including all generated lessons.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2">
                  <Label htmlFor="delete-confirm-input">
                    Type DELETE to permanently remove your account.
                  </Label>
                  <Input
                    id="delete-confirm-input"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                    aria-label="Type DELETE to permanently remove your account"
                  />
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      if (!isConfirmed || isDeleting) {
                        e.preventDefault();
                        return;
                      }
                      handleDeleteAccount();
                    }}
                    aria-disabled={!isConfirmed || isDeleting}
                    aria-label={
                      isConfirmed
                        ? "Yes, delete my account"
                        : "Yes, delete my account, disabled until DELETE is typed above"
                    }
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
