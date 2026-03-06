# BibleLessonSpark — Booklet Format Specification
## Mimicking Published Curriculum Style for Home Printing
### Based on: *Explore the Bible* Personal Study Guide (LifeWay)

---

## WHAT THIS DOCUMENT IS

This is the design specification Claude needs to produce a print-ready PDF from any
BibleLessonSpark lesson series. It is derived by studying a published Southern Baptist
curriculum (LifeWay's *Explore the Bible* Personal Study Guide) and adapting its
design decisions for 8.5×11" home printer output with mirrored margins.

Save this file alongside `BLS_PrintCurriculum_Prompt.md`. When starting a new
conversion session, give Claude both files.

---

## SECTION 1 — PAGE SETUP

| Setting            | Value                                      |
|--------------------|--------------------------------------------|
| Page size          | 8.5 × 11 inches (U.S. Letter)             |
| Orientation        | Portrait only                              |
| Inner margin       | 0.75" (binding/gutter side)               |
| Outer margin       | 1.05" (open/outer edge)                   |
| Top margin         | 0.85"                                      |
| Bottom margin      | 0.75"                                      |
| Mirrored margins   | YES — odd pages gutter left, even gutter right |
| Text block width   | 6.70" (same on every page)                |

### Why Mirrored Margins Matter
When pages are stacked and stapled as a booklet, every page must have its narrower
margin at the center (binding) and its wider margin at the outside edge. Without
mirrored margins, every other page has the wrong margin balance.

---

## SECTION 2 — TYPOGRAPHY

### 2A. Recommended Font Stack
The published curriculum uses a commercial type family. For home printing on standard
Windows/Mac machines, these system fonts produce the closest result:

| Role              | Font                  | Size  | Weight/Style   |
|-------------------|-----------------------|-------|----------------|
| Body text         | Georgia               | 10.5pt| Regular        |
| Body alt          | Times New Roman       | 11pt  | Regular        |
| Section labels    | Arial / Helvetica     | 8pt   | Bold, ALL CAPS |
| Lesson title      | Georgia               | 20pt  | Bold           |
| Lesson subtitle   | Georgia               | 12pt  | Italic         |
| Verse label       | Arial                 | 8.5pt | Bold, ALL CAPS |
| Pull quote        | Georgia               | 12pt  | Bold Italic    |
| Sidebar head      | Arial                 | 8pt   | Bold, ALL CAPS |
| Sidebar body      | Georgia               | 9.5pt | Regular        |
| Footer            | Arial                 | 7.5pt | Regular        |
| Page number       | Arial                 | 8pt   | Regular        |
| Discussion Q#     | Arial                 | 9pt   | Bold           |

### 2B. Leading (Line Spacing)
- Body text: 15pt leading (approximately 1.43× font size)
- Pull quotes: 17pt leading
- Sidebar body: 13.5pt leading
- Section labels: 11pt leading

### 2C. Spacing
- After body paragraph: 6pt
- After section heading: 4pt
- Before section heading: 10pt
- After verse label: 2pt
- After bullet: 4pt

### 2D. Justification
- Body text: fully justified
- Headers, labels, pull quotes: left-aligned
- Footer text: left (series title) and right (page number) — same baseline

---

## SECTION 3 — COLOR PALETTE

| Name          | Hex       | Use                                        |
|---------------|-----------|--------------------------------------------|
| Rust/Orange   | #C4622D   | All accent headings, question numbers, dots|
| Dark text     | #1A1A1A   | All body text                              |
| Medium gray   | #555555   | Footer, captions, verse refs, profile tags |
| Rule gold     | #C9A84C   | Horizontal rules                           |
| Sidebar gray  | #F2F0EC   | "Did You Know?" and "Bible Skill" box bg  |
| Sidebar border| #D8D4CC   | Border around sidebar boxes                |
| White         | #FFFFFF   | Text over dark session opener photo area   |
| Session dark  | #3D2B1F   | Semi-transparent overlay on opener photo   |

### Notes on Orange vs. Gold
The published curriculum uses a warm rust/orange for interactive elements (discussion
questions, section label accents). The gold rule color (#C9A84C) from the KnowingGod
booklet is retained for horizontal dividers only. Do not mix them.

---

## SECTION 4 — PAGE STRUCTURE

### 4A. Session Opener Page (one per lesson)

```
┌─────────────────────────────────┐
│ [PHOTO — full width, ~2.8" tall]│  ← Black & white or muted photo
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░ SESSION N label (rust)        │  ← Top right of photo area
│ ░                               │
│ ░ LESSON TITLE (white, bold)    │  ← Lower left of photo overlay
│ ░ Subtitle (white, italic)      │
└─────────────────────────────────┘
  [Scripture reference — bold]
  [Introductory paragraph — 2-3 sentences]
  [Opening question with rust circle Q1]
  [Date of My Bible Study: _________]  ← bottom of page
```

**For home-printer simplicity:** Replace the photo with a solid rust/orange header
band (0.9" tall) containing the lesson title in white. This avoids photo printing
issues on plain paper printers.

### 4B. Context Section

Header format: **UNDERSTAND** `[rust]`**THE CONTEXT**
- "UNDERSTAND" in dark text, Arial Bold 11pt
- "THE CONTEXT" in rust (#C4622D), Arial Bold 11pt
- Full-width gold rule below

Sub-sections: PSALM/PASSAGE REFERENCE in Arial Bold 8.5pt, ALL CAPS, dark text

### 4C. Explore Section

Header format: **EXPLORE** `[rust]`**THE TEXT**
- Same mixed-color pattern as above

Sub-sections use VERSE N or VERSES N-N in Arial Bold 8.5pt, ALL CAPS

### 4D. Apply Section

Header format: **APPLY** `[rust]`**THE TEXT**

Contains:
- 3–4 bullet point summary statements (rust bullet •)
- 2–3 numbered discussion questions (rust circle)
- Memory verse prompt
- Prayer Needs lines (4–5 ruled lines for handwriting)

### 4E. Special Content Boxes

**"DID YOU KNOW?" box:**
- Light gray background (#F2F0EC)
- Thin border (#D8D4CC)
- Header: "DID YOU KNOW?" in Arial Bold 8pt, rust color
- Body: Georgia 9.5pt

**"BIBLE SKILL" box:**
- Same styling as Did You Know
- Header: "BIBLE SKILL" in Arial Bold 8pt, rust color

**"KEY DOCTRINE" box:**
- Rust left border (3pt rule)
- "KEY DOCTRINE:" label in Arial Bold 8.5pt rust, followed by doctrine name
- Body text italic

**"COVENANT MADE / COVENANT FULFILLED" box:**
- Section label in rust, Bold
- Scripture reference in parentheses
- Indented verse block in italic

**Pull Quote:**
- Georgia Bold Italic 12pt
- No box — sits mid-column between paragraphs
- No quotation marks on the block itself
- 18pt left and right indent
- 8pt space above and below

---

## SECTION 5 — DISCUSSION QUESTIONS

### Format
Every discussion question uses a rust-colored circle with a white number inside,
followed by the question text.

```python
# ReportLab implementation:
from reportlab.platypus import Flowable

class QuestionBullet(Flowable):
    """Draws a rust circle with number, then question text beside it."""
    # Circle: 14pt diameter, fill #C4622D
    # Number: Arial Bold 8pt, white, centered in circle
    # Question text: Georgia 10.5pt, starts 18pt right of circle center
    # Vertical alignment: circle center aligns with first text baseline
```

### Placement Rules
- Discussion questions appear embedded within the lesson content, not only at the end
- At least one question per major section (Context, Explore verse block, Apply)
- Questions should follow directly after the content they reference
- Never place a question at the bottom of a page without its content above it (use KeepTogether)

---

## SECTION 6 — HORIZONTAL RULES

| Location                        | Thickness | Color   |
|---------------------------------|-----------|---------|
| Below session header block      | 1.5pt     | #C9A84C |
| Below section heading (Context, Explore, Apply) | 0.8pt | #C9A84C |
| Below verse label               | 0.4pt     | #C9A84C |
| Footer rule                     | 0.4pt     | #C9A84C |
| Key Doctrine left border        | 3pt       | #C4622D |

---

## SECTION 7 — FOOTER

Every page except the session opener:
```
[Series Title]              biblelessonspark.com · [N]
────────────────────────────────────────────────────
```
- Left: Lesson series title, Arial 7.5pt, gray (#555555)
- Right: "biblelessonspark.com · [page number]", Arial 7.5pt, gray
- Rule: 0.4pt gold (#C9A84C), spanning from inner to outer margin
- Positioned 0.25" above bottom of page

Session opener footer:
```
Date of My Bible Study: ___________________________
```
- Italic, Georgia 9pt, gray
- Positioned at very bottom of page

---

## SECTION 8 — CONTENT FLOW ORDER (Per Lesson)

1. **Session Opener** (always starts on odd/right-hand page)
   - Session number + title header band
   - Scripture passage reference
   - 2–3 sentence introduction
   - Opening discussion question

2. **Understand the Context**
   - Passage/book background
   - Historical/theological context
   - 1–2 embedded discussion questions

3. **Explore the Text** (one sub-section per major passage block)
   - Verse label
   - Verse-by-verse exposition
   - Pull quotes for key theological statements
   - Did You Know? / Bible Skill sidebars as appropriate
   - Key Doctrine box
   - 1–2 embedded discussion questions per section

4. **Apply the Text**
   - 3–4 bullet summary statements
   - 2–3 application discussion questions
   - Memory verse prompt
   - Prayer Needs lines

5. **Student Handout** (separate section at back of booklet)
   - One handout per lesson
   - Key Idea, Big Points, Reflection Questions, Weekly Challenge

---

## SECTION 9 — WHAT TO OMIT FOR HOME PRINTING

The following elements from the published curriculum do NOT translate well to home
printer output and should be omitted or simplified:

| Published Element         | Home Printer Substitute                    |
|---------------------------|--------------------------------------------|
| Full-bleed photo          | Solid rust header band (0.9" × full width) |
| Two-color process printing | One accent color only (#C4622D + black)   |
| Bleed/crop marks          | Standard page margins, no bleeds           |
| Coated paper effects      | Design works on plain 20lb copy paper      |
| Spot UV/gloss elements    | None — flat design only                    |

---

## SECTION 10 — UPDATED CLAUDE PROMPT ADDITIONS

Add this block to the existing `BLS_PrintCurriculum_Prompt.md` under
**OUTPUT SPECIFICATION**:

```
**Session opener page:**
- Replace photos with a solid rust (#C4622D) header band, 0.9" tall, full text-block width
- Lesson title in white Georgia Bold 20pt, left-aligned, vertically centered in band
- Session number label "SESSION N" in Arial Bold 8pt, white, top right of band
- Scripture reference below band in Arial Bold 9pt, dark text
- Introductory paragraph in body style
- Opening question using rust circle bullet

**Discussion questions:**
- Rust filled circle (14pt diameter) with white bold number centered inside
- Question text in Georgia 10.5pt beside the circle
- Wrap question text if multi-line — circle stays top-aligned
- Use KeepTogether so question never separates from its circle

**Content boxes (Did You Know, Bible Skill, Key Doctrine):**
- Light gray background (#F2F0EC), thin border (#D8D4CC)
- Label in Arial Bold 8pt rust, body in Georgia 9.5pt
- 6pt padding inside box, 8pt space above and below box

**Pull quotes:**
- Georgia Bold Italic 12pt, leading 17pt
- 18pt left and right indent
- No box, no quotation marks in the block itself
- 8pt spaceBefore and spaceAfter

**Apply section:**
- Rust bullet points (•) for summary statements
- Ruled lines for Prayer Needs (draw 4 lines, 6pt apart, gray #C9A84C, 0.4pt)
- Memory verse in key_verse style already defined

**Section headers — mixed color:**
- Word 1 (e.g. "UNDERSTAND"): Arial Bold 11pt, dark (#1A1A1A)
- Word 2+ (e.g. "THE CONTEXT"): Arial Bold 11pt, rust (#C4622D)
- These are two adjacent Paragraphs on the same line — use a Table with
  no border, two cells, to place them side by side without a gap
```

---

## SECTION 11 — HOME PRINTER OPTIMIZATION NOTES

### Paper
Plain 20lb white copy paper works fine. 24lb is slightly better (less show-through).

### Ink
The design uses only black + one color (rust). If printing on a black-only laser
printer, substitute rust with 40% black for all accent elements. This is handled
automatically if you tell Claude: "black-only printer."

### Duplex printing
All modern home printers support duplex (two-sided) printing. In the printer dialog:
- Select "Print on Both Sides" or "Duplex"
- Select "Flip on Short Edge" (for portrait pages)
This produces correct page sequencing automatically without any booklet imposition.

### Stapling
After printing, fold the stack in half and staple along the spine with a long-reach
stapler, or use a regular stapler opened flat to staple through the spine from outside.

### Page count
This format targets 28–36 pages for a 7-lesson series. That is 7–9 sheets of paper
per booklet — well within home printer capability.

---

## SECTION 12 — QUICK REFERENCE CARD

```
FONT:        Georgia (body) / Arial (labels, headers, footer)
BODY SIZE:   10.5pt Georgia, 15pt leading, justified
ACCENT:      #C4622D (rust/orange) — questions, section accents
RULES:       #C9A84C (gold) — all horizontal dividers
MARGINS:     0.75" inner / 1.05" outer / 0.85" top / 0.75" bottom
MIRRORED:    Yes — odd pages gutter left, even pages gutter right
OPENER:      Solid rust band, white title text
QUESTIONS:   Rust circle + number, Georgia 10.5pt text beside
SIDEBARS:    Gray bg #F2F0EC, rust label, Georgia 9.5pt body
PULL QUOTE:  Georgia Bold Italic 12pt, indented 18pt, no box
FOOTER:      Arial 7.5pt gray, left=series, right=url+page
```

---

*BibleLessonSpark.com · Format Specification v1.0 · March 2026*
*Reference source: LifeWay Explore the Bible Personal Study Guide (observed layout)*
