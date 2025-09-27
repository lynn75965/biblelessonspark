import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { Loader2, Building, Users } from "lucide-react";

interface OrganizationSetupProps {
  open: boolean;
  onComplete: () => void;
}

const ORGANIZATION_TYPES = [
  { value: "church", label: "Church" },
  { value: "ministry", label: "Ministry" },
  { value: "christian_school", label: "Christian School" },
  { value: "nonprofit", label: "Nonprofit Organization" },
  { value: "other", label: "Other" }
];

const DENOMINATIONS = [
  { value: "Baptist", label: "Baptist" },
  { value: "Methodist", label: "Methodist" },
  { value: "Presbyterian", label: "Presbyterian" },
  { value: "Lutheran", label: "Lutheran" },
  { value: "Pentecostal", label: "Pentecostal" },
  { value: "Episcopal", label: "Episcopal" },
  { value: "Catholic", label: "Catholic" },
  { value: "Non-denominational", label: "Non-denominational" },
  { value: "Other", label: "Other" }
];

const DOCTRINE_OPTIONS = [
  { value: "SBC", label: "Southern Baptist Convention" },
  { value: "Reformed Baptist", label: "Reformed Baptist" },
  { value: "Independent Baptist", label: "Independent Baptist" },
  { value: "Methodist", label: "Methodist" },
  { value: "Presbyterian", label: "Presbyterian" },
  { value: "Lutheran", label: "Lutheran" },
  { value: "Pentecostal", label: "Pentecostal" },
  { value: "Non-denominational", label: "Non-denominational" }
];


export function OrganizationSetup({ open, onComplete }: OrganizationSetupProps) {
  const [activeTab, setActiveTab] = useState("create");
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const { toast } = useToast();
  const { createOrganization, joinOrganization } = useOrganization();

  const [formData, setFormData] = useState({
    name: "",
    organization_type: "church",
    denomination: "Baptist",
    default_doctrine: "SBC",
    description: "",
    website: "",
    address: "",
    phone: "",
    email: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateOrganization = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createOrganization(formData);
      toast({
        title: "Success",
        description: "Organization created successfully!",
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create organization.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrganization = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Organization ID is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await joinOrganization(joinCode);
      toast({
        title: "Success",
        description: "Successfully joined organization!",
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join organization.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Setup Your Organization</DialogTitle>
          <DialogDescription>
            Create a new organization or join an existing one to get started with LessonSpark.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Create Organization
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Join Organization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., First Baptist Church"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Organization Type</Label>
                  <Select value={formData.organization_type} onValueChange={(value) => handleInputChange("organization_type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORGANIZATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="denomination">Denomination</Label>
                  <Select value={formData.denomination} onValueChange={(value) => handleInputChange("denomination", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DENOMINATIONS.map((denom) => (
                        <SelectItem key={denom.value} value={denom.value}>
                          {denom.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="doctrine">Default Doctrine</Label>
                  <Select value={formData.default_doctrine} onValueChange={(value) => handleInputChange("default_doctrine", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCTRINE_OPTIONS.map((doctrine) => (
                        <SelectItem key={doctrine.value} value={doctrine.value}>
                          {doctrine.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of your organization..."
                  rows={3}
                />
              </div>
            </div>

            <Button onClick={handleCreateOrganization} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
          </TabsContent>

          <TabsContent value="join" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="joinCode">Organization ID</Label>
                <Input
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter organization ID to join"
                />
                <p className="text-sm text-muted-foreground">
                  Ask your organization administrator for the organization ID.
                </p>
              </div>
            </div>

            <Button onClick={handleJoinOrganization} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join Organization
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}