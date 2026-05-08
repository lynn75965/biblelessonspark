import { useEffect, useState } from "react";

const PAGE_TITLE = "Lesson Shapes Guide | BibleLessonSpark";
const META_DESCRIPTION =
  "Five distinct lesson shapes for Bible teachers -- Passage Walk-Through, Life Connection, Gospel-Centered, Focus-Discover-Respond, and Story-Driven. See each shape transform the same passage so you can choose the format that fits how your group learns.";

type ShapeKey = 1 | 2 | 3 | 4 | 5;
type TabState = "shaped" | "base";

function setMetaDescription(content: string) {
  let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", "description");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

const LessonShapesGuide = () => {
  const [activeTab, setActiveTab] = useState<Record<ShapeKey, TabState>>({
    1: "shaped",
    2: "shaped",
    3: "shaped",
    4: "shaped",
    5: "shaped",
  });

  const toggleTab = (shapeKey: ShapeKey, tab: TabState) => {
    setActiveTab((prev) => ({ ...prev, [shapeKey]: tab }));
  };

  useEffect(() => {
    const previousTitle = document.title;
    const previousDescTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const previousDesc = previousDescTag ? previousDescTag.getAttribute("content") : null;

    document.title = PAGE_TITLE;
    setMetaDescription(META_DESCRIPTION);

    return () => {
      document.title = previousTitle;
      if (previousDesc !== null) {
        setMetaDescription(previousDesc);
      }
    };
  }, []);

  return (
    <div id="top" className="min-h-screen bg-background">
      <main
        className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16"
        aria-labelledby="lesson-shapes-title"
      >
        <header className="mb-12 text-center">
          <h1 id="lesson-shapes-title" className="mb-4 text-4xl font-bold text-primary md:text-5xl">Five Ways to Shape a Lesson</h1>
          <p className="mx-auto max-w-3xl font-ui text-lg text-muted-foreground">
            Five distinct teaching formats. One body of vetted theological content. Pick the shape that fits how your group learns &#8212; the lesson reorganizes itself around them.
          </p>
        </header>

        <nav aria-label="Lesson Shapes Navigation" className="mb-12 flex flex-wrap justify-center gap-2 md:gap-3">
          <a href="#shape-1" className="rounded-full border border-border bg-card px-4 py-2 font-ui text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary">1. Passage Walk-Through</a>
          <a href="#shape-2" className="rounded-full border border-border bg-card px-4 py-2 font-ui text-sm font-medium text-foreground transition-colors hover:border-secondary hover:text-secondary">2. Life Connection</a>
          <a href="#shape-3" className="rounded-full border border-border bg-card px-4 py-2 font-ui text-sm font-medium text-foreground transition-colors hover:border-destructive hover:text-destructive">3. Gospel-Centered</a>
          <a href="#shape-4" className="rounded-full border border-border bg-card px-4 py-2 font-ui text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary">4. Focus-Discover-Respond</a>
          <a href="#shape-5" className="rounded-full border border-border bg-card px-4 py-2 font-ui text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent">5. Story-Driven</a>
        </nav>

        {/* SHAPE 1 */}
        <section id="shape-1" className="mb-16 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
          <div className="flex flex-col gap-6 border-b border-border p-6 md:flex-row md:items-start md:p-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-ui text-2xl font-bold text-white">1</div>
            <div>
              <h2 className="mb-1 text-2xl font-bold text-primary">Passage Walk-Through</h2>
              <p className="font-ui text-sm italic text-muted-foreground">Verse-by-verse guided study through the text</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 border-b border-border bg-muted/30 p-6 font-ui md:grid-cols-4 md:p-8">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Teaching Movement</div>
              <div className="text-sm font-medium text-foreground">Sequential &#8594; Cumulative</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Best For</div>
              <div className="text-sm font-medium text-foreground">Adult classes, inductive Bible study groups</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Teacher Posture</div>
              <div className="text-sm font-medium text-foreground">Guide and expositor</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Primary Skill</div>
              <div className="text-sm font-medium text-foreground">Observation &#8594; Interpretation &#8594; Application</div>
            </div>
          </div>

          <div className="border-b border-border p-6 md:p-8">
            <p className="font-ui leading-relaxed text-muted-foreground">
              The Passage Walk-Through moves sequentially through the Scripture text, pausing at each meaningful unit to explain historical context, define key terms, and draw out theological meaning. The teacher functions as an expositor and guide, leading the class through the text rather than around it. This shape builds cumulative understanding: each verse or section prepares the student for the next, so the final application lands with the full weight of everything that preceded it.
            </p>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-5 flex items-center gap-2 font-ui text-xs font-bold uppercase tracking-widest text-muted-foreground after:h-px after:flex-1 after:bg-border">
              Transformation Example &#8212; Luke 10:25&#8211;37
            </div>
            
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex border-b border-border bg-muted/30">
                <button 
                  onClick={() => toggleTab(1, 'shaped')}
                  aria-pressed={activeTab[1] === 'shaped'}
                  className={`px-6 py-3 font-ui text-sm font-semibold transition-colors ${activeTab[1] === 'shaped' ? 'border-b-2 border-primary bg-card text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Shaped Lesson
                </button>
                <button 
                  onClick={() => toggleTab(1, 'base')}
                  aria-pressed={activeTab[1] === 'base'}
                  className={`px-6 py-3 font-ui text-sm font-semibold transition-colors ${activeTab[1] === 'base' ? 'border-b-2 border-secondary bg-card text-secondary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Base Lesson (Before)
                </button>
              </div>
              
              <div className="p-6 md:p-8">
                {activeTab[1] === 'shaped' ? (
                  <div className="space-y-6">
                    <div className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 font-ui text-xs font-bold uppercase tracking-widest text-primary">Opening</div>
                    <p className="font-ui text-muted-foreground">"Open your Bibles to Luke 10, verse 25. We are going to walk through this passage together, unit by unit, and let the text speak for itself."</p>
                    <div className="mt-6 rounded-lg border-l-4 border-primary bg-muted/30 p-4">
                      <div className="mb-2 font-ui text-xs font-bold uppercase tracking-widest text-primary">vv. 25&#8211;28 &#8212; The Lawyer's Test</div>
                      <p className="font-ui text-sm text-muted-foreground">The lawyer's question ("What must I do to inherit eternal life?") was not sincere inquiry &#8212; it was a legal challenge designed to expose a flaw in Jesus' teaching. Jesus turns it back on him. The lawyer's own answer &#8212; love God and love neighbor &#8212; is correct. Jesus affirms it: "Do this and you will live." The tension is not doctrinal; it is practical. The lawyer knows the right answer. The question is whether he is living it.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 rounded-lg bg-secondary/5 p-6">
                    <div className="mb-2 inline-block rounded-full bg-secondary/20 px-3 py-1 font-ui text-xs font-bold uppercase tracking-widest text-secondary">Standard Introduction</div>
                    <p className="font-ui text-muted-foreground">Today we are looking at the Parable of the Good Samaritan in Luke 10. This is one of Jesus' most famous parables, told in response to a lawyer who wanted to know how to inherit eternal life and who exactly qualified as his neighbor.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SHAPE 2 */}
        <section id="shape-2" className="mb-16 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
          <div className="flex flex-col items-center justify-between gap-6 border-b border-border p-6 md:flex-row md:p-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary font-ui text-2xl font-bold text-white">2</div>
            <div>
              <h2 className="mb-1 text-2xl font-bold text-secondary">Life Connection</h2>
              <p className="font-ui text-sm italic text-muted-foreground">Real-life tension &#8212; and how Scripture speaks to it</p>
            </div>
            <a href="#top" className="ml-auto inline-flex items-center gap-1.5 font-ui text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>
              <span>Back To Top</span>
            </a>
          </div>
          
          <div className="grid grid-cols-1 gap-4 border-b border-border bg-muted/30 p-6 font-ui md:grid-cols-4 md:p-8">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Teaching Movement</div>
              <div className="text-sm font-medium text-foreground">Life &#8594; Scripture &#8594; Response</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Best For</div>
              <div className="text-sm font-medium text-foreground">Working adults, mid-life classes, life-stage groups</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Teacher Posture</div>
              <div className="text-sm font-medium text-foreground">Pastor and counselor</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Primary Skill</div>
              <div className="text-sm font-medium text-foreground">Naming tension &#8594; Hearing God &#8594; Walking it out</div>
            </div>
          </div>

          <div className="border-b border-border p-6 md:p-8">
            <p className="font-ui leading-relaxed text-muted-foreground">
              Life Connection opens with a vivid real-life situation &#8212; the kind of Monday-morning tension a teacher's class will recognize from their own week &#8212; and then introduces Scripture as God's voice speaking directly into that reality. Theological depth is woven into the why-this-matters explanation rather than presented as separate background. The lesson lands on concrete, named next steps the class can take this week.
            </p>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-5 flex items-center gap-2 font-ui text-xs font-bold uppercase tracking-widest text-muted-foreground after:h-px after:flex-1 after:bg-border">
              Transformation Example &#8212; Luke 10:25&#8211;37
            </div>
            
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex border-b border-border bg-muted/30">
                <button 
                  onClick={() => toggleTab(2, 'shaped')}
                  aria-pressed={activeTab[2] === 'shaped'}
                  className={`px-6 py-3 font-ui text-sm font-semibold transition-colors ${activeTab[2] === 'shaped' ? 'border-b-2 border-secondary bg-card text-secondary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Shaped Lesson
                </button>
                <button 
                  onClick={() => toggleTab(2, 'base')}
                  aria-pressed={activeTab[2] === 'base'}
                  className={`px-6 py-3 font-ui text-sm font-semibold transition-colors ${activeTab[2] === 'base' ? 'border-b-2 border-muted-foreground bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Base Lesson (Before)
                </button>
              </div>
              
              <div className="p-6 md:p-8">
                {activeTab[2] === 'shaped' ? (
                  <div className="space-y-6">
                    <div className="mb-2 inline-block rounded-full bg-secondary/10 px-3 py-1 font-ui text-xs font-bold uppercase tracking-widest text-secondary">Real-Life Hook</div>
                    <p className="font-ui text-muted-foreground">"Imagine you are driving home from work. Up ahead, someone's car is pulled onto the shoulder, hood up, hazards blinking. You glance at the clock. You glance at the gas gauge. You glance at the lock button on your door. &#8212; What do you do?"</p>
                    <div className="mt-6 rounded-lg border-l-4 border-secondary bg-muted/30 p-4">
                      <div className="mb-2 font-ui text-xs font-bold uppercase tracking-widest text-secondary">Where Scripture Meets the Highway</div>
                      <p className="font-ui text-sm text-muted-foreground">A lawyer asked Jesus a clean theological question and tried to draw a clean theological line. Jesus refused to draw it. Instead, He told a story &#8212; a road, a body in a ditch, two religious men walking past, an outsider stopping. The point is not to define neighbor more carefully. The point is to make us into the kind of person who stops. Scripture meets us where we already live: at the moment of seeing someone who needs help and deciding what kind of person we are going to be.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 rounded-lg bg-muted/40 p-6">
                    <div className="mb-2 inline-block rounded-full bg-muted px-3 py-1 font-ui text-xs font-bold uppercase tracking-widest text-foreground">Standard Introduction</div>
                    <p className="font-ui text-muted-foreground">Today we are looking at the Parable of the Good Samaritan in Luke 10. This is one of Jesus' most famous parables, told in response to a lawyer who wanted to know how to inherit eternal life and who exactly qualified as his neighbor.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SHAPE 3 */}
        <section id="shape-3" className="mb-16 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
          <div className="flex flex-col items-center justify-between gap-6 border-b border-border p-6 md:flex-row md:p-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive font-ui text-2xl font-bold text-white">3</div>
            <div>
              <h2 className="mb-1 text-2xl font-bold text-destructive">Gospel-Centered</h2>
              <p className="font-ui text-sm italic text-muted-foreground">Every story points to Jesus</p>
            </div>
            <a href="#top" className="ml-auto inline-flex items-center gap-1.5 font-ui text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>
              <span>Back To Top</span>
            </a>
          </div>
          
          <div className="grid grid-cols-1 gap-4 border-b border-border bg-muted/30 p-6 font-ui md:grid-cols-4 md:p-8">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Teaching Movement</div>
              <div className="text-sm font-medium text-foreground">Creation &#8594; Fall &#8594; Redemption &#8594; Restoration</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Best For</div>
              <div className="text-sm font-medium text-foreground">Discipleship classes, mixed-age groups, gospel-rooted study</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Teacher Posture</div>
              <div className="text-sm font-medium text-foreground">Herald of the gospel</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Primary Skill</div>
              <div className="text-sm font-medium text-foreground">Locating Christ in every text</div>
            </div>
          </div>

          <div className="border-b border-border p-6 md:p-8">
            <p className="font-ui leading-relaxed text-muted-foreground">
              Gospel-Centered locates the passage within the overarching story of Scripture &#8212; Creation, Fall, Redemption, Restoration &#8212; and explicitly connects every teaching point to Christ. Whether the text points forward to Him, is fulfilled in Him, or flows from His finished work, the lesson refuses to leave the gospel implicit. The teacher's transcript makes those connections overt rather than hoping the class will draw them later on their own.
            </p>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-5 flex items-center gap-2 font-ui text-xs font-bold uppercase tracking-widest text-muted-foreground after:h-px after:flex-1 after:bg-border">
              Transformation Example &#8212; Luke 10:25&#8211;37
            </div>
            
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex border-b border-border bg-muted/30">
                <button 
                  onClick={() => toggleTab(3, 'shaped')}
                  aria-pressed={activeTab[3] === 'shaped'}
                  className={`px-6 py-3 font-ui text-sm font-semibold transition-colors ${activeTab[3] === 'shaped' ? 'border-b-2 border-destructive bg-card text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Shaped Lesson
                </button>
                <button 
                  onClick={() => toggleTab(3, 'base')}
                  aria-pressed={activeTab[3] === 'base'}
                  className={`px-6 py-3 font-ui text-sm font-semibold transition-colors ${activeTab[3] === 'base' ? 'border-b-2 border-muted-foreground bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Base Lesson (Before)
                </button>
              </div>
              
              <div className="p-6 md:p-8">
                {activeTab[3] === 'shaped' ? (
                  <div className="space-y-6">
                    <div className="mb-2 inline-block rounded-full bg-destructive/10 px-3 py-1 font-ui text-xs font-bold uppercase tracking-widest text-destructive">Big Picture</div>
                    <p className="font-ui text-muted-foreground">"The Parable of the Good Samaritan is not, first of all, a moral lesson about kindness. It is a window into the gospel itself."</p>
                    <div className="mt-6 rounded-lg border-l-4 border-destructive bg-muted/30 p-4">
                      <div className="mb-2 font-ui text-xs font-bold uppercase tracking-widest text-destructive">Creation &#8594; Fall &#8594; Redemption &#8594; Restoration</div>
                      <p className="font-ui text-sm text-muted-foreground"><span className="font-semibold text-foreground">Creation:</span> We were made to love God and love neighbor &#8212; the lawyer's own answer is right. <span className="font-semibold text-foreground">Fall:</span> But we cannot do it. The priest and the Levite are not villains in a different story; they are us, every time we step around the wounded because helping is costly. <span className="font-semibold text-foreground">Redemption:</span> Jesus is the true Good Samaritan &#8212; the despised outsider who crossed every road to find us in our ditch and paid in His own blood to bind up our wounds. <span className="font-semibold text-foreground">Restoration:</span> Now, having been picked up off the road by Him, we go and do likewise &#8212; not to earn life, but because we have already received it.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 rounded-lg bg-muted/40 p-6">
                    <div className="mb-2 inline-block rounded-full bg-muted px-3 py-1 font-ui text-xs font-bold uppercase tracking-widest text-foreground">Standard Introduction</div>
                    <p className="font-ui text-muted-foreground">Today we are looking at the Parable of the Good Samaritan in Luke 10. This is one of Jesus' most famous parables, told in response to a lawyer who wanted to know how to inherit eternal life and who exactly qualified as his neighbor.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SHAPE 4 */}
        <section id="shape-4" className="mb-16 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
          <div className="flex flex-col items-center justify-between gap-6 border-b border-border p-6 md:flex-row md:p-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-ui text-2xl font-bold text-white">4</div>
            <div>
              <h2 className="mb-1 text-2xl font-bold text-primary">Focus-Discover-Respond</h2>
              <p className="font-ui text-sm italic text-muted-foreground">Three clean movements</p>
            </div>
            <a href="#top" className="ml-auto inline-flex items-center gap-1.5 font-ui text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>
              <span>Back To Top</span>
            </a>
          </div>
          
          <div className="grid grid-cols-1 gap-4 border-b border-border bg-muted/30 p-6 font-ui md:grid-cols-4 md:p-8">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Teaching Movement</div>
              <div className="text-sm font-medium text-foreground">Focus &#8594; Discover &#8594; Respond</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Best For</div>
              <div className="text-sm font-medium text-foreground">Children, preteens, time-constrained classes</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Teacher Posture</div>
              <div className="text-sm font-medium text-foreground">Trail guide</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Primary Skill</div>
              <div className="text-sm font-medium text-foreground">Hook &#8594; Study &#8594; Application</div>
            </div>
          </div>

          <div className="border-b border-border p-6 md:p-8">
            <p className="font-ui leading-relaxed text-muted-foreground">
              Focus-Discover-Respond presents the lesson in exactly three movements. Focus is the opening hook &#8212; a question, scenario, or activity that surfaces the topic. Discover is the core Bible study, carrying all the doctrinal weight. Respond is the application &#8212; what the class does with what they have learned. Three clean beats. No clutter. Especially well-suited to children, preteens, and structured curricula where the same rhythm every week becomes part of how the class learns.
            </p>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-5 flex items-center gap-2 font-ui text-xs font-bold uppercase tracking-widest text-muted-foreground after:h-px after:flex-1 after:bg-border">
              Transformation Example &#8212; Luke 10:25&#8211;37
            </div>
            
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex border-b border-border bg-muted/30">
                <button 
                  onClick={() => toggleTab(4, 'shaped')}
                  aria-pressed={activeTab[4] === 'shaped'}
                  className={`px-6 py-3 font-ui text-sm font-semibold transition-colors ${activeTab[4] === 'shaped' ? 'border-b-2 border-primary bg-card text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Shaped Lesson
                </button>
                <button 
                  onClick={() => toggleTab(4, 'base')}
                  aria-pressed={activeTab[4] === 'base'}
                  className={`px-6 py-3 font-ui text-sm font-semibold transition-colors ${activeTab[4] === 'base' ? 'border-b-2 border-muted-foreground bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Base Lesson (Before)
                </button>
              </div>
              
              <div className="p-6 md:p-8">
                {activeTab[4] === 'shaped' ? (
                  <div className="space-y-6">
                    <div className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 font-ui text-xs font-bold uppercase tracking-widest text-primary">Focus</div>
                    <p className="font-ui text-muted-foreground">"Think of a time someone went out of their way for you when they had no obligation to. Picture their face. Hold the image there. &#8212; That is where this lesson begins."</p>
                    <div className="mt-6 rounded-lg border-l-4 border-primary bg-muted/30 p-4">
                      <div className="mb-2 font-ui text-xs font-bold uppercase tracking-widest text-primary">Discover &#8594; Respond</div>
                      <p className="font-ui text-sm text-muted-foreground">Read vv. 30&#8211;35 aloud. Notice three things: who passes by, who stops, and what stopping costs. The priest and Levite have reasons not to help. The Samaritan has every reason not to help &#8212; and helps anyway, paying out of his own pocket and promising to come back. <span className="font-semibold text-foreground">Respond:</span> Who is in the ditch in your week? What would going to him actually cost you in time, comfort, or assumptions? Decide one specific step before you leave this room.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 rounded-lg bg-muted/40 p-6">
                    <div className="mb-2 inline-block rounded-full bg-muted px-3 py-1 font-ui text-xs font-bold uppercase tracking-widest text-foreground">Standard Introduction</div>
                    <p className="font-ui text-muted-foreground">Today we are looking at the Parable of the Good Samaritan in Luke 10. This is one of Jesus' most famous parables, told in response to a lawyer who wanted to know how to inherit eternal life and who exactly qualified as his neighbor.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SHAPE 5 */}
        <section id="shape-5" className="mb-16 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
          <div className="flex flex-col items-center justify-between gap-6 border-b border-border p-6 md:flex-row md:p-8">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent font-ui text-2xl font-bold text-accent-foreground">5</div>
            <div>
              <h2 className="mb-1 text-2xl font-bold text-accent">Story-Driven</h2>
              <p className="font-ui text-sm italic text-muted-foreground">Let me tell you a story</p>
            </div>
            <a href="#top" className="ml-auto inline-flex items-center gap-1.5 font-ui text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>
              <span>Back To Top</span>
            </a>
          </div>
          
          <div className="grid grid-cols-1 gap-4 border-b border-border bg-muted/30 p-6 font-ui md:grid-cols-4 md:p-8">
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Teaching Movement</div>
              <div className="text-sm font-medium text-foreground">Story &#8594; Truth &#8594; Response</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Best For</div>
              <div className="text-sm font-medium text-foreground">Preschool, elementary, narrative learners</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Teacher Posture</div>
              <div className="text-sm font-medium text-foreground">Storyteller</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Primary Skill</div>
              <div className="text-sm font-medium text-foreground">Immersion &#8594; Surfacing truth from narrative</div>
            </div>
          </div>

          <div className="border-b border-border p-6 md:p-8">
            <p className="font-ui leading-relaxed text-muted-foreground">
              Story-Driven removes section headings entirely. The lesson opens inside a story &#8212; either a vivid retelling of the biblical narrative or a modern parallel &#8212; and lets the class feel the scene before they analyze it. Teaching points emerge from the story rather than being declared as exposition. The teacher's transcript reads like preparation for a storyteller: vivid description, pacing cues, emotional beats, moments of silence.
            </p>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-5 flex items-center gap-2 font-ui text-xs font-bold uppercase tracking-widest text-muted-foreground after:h-px after:flex-1 after:bg-border">
              Transformation Example &#8212; Luke 10:25&#8211;37
            </div>
            
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex border-b border-border bg-muted/30">
                <button 
                  onClick={() => toggleTab(5, 'shaped')}
                  aria-pressed={activeTab[5] === 'shaped'}
                  className={`px-6 py-3 font-ui text-sm font-semibold transition-colors ${activeTab[5] === 'shaped' ? 'border-b-2 border-accent bg-card text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Shaped Lesson
                </button>
                <button 
                  onClick={() => toggleTab(5, 'base')}
                  aria-pressed={activeTab[5] === 'base'}
                  className={`px-6 py-3 font-ui text-sm font-semibold transition-colors ${activeTab[5] === 'base' ? 'border-b-2 border-muted-foreground bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Base Lesson (Before)
                </button>
              </div>
              
              <div className="p-6 md:p-8">
                {activeTab[5] === 'shaped' ? (
                  <div className="space-y-6">
                    <div className="mb-2 inline-block rounded-full bg-accent/20 px-3 py-1 font-ui text-xs font-bold uppercase tracking-widest text-accent">The Road</div>
                    <p className="font-ui text-muted-foreground">"The road from Jerusalem to Jericho dropped 3,300 feet in seventeen miles of switchbacks and blind corners. Travelers called it the Bloody Pass. Everyone knew the road's reputation. The man on it that morning knew it too &#8212; and went anyway."</p>
                    <div className="mt-6 rounded-lg border-l-4 border-accent bg-muted/30 p-4">
                      <div className="mb-2 font-ui text-xs font-bold uppercase tracking-widest text-accent">The Wrong Man Stops</div>
                      <p className="font-ui text-sm text-muted-foreground">He is found by the wrong man. Not the priest hurrying back from temple service. Not the Levite with his clean robes. A Samaritan &#8212; and to the lawyer hearing Jesus tell this, that word lands like a slap. The story does not pause to defend itself. It simply lets the Samaritan kneel, pour, lift, carry, pay. Then Jesus turns to the lawyer and asks the question that breaks the parable open: Which of these three was a neighbor to the man? The lawyer cannot even say the word Samaritan. He says, The one who showed mercy. Jesus says: Go, and do likewise.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 rounded-lg bg-muted/40 p-6">
                    <div className="mb-2 inline-block rounded-full bg-muted px-3 py-1 font-ui text-xs font-bold uppercase tracking-widest text-foreground">Standard Introduction</div>
                    <p className="font-ui text-muted-foreground">Today we are looking at the Parable of the Good Samaritan in Luke 10. This is one of Jesus' most famous parables, told in response to a lawyer who wanted to know how to inherit eternal life and who exactly qualified as his neighbor.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LessonShapesGuide;
