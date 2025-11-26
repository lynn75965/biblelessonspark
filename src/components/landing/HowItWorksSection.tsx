import { Upload, Sparkles, FileText } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "1",
      icon: <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-white" />,
      title: "Upload Your Lesson",
      description: "Start with any curriculum you've already purchased. LifeWay, Gospel Project, or any Baptist study material."
    },
    {
      number: "2", 
      icon: <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />,
      title: "Customize for Your Class",
      description: "Select your age group, theological lens, and teaching style. Our AI tailors everything to your specific needs."
    },
    {
      number: "3",
      icon: <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />,
      title: "Teach with Confidence",
      description: "Get a complete, print-ready lesson with activities, discussion questions, and applications in under 8 minutes."
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold px-2">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Transform your lesson prep in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              {/* Connector line - hidden on mobile, shown on md+ */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/40 to-primary/10" />
              )}
              
              {/* Step number badge */}
              <div className="relative inline-block mb-4 sm:mb-5">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                  {step.icon}
                </div>
                <div className="absolute -top-1 -right-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-secondary text-white text-sm sm:text-base font-bold flex items-center justify-center shadow-md">
                  {step.number}
                </div>
              </div>
              
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                {step.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
