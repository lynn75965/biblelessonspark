import { Upload, Sparkles, FileText } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      number: "STEP 1",
      icon: <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-white" />,
      title: "Upload Your Lesson",
      description: (
        <>
          Start with any <strong>curriculum</strong> onhand <strong>OR</strong> simply provide a <strong>scripture or theme</strong> you plan to teach your class.
        </>
      )
    },
    {
      number: "STEP 2", 
      icon: <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />,
      title: "Customize for Your Class",
      description: (
        <>
          Select specific descriptions of your teaching style and your class members -- <strong>the way you teach, the way they learn.</strong>
        </>
      )
    },
    {
      number: "STEP 3",
      icon: <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />,
      title: "Teach with Confidence",
      description: (
        <>
          Download your print-ready complete teaching <strong>transcript</strong>, teaching <strong>plan</strong> and student <strong>handout</strong> in less than <strong>80 seconds</strong>.
        </>
      )
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4 mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold px-2">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-primary font-bold max-w-2xl mx-auto px-4">
            In Less Than 7 Minutes Compose A Bible Study By The Way You Teach, What You Teach, To Whom You Teach
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              {/* Connector line - hidden on mobile, shown on md+ */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/40 to-primary/10" />
              )}
              
              {/* Step badge above icon */}
              <div className="inline-flex flex-col items-center gap-3 mb-4 sm:mb-5">
                <div className="px-4 py-1.5 rounded-full bg-secondary text-white text-xs sm:text-sm font-bold shadow-md">
                  {step.number}
                </div>
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                  {step.icon}
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
