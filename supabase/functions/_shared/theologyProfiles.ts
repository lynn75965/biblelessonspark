/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/theologyProfiles.ts
 * Generated: 2025-12-13T22:18:10.917Z
 */
/**
 * THEOLOGY PROFILES - Single Source of Truth (SSOT)
 * 
 * This file defines all Baptist theology profiles for LessonSparkUSA.
 * 
 * ARCHITECTURE:
 * - `summary`: User-facing description (shown in UI)
 * - `filterContent`: Full theological filter (backend only - injected into AI prompt)
 * - `avoidTerminology`: Terms that MUST NOT appear in generated lessons
 * - `preferredTerminology`: Substitutions for avoided terms
 * - `requiredTerminology`: Terms that MUST appear (Reformed/Primitive only)
 * - `guardrails`: Explicit content prohibitions
 * 
 * DISPLAY ORDER: As specified by product owner
 * DEFAULT PROFILE: Baptist Core Beliefs
 * 
 * Updated: December 2025
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface TheologyProfile {
  id: string;
  name: string;
  shortName: string;
  displayOrder: number;
  isDefault: boolean;
  summary: string; // USER-FACING - shown in UI
  filterContent: string; // BACKEND ONLY - injected into AI prompt
  avoidTerminology: string[];
  preferredTerminology: Record<string, string>;
  requiredTerminology: string[];
  guardrails: string[];
  securityDoctrine: 'eternal' | 'conditional' | 'perseverance';
  tulipStance: 'anti' | 'pro';
}

// ============================================================================
// THEOLOGY PROFILES DATA
// ============================================================================

export const THEOLOGY_PROFILES: TheologyProfile[] = [
  // -------------------------------------------------------------------------
  // 1. BAPTIST CORE BELIEFS - DEFAULT
  // -------------------------------------------------------------------------
  {
    id: "baptist-core-beliefs",
    name: "Baptist Core Beliefs",
    shortName: "Core",
    displayOrder: 1,
    isDefault: true,
    summary: "All Baptists affirm the authority of Scripture, salvation by grace through faith in Christ, believer's baptism by immersion, the autonomy of the local church, two symbolic ordinances, evangelistic responsibility, moral living, and the future return of Christ.",
    securityDoctrine: 'eternal',
    tulipStance: 'anti',
    avoidTerminology: [
      // Avoid ALL disputed terminology - Calvinist
      "Total Depravity",
      "Total Inability",
      "Unconditional Election",
      "Limited Atonement",
      "Particular Redemption",
      "Irresistible Grace",
      "Effectual Calling",
      "TULIP",
      "the elect",
      "sovereign election",
      "monergism",
      "regeneration precedes faith",
      "ordained to salvation",
      "meticulous sovereignty",
      "determinism",
      "covenant theology",
      "perseverance of the saints",
      // Avoid ALL disputed terminology - Arminian
      "prevenient grace",
      "conditional security",
      "can lose salvation",
      "apostasy",
      // Avoid disputed church order
      "complementarianism",
      "egalitarianism",
      "regulative principle",
      // Avoid disputed practices
      "foot washing as ordinance",
      "charismatic gifts",
      "tongues",
      "prophecy as normative",
      // Avoid disputed mission stances
      "anti-mission",
      "mission boards"
    ],
    preferredTerminology: {
      "Total Depravity": "humanity has fallen into sin",
      "election": "God's saving purpose in Christ",
      "atonement": "Christ's death and resurrection are the basis of salvation",
      "grace": "salvation is by grace through faith",
      "security": "believers are kept by God's power"
    },
    requiredTerminology: [],
    guardrails: [
      "Promotes any specific point of Calvinism",
      "Promotes Arminianism or conditional security",
      "Takes a position on complementarianism or egalitarianism",
      "Advocates the regulative principle or charismatic gifts",
      "Presents foot washing as a required ordinance",
      "Takes a position on mission boards or anti-mission stances",
      "Includes any denominational non-shared emphasis",
      "Takes sides on disputed Baptist doctrines"
    ],
    filterContent: `## THEOLOGICAL LENS: Baptist Core Beliefs

This profile represents the universally shared theological commitments held by ALL major Baptist traditions. Nothing appears unless every Baptist group affirms it.

### Scripture
The Bible is the inspired, authoritative, trustworthy Word of God. Scripture is the final rule of faith and practice. No additional inspired books, revelations, or authorities are recognized.

### God
There is one God, revealed eternally as Father, Son, and Holy Spirit. God is holy, righteous, loving, all-powerful, and all-knowing. God is the Creator and Sustainer of all things.

### Humanity & Sin
All people are created in the image of God and possess inherent worth. Humanity has fallen into sin and is unable to reconcile itself to God. Every person needs salvation through Jesus Christ.

### Salvation
Salvation is by grace through faith in Jesus Christ alone. Christ's death and resurrection are the only basis of salvation. Individuals must personally repent and believe to be saved. Regeneration, forgiveness, and new life are the work of God, not human merit.

### Christ
Jesus Christ is fully God and fully man. He lived a sinless life, died a substitutionary death, and rose bodily from the grave. Christ is the only Savior and mediator. He will return visibly and bodily.

### Holy Spirit
The Holy Spirit convicts of sin, regenerates, indwells, guides, and empowers believers. He produces spiritual growth, godly character, and obedience to Christ.

### Church
The local church is the primary, biblical expression of the body of Christ. Churches are autonomous, self-governing under Christ. Membership consists of regenerate believers. All Baptists affirm the priesthood of all believers.

### Ordinances
Two ordinances instituted by Christ:
1. Baptism: administered only to believers, by immersion, symbolizing union with Christ
2. Lord's Supper: a symbolic memorial of Christ's sacrifice

### Worship
Worship must be biblical, Christ-centered, and reverent. Scripture reading and preaching are central.

### Missions & Evangelism
Every Baptist tradition affirms the responsibility to share the gospel with all people. Evangelism is both personal and congregational. Missions are essential to Baptist identity.

### Ethics
Believers are called to live holy, obedient, and morally upright lives. Marriage is between one man and one woman. Human life is sacred.

### Eschatology
Jesus Christ will return bodily and visibly. There will be a final judgment. The dead will be resurrected. Heaven and Hell are real and eternal.

### Tone
Warm, biblical, Christ-centered, and accessible. Avoid doctrinal positions not universally held among Baptists. Emphasize unity in the essentials.

### CRITICAL INSTRUCTION
This profile must EXCLUDE all doctrines not unanimously affirmed across Baptist traditions. Stay neutral on: election debates, security debates, church polity details, worship style, spiritual gifts, and any denominational-specific emphases.`
  },

  // -------------------------------------------------------------------------
  // 2. SOUTHERN BAPTIST (BF&M 1963)
  // -------------------------------------------------------------------------
  {
    id: "southern-baptist-bfm-1963",
    name: "Southern Baptist (BF&M 1963)",
    shortName: "SBC 1963",
    displayOrder: 2,
    isDefault: false,
    summary: "A Christ-centered, Scripture-authoritative, evangelistic, missions-minded Southern Baptist doctrinal identity emphasizing universal atonement, human responsibility, believer's baptism, congregational autonomy, eternal security, warm worship, and strong personal discipleship—interpreted through the lens of Christ as the criterion of Scripture.",
    securityDoctrine: 'eternal',
    tulipStance: 'anti',
    avoidTerminology: [
      "Total Depravity",
      "Unconditional Election",
      "Limited Atonement",
      "Particular Redemption",
      "Irresistible Grace",
      "Effectual Calling",
      "TULIP",
      "the elect" ,
      "sovereign election",
      "monergism",
      "regeneration precedes faith",
      "ordained to salvation",
      "predestined individuals",
      "meticulous sovereignty",
      "determinism"
    ],
    preferredTerminology: {
      "Total Depravity": "fallen humanity / sinful nature",
      "Unconditional Election": "election consistent with foreknowledge and human responsibility",
      "Limited Atonement": "Christ died for all / unlimited atonement",
      "Irresistible Grace": "the Spirit draws and convicts; individuals may respond or resist",
      "regeneration precedes faith": "faith and repentance precede regeneration",
      "the elect": "believers / those who trust in Christ",
      "Effectual Calling": "the Spirit's conviction and drawing"
    },
    requiredTerminology: [],
    guardrails: [
      "Promotes unconditional election or irresistible grace as doctrinal fact",
      "Imposes BF&M 2000-style complementarian restrictions",
      "Suggests charismatic gifts are normative",
      "Undermines believer's baptism or congregational polity",
      "Uses coercive evangelism or manipulative decisionism",
      "Adopts liberal theology, universalism, or moral revisionism",
      "Uses TULIP terminology or Calvinist/Reformed language",
      "Suggests humans cannot genuinely respond to the gospel"
    ],
    filterContent: `## THEOLOGICAL LENS: Southern Baptist (BF&M 1963)

### Scripture
Scripture is inspired, authoritative, trustworthy, and sufficient. Jesus Christ is the criterion by which the Bible is to be interpreted. Use literal-historical-grammatical interpretation with Christ-centered hermeneutics.

### God
God is sovereign, holy, righteous, loving, and personal. His sovereignty includes providential care without requiring deterministic outcomes. God desires the salvation of all and works through human freedom and responsibility.

### Salvation
- Election is taught but not defined deterministically; usually understood in foreknowledge-based or corporate terms
- Universal provision, personal application: Christ died for all; salvation becomes effective through repentance and faith
- Grace draws and convicts but can be resisted
- Faith and repentance precede the experience of regeneration
- Eternal Security: those truly saved are kept by God's power

### Holy Spirit
The Spirit convicts, regenerates, indwells, sanctifies, and empowers believers. Non-charismatic: miraculous gifts are not normative for the church today.

### Church
Local church autonomy; congregational governance. BF&M 1963 is less explicit on gender roles—traditional male pastoral leadership is customary.

### Ethics
Holiness, obedience, prayer, service, and Christlike character expected. Marriage traditionally between one man and one woman. Life is sacred from conception.

### Tone
Warm, pastoral, Christ-centered, Scripture-rooted. Emphasize soul competency, Christian liberty, and personal devotion. Avoid heavy confessional Reformed terminology or deterministic framing.`
  },

  // -------------------------------------------------------------------------
  // 3. SOUTHERN BAPTIST (BF&M 2000)
  // -------------------------------------------------------------------------
  {
    id: "southern-baptist-bfm-2000",
    name: "Southern Baptist (BF&M 2000)",
    shortName: "SBC 2000",
    displayOrder: 3,
    isDefault: false,
    summary: "A conservative, Scripture-authoritative, complementarian, evangelistic Southern Baptist doctrinal framework emphasizing biblical inerrancy, universal atonement, salvation by grace through faith, believer's baptism, eternal security, global missions, moral clarity, and congregational autonomy — shaped by the official Baptist Faith & Message (2000).",
    securityDoctrine: 'eternal',
    tulipStance: 'anti',
    avoidTerminology: [
      "Total Depravity",
      "Unconditional Election",
      "Limited Atonement",
      "Particular Redemption",
      "Irresistible Grace",
      "Effectual Calling",
      "TULIP",
      "the elect",
      "sovereign election",
      "monergism",
      "regeneration precedes faith",
      "ordained to salvation",
      "predestined individuals",
      "meticulous sovereignty",
      "determinism"
    ],
    preferredTerminology: {
      "Total Depravity": "fallen humanity / sinful nature",
      "Unconditional Election": "election consistent with foreknowledge and human responsibility",
      "Limited Atonement": "Christ died for all / unlimited atonement",
      "Irresistible Grace": "the Spirit draws and convicts; individuals may respond or resist",
      "regeneration precedes faith": "faith and repentance precede regeneration",
      "the elect": "believers / those who trust in Christ",
      "Effectual Calling": "the Spirit's conviction and drawing"
    },
    requiredTerminology: [],
    guardrails: [
      "Rejects complementarianism or affirms women as pastors",
      "Promotes unconditional election and irresistible grace as required SBC doctrine",
      "Suggests charismatic gifts are normative in SBC churches",
      "Undermines believer's baptism or congregational polity",
      "Accepts liberal theological reinterpretations",
      "Embraces universalism or moral revisionism",
      "Uses TULIP terminology or Calvinist/Reformed language",
      "Suggests humans cannot genuinely respond to the gospel"
    ],
    filterContent: `## THEOLOGICAL LENS: Southern Baptist (BF&M 2000)

### Scripture
The Bible is inerrant, infallible, fully trustworthy, authoritative, and sufficient. Interpreted using historical-grammatical hermeneutics. Scripture is the final authority. No reinterpretation through culture, critical theory, or modernist frameworks.

### God
God is sovereign, holy, righteous, loving, and all-powerful. His sovereignty does not imply determinism but includes divine foreknowledge and purposeful governance. God desires salvation for all, yet salvation is only for those who believe.

### Salvation
- Election is biblical but understood within God's foreknowledge and human responsibility
- Christ's death is sufficient for all, efficient only for believers (unlimited atonement)
- Grace draws and convicts but can be resisted
- Repentance and faith precede regeneration in human experience
- Perseverance/Eternal Security: those truly saved are kept by God and will persevere

### Holy Spirit
The Spirit convicts, regenerates, indwells, sanctifies, and empowers believers. Non-charismatic normative stance: sign gifts are not required or expected. No new revelation beyond Scripture.

### Church
Local church autonomy and congregational governance. Complementarianism: "The office of pastor is limited to men as qualified by Scripture." Cooperative Program missions are voluntary.

### Ethics
Marriage is exclusively between one man and one woman. Family roles reflect complementarianism. Sanctity of human life from conception. Rejects pornography, sexual immorality, drunkenness, gambling.

### Tone
Biblical, doctrinally clear, conservative, evangelistic. Accuracy, clarity, and pastoral warmth required. Avoid academic abstraction and hyper-Calvinistic determinism.`
  },

  // -------------------------------------------------------------------------
  // 4. NATIONAL BAPTIST CONVENTION (USA)
  // -------------------------------------------------------------------------
  {
    id: "national-baptist-convention",
    name: "National Baptist Convention (USA)",
    shortName: "NBC",
    displayOrder: 4,
    isDefault: false,
    summary: "A warm, evangelistic, Scripture-rooted, Christ-centered Baptist doctrinal identity emphasizing universal atonement, genuine human freedom, believer's baptism, congregational autonomy, strong community witness, expressive worship, moral integrity, and holistic Christian mission (personal salvation + community transformation).",
    securityDoctrine: 'eternal',
    tulipStance: 'anti',
    avoidTerminology: [
      "Total Depravity",
      "Unconditional Election",
      "Limited Atonement",
      "Particular Redemption",
      "Irresistible Grace",
      "Effectual Calling",
      "TULIP",
      "the elect",
      "sovereign election",
      "monergism",
      "regeneration precedes faith",
      "ordained to salvation",
      "meticulous sovereignty",
      "determinism"
    ],
    preferredTerminology: {
      "Total Depravity": "fallen humanity / sinful nature",
      "Unconditional Election": "election understood in foreknowledge-based or corporate terms",
      "Limited Atonement": "Christ died for the sins of the whole world",
      "Irresistible Grace": "grace calls, convicts, enables—but does not coerce",
      "regeneration precedes faith": "faith and repentance precede conversion",
      "the elect": "believers / those who trust in Christ"
    },
    requiredTerminology: [],
    guardrails: [
      "Promotes Calvinistic unconditional election or irresistible grace",
      "Suggests charismatic gifts as normative for worship",
      "Denies the authority or sufficiency of Scripture",
      "Undermines believer's baptism or congregational autonomy",
      "Teaches universalism, works-based salvation, prosperity gospel, or liberal theology that rejects biblical ethics",
      "Minimizes the moral teachings of Scripture",
      "Uses TULIP terminology or Calvinist/Reformed language"
    ],
    filterContent: `## THEOLOGICAL LENS: National Baptist Convention (USA)

### Scripture
The Bible is inspired, inerrant in its original manuscripts, authoritative, and sufficient. Interpreted with a strong emphasis on justice, community responsibility, and faithful Christian living.

### God
God is sovereign, omniscient, omnipotent, holy, just, and loving. God's sovereignty works in harmony with human moral responsibility. God desires all to come to repentance and salvation.

### Salvation
- Election is understood in foreknowledge-based or corporate terms; rejects Calvinistic unconditional election
- Unlimited Atonement: Christ died for the sins of the whole world
- Grace calls, convicts, enables, and empowers—but does not coerce
- Faith and repentance precede conversion
- Eternal Security is widely held; emphasis on living faith and obedience as marks of genuine salvation

### Holy Spirit
The Spirit convicts, regenerates, sanctifies, comforts, empowers, and unifies the church. Non-charismatic as a rule, but often exhibits expressive worship empowered by the Spirit.

### Church
Strong congregational autonomy. Emphasis on fellowship, community empowerment, discipleship, and service. The church is a spiritual family and a center of community life.

### Ethics
Strong emphasis on holiness, moral purity, family life, community responsibility, justice, mercy, and compassion. Marriage between one man and one woman. Sanctity of human life.

### Worship
Worship is expressive, joyful, reverent, Christ-honoring, featuring dynamic preaching, congregational singing, gospel music, testimonies, and celebratory praise.

### Tone
Warm, pastoral, inspirational, biblically grounded. Emphasize hope, encouragement, empowerment, and faithful Christian living. Avoid academic abstraction.`
  },

  // -------------------------------------------------------------------------
  // 5. INDEPENDENT BAPTIST
  // -------------------------------------------------------------------------
  {
    id: "independent-baptist",
    name: "Independent Baptist",
    shortName: "IB",
    displayOrder: 5,
    isDefault: false,
    summary: "A conservative, evangelistic, dispensational, non-charismatic doctrinal baseline emphasizing Scripture authority, unlimited atonement, personal decision for Christ, eternal security, believer's baptism, local church autonomy, and strong separation from secular values.",
    securityDoctrine: 'eternal',
    tulipStance: 'anti',
    avoidTerminology: [
      "Total Depravity",
      "Total Inability",
      "Unconditional Election",
      "Limited Atonement",
      "Particular Redemption",
      "Irresistible Grace",
      "Effectual Calling",
      "TULIP",
      "the elect",
      "sovereign election",
      "monergism",
      "regeneration precedes faith",
      "ordained to salvation",
      "meticulous sovereignty",
      "determinism",
      "covenant theology"
    ],
    preferredTerminology: {
      "Total Depravity": "fallen humanity capable of responding to God's conviction",
      "Unconditional Election": "election based on foreknowledge / whosoever will may come",
      "Limited Atonement": "Christ died for the sins of all people everywhere",
      "Irresistible Grace": "the Spirit convicts, but grace is resistible",
      "regeneration precedes faith": "regeneration follows faith and repentance",
      "the elect": "believers / those who have trusted Christ"
    },
    requiredTerminology: [],
    guardrails: [
      "Suggests predestination removes human responsibility",
      "Promotes Calvinistic unconditional election or irresistible grace",
      "Advocates charismatic gifts as normative",
      "Undermines dispensational distinctions or the doctrine of a literal Second Coming",
      "Introduces liberal theology, universal salvation, or cultural reinterpretation of Scripture",
      "Suggests loss of salvation or works-based salvation",
      "Uses TULIP terminology or Reformed/Calvinist language"
    ],
    filterContent: `## THEOLOGICAL LENS: Independent Baptist

### Scripture
The Bible is inerrant, infallible, preserved, and fully authoritative. Many Independent Baptists prefer KJV, but remain translation-flexible. Use literal-historical-grammatical interpretation. Strong emphasis on Scripture clarity and direct teaching.

### God
God is sovereign, but sovereignty is framed alongside genuine human responsibility. Rejects meticulous determinism. God desires all people to be saved.

### Salvation
- Election typically understood as corporate or based on foreknowledge; strong emphasis on "whosoever will may come"
- Unlimited Atonement: Christ died for the sins of all people everywhere
- The Spirit convicts, but grace is resistible; conversion is a personal decision
- Regeneration follows faith and repentance
- Eternal Security: Once saved, always saved

### Holy Spirit
The Spirit convicts, indwells, sanctifies, and seals believers. Overwhelmingly non-charismatic; extraordinary gifts viewed as ceased.

### Dispensationalism
Strong lean toward classic or revised dispensationalism. Israel and the Church are distinct. Prophetic passages interpreted literally.

### Church
Local church autonomy is absolute. Congregational governance, often pastor-led. No denominational oversight. Strong emphasis on soul-winning, missions, and church planting.

### Eschatology
Strong tendency toward Premillennialism and Pre-tribulational rapture.

### Tone
Clear, direct, evangelistic, Scripture-first. Practical application emphasized. Conservative, traditional moral framing. Encouraging, not academic.`
  },

  // -------------------------------------------------------------------------
  // 6. MISSIONARY BAPTIST
  // -------------------------------------------------------------------------
  {
    id: "missionary-baptist",
    name: "Missionary Baptist",
    shortName: "MB",
    displayOrder: 6,
    isDefault: false,
    summary: "A conservative, evangelistic, missions-driven doctrine emphasizing believer's baptism, local church autonomy, unlimited atonement, personal response to the gospel, eternal security, dispensational leanings, non-charismatic worship, and practical Christian living rooted in Scripture.",
    securityDoctrine: 'eternal',
    tulipStance: 'anti',
    avoidTerminology: [
      "Total Depravity",
      "Total Inability",
      "Unconditional Election",
      "Limited Atonement",
      "Particular Redemption",
      "Irresistible Grace",
      "Effectual Calling",
      "TULIP",
      "the elect",
      "sovereign election",
      "monergism",
      "regeneration precedes faith",
      "ordained to salvation",
      "meticulous sovereignty",
      "determinism"
    ],
    preferredTerminology: {
      "Total Depravity": "fallen humanity capable of responding to God",
      "Unconditional Election": "election based on foreknowledge / whosoever will",
      "Limited Atonement": "Christ died for all people",
      "Irresistible Grace": "grace can be resisted; salvation involves genuine response",
      "regeneration precedes faith": "regeneration follows faith and repentance"
    },
    requiredTerminology: [],
    guardrails: [
      "Promotes Calvinistic unconditional election or irresistible grace",
      "Suggests salvation can be lost or earned",
      "Introduces charismatic gifts as normative for today",
      "Undermines believer's baptism, church autonomy, or missions focus",
      "Proposes replacement theology or denies Israel/church distinction",
      "Suggests universalism, liberal theology, or works-based salvation",
      "Uses TULIP terminology or Reformed language"
    ],
    filterContent: `## THEOLOGICAL LENS: Missionary Baptist

### Scripture
The Bible is inerrant, infallible, verbally inspired, preserved, authoritative, and the final rule of faith and practice. Rejects higher criticism and modernist reinterpretation.

### God
God is sovereign but exercises sovereignty consistent with human responsibility. Rejects deterministic interpretations. God desires all people to be saved.

### Salvation
- Election understood primarily as corporate, Christ-centered, or foreknowledge-based
- Unlimited Atonement: Christ died for all people; salvation provided universally but applied personally through faith
- The Holy Spirit convicts and calls; grace can be resisted
- Regeneration follows faith and repentance, not before
- Eternal Security: True salvation cannot be lost

### Holy Spirit
The Spirit convicts, regenerates, indwells, seals, sanctifies, and empowers. Charismatic expressions rejected as normative.

### Church
Local church is fully autonomous, self-governing, and independent. Strong Landmark influence in some contexts. Believer's baptism by immersion.

### Missions
Missionary Baptists are named for their commitment to missions. Strong emphasis on personal evangelism, local and global missions, discipleship, and church planting.

### Tone
Clear, evangelistic, practical, warm, and accessible. Emphasis on missions, discipleship, and spiritual growth. Avoid academic abstraction.`
  },

  // -------------------------------------------------------------------------
  // 7. GENERAL BAPTIST
  // -------------------------------------------------------------------------
  {
    id: "general-baptist",
    name: "General Baptist",
    shortName: "GB",
    displayOrder: 7,
    isDefault: false,
    summary: "A warm, evangelistic, Arminian Baptist doctrinal baseline emphasizing universal atonement, human freedom, prevenient grace, believer's baptism, local church autonomy, eternal security (modern view), missions, and practical Christian living rooted in Scripture.",
    securityDoctrine: 'eternal',
    tulipStance: 'anti',
    avoidTerminology: [
      "Total Depravity",
      "Total Inability",
      "Unconditional Election",
      "Limited Atonement",
      "Particular Redemption",
      "Irresistible Grace",
      "Effectual Calling",
      "TULIP",
      "the elect",
      "sovereign election",
      "monergism",
      "regeneration precedes faith",
      "ordained to salvation",
      "meticulous sovereignty",
      "determinism"
    ],
    preferredTerminology: {
      "Total Depravity": "fallen humanity able to respond to prevenient grace",
      "Unconditional Election": "election is conditional, based on God's foreknowledge of faith",
      "Limited Atonement": "Christ died for all people without exception",
      "Irresistible Grace": "prevenient grace—God empowers but does not coerce",
      "regeneration precedes faith": "regeneration follows repentance and faith"
    },
    requiredTerminology: [],
    guardrails: [
      "Promotes unconditional election or irresistible grace",
      "Suggests salvation is coerced or predetermined without human freedom",
      "Advocates charismatic signs as normative",
      "Undermines believer's baptism or local church autonomy",
      "Promotes universalism, liberal theology, or works-based salvation",
      "Asserts loss of salvation (use eternal security unless Historic General Baptist selected)",
      "Uses TULIP terminology or Calvinist language"
    ],
    filterContent: `## THEOLOGICAL LENS: General Baptist

### Scripture
The Bible is inspired, inerrant, authoritative, sufficient, and fully trustworthy. Use literal-historical-grammatical interpretation with emphasis on clarity and simplicity.

### God
God is sovereign but His sovereignty does not override human free will. God desires all people to be saved.

### Salvation
- Election is conditional, based on God's foreknowledge of faith; God elects "in Christ"
- Unlimited Atonement: Christ died for all people without exception
- Prevenient grace—God empowers all people to believe but does not coerce
- Regeneration follows repentance and faith
- Eternal Security (modern view): salvation cannot be lost once genuinely received

### Holy Spirit
The Spirit convicts, regenerates, indwells, sanctifies, seals, and empowers. Most General Baptists are non-charismatic.

### Church
Local church autonomy is essential. Congregational governance. Free and voluntary cooperation with associations.

### Ethics
Emphasis on holiness, obedience, prayer, Scripture engagement. Marriage between one man and one woman. Sanctity of human life.

### Tone
Warm, evangelistic, accessible, Scripture-grounded. Practical, encouraging, and application-focused. Avoid Reformed confessional language.`
  },

  // -------------------------------------------------------------------------
  // 8. FREE WILL BAPTIST
  // -------------------------------------------------------------------------
  {
    id: "free-will-baptist",
    name: "Free Will Baptist",
    shortName: "FWB",
    displayOrder: 8,
    isDefault: false,
    summary: "A warm, evangelistic, holiness-focused, Arminian Baptist doctrinal profile emphasizing universal atonement, genuine human free will, prevenient grace, conditional security, believer's baptism, three ordinances (baptism, Lord's Supper, foot washing), local church autonomy, and a life of obedience empowered by the Holy Spirit.",
    securityDoctrine: 'conditional',
    tulipStance: 'anti',
    avoidTerminology: [
      "Total Depravity",
      "Total Inability",
      "Unconditional Election",
      "Limited Atonement",
      "Particular Redemption",
      "Irresistible Grace",
      "Effectual Calling",
      "TULIP",
      "the elect",
      "sovereign election",
      "monergism",
      "regeneration precedes faith",
      "ordained to salvation",
      "once saved always saved",
      "eternal security",
      "meticulous sovereignty",
      "determinism",
      "perseverance of the saints"
    ],
    preferredTerminology: {
      "Total Depravity": "humans retain God-given capacity to respond to grace",
      "Unconditional Election": "election is conditional, based on God's foreknowledge of who will believe",
      "Limited Atonement": "Christ died for every person / general atonement",
      "Irresistible Grace": "prevenient grace enables but does not compel belief",
      "regeneration precedes faith": "faith and repentance precede regeneration",
      "eternal security": "conditional security—salvation can be forfeited by persistent unbelief",
      "perseverance of the saints": "continued faith is necessary; apostasy is possible"
    },
    requiredTerminology: [],
    guardrails: [
      "Teaches unconditional election or irresistible grace",
      "Promotes eternal security (Free Will Baptists teach conditional security)",
      "Suggests charismatic gifts as normative",
      "Undermines the ordinance of foot washing",
      "Suggests salvation is purely works-based or self-generated",
      "Introduces universalism, liberal theology, or determinism",
      "Uses TULIP terminology or Calvinist language"
    ],
    filterContent: `## THEOLOGICAL LENS: Free Will Baptist

### Scripture
The Bible is inspired, inerrant, infallible, authoritative, and sufficient. Interpreted using literal-historical-grammatical methods.

### God
God is sovereign but exercises sovereignty without negating human freedom. God genuinely desires all people to be saved.

### Salvation
- Election is conditional, based on God's foreknowledge of who will freely believe
- General/Unlimited Atonement: Christ died for every person
- Prevenient grace enables all people to believe without compelling belief
- Faith and repentance precede regeneration
- CONDITIONAL SECURITY: Salvation can be forfeited by persistent, willful unbelief. Apostasy is possible but never accidental—requires conscious, ongoing rejection of Christ.

### Holy Spirit
The Spirit convicts, calls, regenerates, indwells, sanctifies, and empowers. Non-charismatic—tongues and sign gifts are not normative. Holiness strongly emphasized.

### Three Ordinances
1. Baptism: believers only, immersion
2. Lord's Supper: memorial, symbolic
3. Foot Washing: considered an ordinance taught by Jesus (John 13), practiced as humility and service

### Church
Congregational, local church autonomy. Strong emphasis on discipleship, holiness, and community accountability.

### Ethics
Holiness is central: moral purity, humility, separation from sinful practices. Marriage one man and one woman. Sanctity of life.

### Tone
Warm, evangelistic, holiness-oriented, and practical. Clear moral application. Avoid Reformed confessional jargon.`
  },

  // -------------------------------------------------------------------------
  // 9. PRIMITIVE BAPTIST
  // -------------------------------------------------------------------------
  {
    id: "primitive-baptist",
    name: "Primitive Baptist",
    shortName: "PB",
    displayOrder: 9,
    isDefault: false,
    summary: "A deeply Calvinistic, predestinarian, Old School Baptist doctrinal identity emphasizing unconditional election, particular redemption, regeneration without means, absolute security, a cappella worship, local church autonomy, foot washing, and simple, experiential Christian living rooted in Scripture.",
    securityDoctrine: 'perseverance',
    tulipStance: 'pro',
    avoidTerminology: [
      "unlimited atonement",
      "Christ died for all",
      "general atonement",
      "prevenient grace",
      "resistible grace",
      "faith causes regeneration",
      "decision for Christ",
      "accept Christ",
      "free will",
      "human ability to believe",
      "altar call",
      "sinner's prayer",
      "mission boards",
      "denominational programs"
    ],
    preferredTerminology: {
      "unlimited atonement": "particular redemption / Christ died for the elect",
      "Christ died for all": "Christ died effectually for His people",
      "free will": "human responsibility under God's sovereign decree",
      "decision for Christ": "evidence of regeneration already accomplished by God"
    },
    requiredTerminology: [
      "unconditional election",
      "particular redemption",
      "regeneration by God alone",
      "irresistible grace",
      "total depravity",
      "perseverance of the saints",
      "sovereign grace"
    ],
    guardrails: [
      "Teaches that faith causes regeneration (Primitive Baptists teach regeneration precedes faith)",
      "Suggests universal atonement or conditional election",
      "Promotes mission boards, denominational programs, or institutional fundraising",
      "Introduces charismatic gifts, contemporary worship trends, or entertainment elements",
      "Encourages altar calls, 'decisions for Christ,' or methods-based evangelism",
      "Suggests salvation can be lost",
      "Promotes prosperity theology, liberal theology, or works-based salvation"
    ],
    filterContent: `## THEOLOGICAL LENS: Primitive Baptist

### Scripture
The Bible is inspired, inerrant, authoritative, preserved, and the sole rule of faith and practice. Interpreted within the Old School Baptist tradition.

### God
God is absolutely sovereign over all things. His decrees are eternal and unchangeable. Everything happens according to God's predetermined will. Salvation is entirely God's work.

### Salvation
- Unconditional Election: God chose His people before time based solely on His will
- Particular Redemption: Christ died only for the elect; the atonement is fully effective
- Regeneration occurs directly by God, without human means (no preaching required)
- Regeneration may occur long before conscious faith
- The gospel "in time" instructs and comforts those already spiritually alive
- Faith is evidence of regeneration, not the cause of it
- Absolute security of the eternally elect

### Holy Spirit
The Spirit regenerates without human means. Indwells, comforts, sanctifies, and guides. No charismatic gifts or modern revelations.

### Three Ordinances
1. Baptism: believers only, immersion, testimony of obedience
2. Lord's Supper: memorial ordinance
3. Foot Washing: required ordinance from John 13, symbol of humility

### Church
Local church autonomy, strictly congregational. No boards, conventions, mission societies, or institutional oversight. Strong emphasis on simplicity and experiential faith.

### Worship
A cappella congregational singing (no instruments). Simple, reverent, Scripture-centered. Emphasis on experiential preaching by Spirit-led elders.

### Missions
Traditionally non-missionary; reject organized mission boards. Evangelism is personal, informal, Spirit-led. God's elect will be saved regardless of human methods.

### Tone
Warm, experiential, reverent, Scripture-saturated. Avoid institutional language. Emphasize God's sovereignty and experiential assurance.`
  },

  // -------------------------------------------------------------------------
  // 10. REFORMED BAPTIST
  // -------------------------------------------------------------------------
  {
    id: "reformed-baptist",
    name: "Reformed Baptist",
    shortName: "RB",
    displayOrder: 10,
    isDefault: false,
    summary: "A confessional, sovereign-grace, 1689-aligned theological baseline emphasizing God's exhaustive sovereignty, unconditional election, particular redemption, irresistible grace, covenant theology, plurality of elders, strict congregationalism, and reverent Scripture-regulated worship.",
    securityDoctrine: 'perseverance',
    tulipStance: 'pro',
    avoidTerminology: [
      "unlimited atonement",
      "Christ died for all",
      "general atonement",
      "prevenient grace",
      "resistible grace",
      "faith precedes regeneration",
      "human decision saves",
      "free will to believe",
      "conditional election",
      "foreseen faith",
      "synergism",
      "conditional security",
      "can lose salvation"
    ],
    preferredTerminology: {
      "unlimited atonement": "particular redemption / definite atonement",
      "Christ died for all": "Christ died effectually for the elect",
      "faith precedes regeneration": "regeneration precedes faith",
      "free will": "human responsibility under divine sovereignty",
      "conditional election": "unconditional election based on God's sovereign will"
    },
    requiredTerminology: [
      "unconditional election",
      "particular redemption",
      "irresistible grace",
      "total depravity",
      "perseverance of the saints",
      "effectual calling",
      "sovereign grace",
      "covenant theology",
      "regeneration precedes faith"
    ],
    guardrails: [
      "Denies unconditional election or irresistible grace",
      "Suggests salvation is based on human decision or foreseen merit",
      "Promotes unlimited atonement, synergism, or conditional security",
      "Undermines covenant theology, the Regulative Principle, or confessional boundaries",
      "Supports universalism, liberal theology, prosperity gospel, or works-based salvation"
    ],
    filterContent: `## THEOLOGICAL LENS: Reformed Baptist (1689 LBCF)

### Scripture
Scripture is inerrant, infallible, sufficient, authoritative, and the only rule for faith and practice. Interpreted using historical-grammatical methods within the confessional Reformed framework.

### God
God exercises meticulous and exhaustive sovereignty over all creation. God ordains all things that come to pass, including salvation.

### Salvation
- Unconditional Election based solely on God's sovereign will; individual, eternal, gracious
- Particular Redemption (Limited Atonement): Christ's death sufficient for all, efficient only for the elect
- Irresistible Grace: the Spirit effectually calls the elect
- Regeneration precedes faith; saving faith is enabled and guaranteed by the Spirit
- Justification by grace alone through faith alone in Christ alone
- Perseverance of the Saints: those truly saved will persevere in holiness

### Covenant Theology
Affirms classic Reformed Covenant Theology: Covenant of Redemption, Covenant of Works, Covenant of Grace. Christ is the fulfillment of all covenants.

### Holy Spirit
The Spirit regenerates, effectually calls, sanctifies, and preserves the elect. Extraordinary charismatic gifts treated cautiously or viewed as ceased.

### Church
Strict congregationalism with plurality of elders. Church membership requires credible profession and baptism. Church discipline is essential.

### Worship
Regulative Principle: only what Scripture commands is permitted in corporate worship. Emphasis on reverence, psalms/hymns, expositional preaching.

### Tone
Doctrinally precise, reverent, confessional language. Avoid pragmatism. Focus on God's sovereignty, Christ's work, and transformation through Scripture.`
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a theology profile by ID
 */
