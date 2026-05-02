import { useEffect } from "react";
import { BRANDING } from "@/config/branding";

const PAGE_TITLE = "2026 Church Plant Teaching Capacity Report | BibleLessonSpark";
const META_DESCRIPTION =
  "A literature-based ministry analysis examining volunteer readiness, multi-age Bible teaching challenges, and teaching capacity needs in church plants.";

function setMetaDescription(content: string) {
  let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", "description");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export default function ChurchPlantReport() {
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
    <div className={BRANDING.layout.legalPageWrapper}>
      <main
        className={BRANDING.layout.legalPageCard}
        aria-labelledby="report-title"
      >
        <article>
          <header className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Report Type: Literature-Based Ministry Analysis
            </p>
            <h1
              id="report-title"
              className="text-3xl sm:text-4xl font-bold text-foreground mb-3"
            >
              2026 Church Plant Teaching Capacity Report
            </h1>
            <p className="text-lg sm:text-xl text-foreground/80 mb-4">
              Volunteer Readiness and Multi-Age Instruction Challenges
            </p>
            <p className="italic text-sm text-muted-foreground border-l-4 border-amber-400 bg-amber-50 px-4 py-3 rounded">
              This report is a literature-based ministry analysis and does not claim original survey data.
            </p>
          </header>

          <div className="prose prose-blue max-w-none space-y-8">
            <section aria-labelledby="executive-summary">
              <h2
                id="executive-summary"
                className="text-xl sm:text-2xl font-semibold text-foreground mb-3"
              >
                Executive Summary
              </h2>
              <p className="text-foreground mb-3">
                Church planting efforts across the United States continue to emphasize preaching, evangelism, and congregational development. However, a consistent operational challenge emerges in early-stage churches: equipping volunteer teachers to provide structured, Scripture-centered instruction across multiple age groups.
              </p>
              <p className="text-foreground">
                This report analyzes published research and ministry findings to identify patterns affecting volunteer readiness, teaching consistency, and the sustainability of instructional roles within church plants. The findings indicate that while volunteer engagement remains strong, gaps in preparation, clarity, and teaching resources can create strain for both church planters and ministry teams.
              </p>
            </section>

            <section aria-labelledby="introduction">
              <h2
                id="introduction"
                className="text-xl sm:text-2xl font-semibold text-foreground mb-3"
              >
                Introduction
              </h2>
              <p className="text-foreground mb-3">
                New church plants are often launched with limited staff and high ministry demands. In this environment, responsibility for teaching typically extends beyond the pastor to include volunteer leaders, particularly in children's and student ministries.
              </p>
              <p className="text-foreground">
                While volunteers are essential to the functioning of early-stage churches, research suggests that many enter teaching roles without sufficient preparation, structure, or ongoing support. This creates variability in instructional quality and increases pressure on church planters to oversee multiple areas simultaneously.
              </p>
            </section>

            <section aria-labelledby="methodology">
              <h2
                id="methodology"
                className="text-xl sm:text-2xl font-semibold text-foreground mb-3"
              >
                Methodology
              </h2>
              <p className="text-foreground mb-3">
                This report is based on a synthesis of publicly available research and ministry insights published between 2015 and 2024. Sources include:
              </p>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>Barna Group studies on church leadership and volunteer engagement</li>
                <li>Lifeway Research reports on church health, volunteer training, and children's ministry</li>
                <li>Pew Research Center data on religious participation and church involvement</li>
                <li>North American Mission Board (NAMB) and Send Network insights on church planting dynamics</li>
              </ul>
              <p className="text-foreground mt-3">
                No original surveys or proprietary datasets were conducted for this report. All conclusions are derived from analysis and alignment of existing research.
              </p>
            </section>

            <section aria-labelledby="key-findings">
              <h2
                id="key-findings"
                className="text-xl sm:text-2xl font-semibold text-foreground mb-3"
              >
                Key Findings
              </h2>

              <div className="mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Finding 1 -- Volunteer Dependence Is Foundational in Church Plants
                </h3>
                <p className="text-foreground mb-2">
                  Churches, particularly new plants, rely heavily on volunteers to carry out essential ministry functions, including teaching roles.
                </p>
                <p className="text-foreground">
                  Barna research consistently indicates that lay leadership is central to church operations, especially in environments where staffing is limited. In church plants, this dependence is often immediate rather than gradual.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Finding 2 -- Volunteer Preparedness Remains Inconsistent
                </h3>
                <p className="text-foreground mb-2">
                  Lifeway Research has identified ongoing challenges related to training and equipping volunteers. Many individuals serving in teaching roles report feeling underprepared to interpret Scripture, lead discussions, or manage classroom dynamics.
                </p>
                <p className="text-foreground">
                  This gap is not typically due to unwillingness, but rather to a lack of structured onboarding and accessible teaching tools.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Finding 3 -- Children's Ministry Presents Ongoing Staffing Challenges
                </h3>
                <p className="text-foreground mb-2">
                  Research across multiple ministry organizations highlights children's ministry as one of the most difficult areas to staff consistently.
                </p>
                <p className="text-foreground">
                  Recruitment, retention, and preparation of volunteers in this area require sustained effort, particularly in church plants where volunteer pools are smaller and less established.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Finding 4 -- Church Planters Carry Broad Teaching Responsibilities Early
                </h3>
                <p className="text-foreground mb-2">
                  Insights from NAMB and church planting networks indicate that pastors in early-stage churches frequently assume multiple teaching roles. These may include:
                </p>
                <ul className="list-disc pl-6 text-foreground space-y-1 mb-2">
                  <li>Adult preaching and teaching</li>
                  <li>Oversight of children's ministry</li>
                  <li>Direct involvement in classroom instruction when volunteers are unavailable</li>
                </ul>
                <p className="text-foreground">
                  This multi-role expectation contributes to fatigue and limits the ability to focus on long-term church development.
                </p>
              </div>

              <div className="mb-2">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Finding 5 -- Structured Teaching Resources Improve Volunteer Confidence
                </h3>
                <p className="text-foreground mb-2">
                  Barna research on volunteer engagement suggests that clarity, support, and defined expectations significantly increase both effectiveness and retention.
                </p>
                <p className="text-foreground mb-2">
                  In teaching contexts, this translates to the need for:
                </p>
                <ul className="list-disc pl-6 text-foreground space-y-1 mb-2">
                  <li>Clearly organized lesson content</li>
                  <li>Age-appropriate instructional guidance</li>
                  <li>Minimal preparation barriers</li>
                </ul>
                <p className="text-foreground">
                  When these elements are present, volunteers are more likely to teach with confidence and consistency.
                </p>
              </div>
            </section>

            <section aria-labelledby="implications">
              <h2
                id="implications"
                className="text-xl sm:text-2xl font-semibold text-foreground mb-3"
              >
                Implications for Church Plants
              </h2>
              <p className="text-foreground mb-3">
                The findings suggest that teaching capacity is not a secondary issue but a central factor in the health and sustainability of a new church.
              </p>
              <p className="text-foreground mb-2">When volunteer teachers are:</p>
              <ul className="list-disc pl-6 text-foreground space-y-1 mb-3">
                <li>Equipped with clear materials</li>
                <li>Supported with structured guidance</li>
                <li>Given realistic expectations</li>
              </ul>
              <p className="text-foreground mb-2">The outcomes include:</p>
              <ul className="list-disc pl-6 text-foreground space-y-1">
                <li>Greater instructional consistency across age groups</li>
                <li>Increased volunteer retention</li>
                <li>Reduced strain on church leadership</li>
                <li>Improved spiritual formation for children and families</li>
              </ul>
            </section>

            <section aria-labelledby="conclusion">
              <h2
                id="conclusion"
                className="text-xl sm:text-2xl font-semibold text-foreground mb-3"
              >
                Conclusion
              </h2>
              <p className="text-foreground mb-3">
                Church plants are designed to grow beyond the capacity of a single leader. As congregations expand, the ability to equip others to teach becomes essential.
              </p>
              <p className="text-foreground mb-3">
                Published research consistently indicates that volunteer readiness, particularly in teaching roles, is a determining factor in ministry effectiveness. Addressing this challenge requires intentional systems, accessible resources, and a commitment to equipping those who serve.
              </p>
              <p className="text-foreground">
                As new churches continue to be established, the need for reliable, Scripture-centered teaching support across all age groups remains a critical component of long-term sustainability.
              </p>
            </section>

            <section aria-labelledby="sources">
              <h2
                id="sources"
                className="text-xl sm:text-2xl font-semibold text-foreground mb-3"
              >
                Sources
              </h2>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>Barna Group. The State of the Church, various reports, 2015-2024.</li>
                <li>Lifeway Research. Church health and volunteer engagement studies.</li>
                <li>Lifeway Research. Children's ministry and volunteer trends.</li>
                <li>Pew Research Center. Religious landscape and participation studies.</li>
                <li>North American Mission Board. Church planting and Send Network insights.</li>
              </ul>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
