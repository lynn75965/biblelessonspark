import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const BetaSignup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    churchName: "",
    teachingExperience: "",
    ageGroup: "",
    theologyProfile: "",
    techComfort: "",
    referral: "",
    agreedToTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreedToTerms) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the beta testing terms to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to join the beta program.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Insert beta tester record
      const { error } = await supabase
        .from("beta_testers")
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          church_name: formData.churchName,
          teaching_experience: formData.teachingExperience,
          age_group_taught: formData.ageGroup,
          status: "active",
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Registered",
            description: "You're already part of the beta program!",
          });
          navigate("/dashboard");
          return;
        }
        throw error;
      }

      toast({
        title: "Welcome to the Beta Program! ??",
        description: "Thank you for joining. Check your email for next steps.",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Beta signup error:", error);
      toast({
        title: "Signup Failed",
        description: "There was an error joining the beta program. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-900">
              Join the LessonSparkUSA Beta Program
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Help shape the future of Baptist Bible study lesson creation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Church Name */}
              <div className="space-y-2">
                <Label htmlFor="churchName">Church Name & Location *</Label>
                <Input
                  id="churchName"
                  value={formData.churchName}
                  onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
                  placeholder="First Baptist Church, Dallas, TX"
                  required
                />
              </div>

              {/* Teaching Experience */}
              <div className="space-y-2">
                <Label htmlFor="teachingExperience">Teaching Experience *</Label>
                <Textarea
                  id="teachingExperience"
                  value={formData.teachingExperience}
                  onChange={(e) => setFormData({ ...formData, teachingExperience: e.target.value })}
                  placeholder="How long have you been teaching Bible studies? What age groups?"
                  required
                  rows={3}
                />
              </div>

              {/* Age Group */}
              <div className="space-y-2">
                <Label htmlFor="ageGroup">Current Age Group You Teach *</Label>
                <Select
                  value={formData.ageGroup}
                  onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preschool">Preschool (Ages 2-5)</SelectItem>
                    <SelectItem value="children">Children (Grades 1-5)</SelectItem>
                    <SelectItem value="youth">Youth (Grades 6-12)</SelectItem>
                    <SelectItem value="college">College/Young Adult</SelectItem>
                    <SelectItem value="adult">Adult</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theology Profile */}
              <div className="space-y-2">
                <Label htmlFor="theologyProfile">Theological Perspective *</Label>
                <Select
                  value={formData.theologyProfile}
                  onValueChange={(value) => setFormData({ ...formData, theologyProfile: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theological perspective" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sbc_1963">Southern Baptist Convention (SBC BF&M 1963)</SelectItem>
                    <SelectItem value="sbc_2000">Southern Baptist Convention (SBC BF&M 2000)</SelectItem>
                    <SelectItem value="reformed">Reformed Baptist</SelectItem>
                    <SelectItem value="independent">Independent Baptist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tech Comfort */}
              <div className="space-y-2">
                <Label htmlFor="techComfort">Tech Comfort Level *</Label>
                <Select
                  value={formData.techComfort}
                  onValueChange={(value) => setFormData({ ...formData, techComfort: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select comfort level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very">Very comfortable - I'm tech-savvy</SelectItem>
                    <SelectItem value="comfortable">Comfortable - I use apps regularly</SelectItem>
                    <SelectItem value="somewhat">Somewhat comfortable - I can figure things out</SelectItem>
                    <SelectItem value="not-very">Not very comfortable - I prefer simple tools</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Referral (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="referral">Who Invited You? (Optional)</Label>
                <Input
                  id="referral"
                  value={formData.referral}
                  onChange={(e) => setFormData({ ...formData, referral: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              {/* Agreement Checkbox */}
              <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.agreedToTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, agreedToTerms: checked as boolean })
                    }
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    I understand and agree to:
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>Generate 3-5 lessons over the next 3-4 weeks</li>
                      <li>Provide honest feedback</li>
                      <li>Join the private Facebook group</li>
                      <li>Participate in one follow-up conversation</li>
                    </ul>
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Joining..." : "Join Beta Program"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Questions? Contact Lynn Eckeberger at</p>
              <p className="font-semibold">
                <a href="mailto:lynn@lessonsparkusa.com" className="text-blue-600 hover:underline">
                  lynn@lessonsparkusa.com
                </a>
                {" "}| 214.893.5179
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BetaSignup;