export function getTheologyProfile(id: string): TheologyProfile | undefined {
  return THEOLOGY_PROFILES.find(profile => profile.id === id);
}

/**
 * Get the default theology profile
 */
export function getDefaultTheologyProfile(): TheologyProfile {
  return THEOLOGY_PROFILES.find(profile => profile.isDefault) || THEOLOGY_PROFILES[0];
}

/**
 * Get profiles sorted by display order
 */
export function getTheologyProfilesSorted(): TheologyProfile[] {
  return [...THEOLOGY_PROFILES].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get user-facing profile options (for dropdowns)
 * Returns only id, name, shortName, and summary
 */
export function getTheologyProfileOptions(): Array<{
  id: string;
  name: string;
  shortName: string;
  summary: string;
  isDefault: boolean;
}> {
  return getTheologyProfilesSorted().map(profile => ({
    id: profile.id,
    name: profile.name,
    shortName: profile.shortName,
    summary: profile.summary,
    isDefault: profile.isDefault
  }));
}

/**
 * Generate the theological guardrails block for AI prompt injection
 */
export function generateTheologicalGuardrails(profileId: string): string {
  const profile = getTheologyProfile(profileId) || getDefaultTheologyProfile();
  
  let guardrailsBlock = `
## THEOLOGICAL GUARDRAILS — MANDATORY COMPLIANCE

**Selected Theology Profile:** ${profile.name}

${profile.filterContent}

---

### TERMINOLOGY RULES
`;

  if (profile.avoidTerminology.length > 0) {
    guardrailsBlock += `
**PROHIBITED TERMINOLOGY (DO NOT USE):**
${profile.avoidTerminology.map(term => `- "${term}"`).join('\n')}
`;
  }

  if (Object.keys(profile.preferredTerminology).length > 0) {
    guardrailsBlock += `
**REQUIRED SUBSTITUTIONS:**
${Object.entries(profile.preferredTerminology).map(([avoid, prefer]) => `- Instead of "${avoid}" → use "${prefer}"`).join('\n')}
`;
  }

  if (profile.requiredTerminology.length > 0) {
    guardrailsBlock += `
**REQUIRED TERMINOLOGY (MUST USE):**
${profile.requiredTerminology.map(term => `- "${term}"`).join('\n')}
`;
  }

  guardrailsBlock += `
### CONTENT PROHIBITIONS
The generated lesson MUST NOT contain content that:
${profile.guardrails.map(g => `- ${g}`).join('\n')}

### FINAL VERIFICATION
Before outputting the lesson, verify:
1. No prohibited terminology appears in any section
2. Required substitutions are applied consistently
3. ${profile.tulipStance === 'anti' ? 'No TULIP/Calvinist terminology is present' : 'Reformed/TULIP terminology is used appropriately'}
4. Security doctrine reflects: ${profile.securityDoctrine === 'eternal' ? 'Eternal Security (once saved, always saved)' : profile.securityDoctrine === 'conditional' ? 'Conditional Security (salvation can be forfeited through persistent unbelief)' : 'Perseverance of the Saints (the truly elect will persevere)'}
5. Content aligns with the theological lens described above
`;

  return guardrailsBlock;
}

// ============================================================================
// EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Legacy export for existing code that expects simple array
// Uses sorted order to respect displayOrder
export const THEOLOGY_PROFILE_OPTIONS = getTheologyProfileOptions();
