import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Shield, Users } from "lucide-react";

export function BaptistIdentitySection() {
  return (
    <section className="py-8 sm:py-12 lg:py-12 bg-muted/30">
      <div className="container px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold px-2">
            Built for <span className="gradient-text">Baptist Churches</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
            We understand Baptist theology, traditions, and the unique needs of your ministry. 
            BibleLessonSpark is designed by Baptists, for Baptists.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
          <Card className="text-center bg-gradient-card border-border/50">
            <CardHeader className="p-4 sm:p-6">
              <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-primary flex items-center justify-center mb-3 sm:mb-4">
                <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg mb-2">Baptist Heritage</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Respects Baptist autonomy, theology, and traditional practices while embracing helpful technology.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center bg-gradient-card border-border/50">
            <CardHeader className="p-4 sm:p-6">
              <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-secondary flex items-center justify-center mb-3 sm:mb-4">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg mb-2">Doctrinally Sound</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Choose your theological lens and be confident your lesson reflects the sound doctrine of your congregation.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center bg-gradient-card border-border/50">
            <CardHeader className="p-4 sm:p-6">
              <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-primary flex items-center justify-center mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg mb-2">Community Focused</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Built with input from Baptist teachers and pastors who understand your daily ministry challenges.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
}
