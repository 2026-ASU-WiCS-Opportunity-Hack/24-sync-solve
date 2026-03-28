### Mission & Vision

WIAL is a global non-profit dedicated to advancing Action Learning methodology. Founded by Dr. Michael Marquardt based on Reg Revans' work, WIAL certifies Action Learning Coaches and helps organizations solve business challenges while developing leaders.

# 🌌 Context

WIAL operates as an international network with chapters worldwide. Each chapter needs operational independence while maintaining global brand consistency. The organization certifies coaches at four levels (CALC, PALC, SALC, MALC) and requires ongoing education tracking for recertification.

## Key Personas (priority order)

Personas are the types of people who interact with WIAL.

### **1\. Chapter Lead / Affiliate Director**

**Role:** Manages regional WIAL chapter (e.g., WIAL-USA, WIAL Nigeria)

**Key Needs:**

- Create and maintain local chapter website with consistent WIAL branding
- Collect membership dues from local coaches \- this is not currently done, but a working solution that’s easy to use could change this.
- Re-establish the ability for local affiliates to globally advertise their local certification event calendars. This global visibility is necessary for effective branding, a process that is currently not occurring.
- Coordinate local certification programs and events
- Report membership and activity to global WIAL
- Manage local coach directory

**Pain Points:**

- No standardized system for dues collection
- Manual website setup and management
- Inconsistent branding across chapters
- Difficulty keeping parent site content synced

**Tech Comfort:** Medium (can use WordPress, basic admin tools)

---

### **2\. Certified Action Learning Coach (CALC)**

**Role:** Entry-level certified coach (32+ hours training, 2-year recertification cycle)

**Key Needs:**

- Track continuing education credits for recertification
- Access learning content (both free and paid)
- Maintain coaching session records (min 100 hours for PALC advancement)
- Receive automatic certification renewal reminders
- Access coach directory and community
- Recertification requirements and application forms need to be included in the new website design
- Nice to have: coaches to build their own Action Learning profile so they can advertise themselves to clients

**Pain Points:**

- No centralized place to track credits
- Scattered learning resources across multiple sites
- Manual certificate tracking

**Tech Comfort:** Medium (comfortable with online courses, basic platforms)

---

### **3\. Professional/Senior/Master Coaches (PALC/SALC/MALC)**

**Role:** Advanced certified coaches who train and mentor new coaches

**Key Needs:**

- Create and deliver CALC certification courses
- Track trainee progress across 32+ hour programs
- Evaluate practice sessions and submit assessments
- Manage multiple cohorts simultaneously
- Generate completion reports for certification

**Pain Points:**

- Manual tracking of trainee sessions
- No automated reporting for certifications
- Difficulty managing async and live training
- Can't easily scale mentorship

**Tech Comfort:** High (experienced with LMS, video conferencing, admin dashboards)

---

### **4\. Coach-in-Training / Prospective Coach**

**Role:** Individual completing CALC certification program

**Key Needs:**

- Clear learning path with 32+ hours structured content
- Submit practice session reports (minimum 2 sessions, 90 mins each)
- Track progress toward certification
- Receive certificate automatically upon completion
- Access to mentor/trainer feedback

**Pain Points:**

- Unclear requirements and progression
- No real-time progress visibility
- Delayed certificate issuance
- Difficulty scheduling practice sessions

**Tech Comfort:** Low to Medium (may be new to online learning)

---

### **5\. WIAL Global Administrator**

**Role:** Oversees all chapters worldwide from headquarters

**Key Needs:**

- Dashboard view of all chapter sites and memberships
- Push template/branding updates to all chapters instantly
- Track global coach certifications and compliance
- Generate organization-wide reports
- Manage global coach directory

**Pain Points:**

- No centralized visibility across chapters
- Manual distribution of brand updates
- Inconsistent data collection from chapters
- Can't enforce quality standards

**Tech Comfort:** High (technical admin capabilities)

---

### **6\. Content Creator / Course Designer**

**Role:** Develops learning materials for certification and continuing education

**Key Needs:**

- Build courses with videos, documents, quizzes, assignments
- Create learning paths that auto-issue certificates
- Update content without breaking learner progress
- Track content effectiveness (completion rates, feedback)
- Monetize advanced content while keeping intro courses free

**Pain Points:**

- No proper content management system
- Can't version or update live courses easily
- No analytics on content performance
- Manual course enrollment

**Tech Comfort:** High (instructional design background, LMS experience)

## Use Cases

These are the actions that people will perform, having an idea of flow that people take helps software engineers build out software more effectively.

### **Website Platform**

**UC1: Chapter Leader Creates New Chapter Site**

1. Chapter lead logs in to WIAL network platform
2. Selects "Create New Chapter" option
3. Enters chapter details (region, contact info, subdomain/path)
4. System automatically provisions site with WIAL template
5. Chapter lead customizes local content (events, team bios)
6. Site goes live at wial-\[region\].org or wial.org/\[region\]

**UC2: Global Admin Updates Branding**

1. Global admin updates header/footer/styling in parent site
2. System detects template change
3. Automated deployment pushes changes to all chapter sites
4. Chapter-specific content remains unchanged
5. Email notification sent to all chapter leads

**UC3: Chapter Lead Manages Local Coach Directory**

1. Chapter lead accesses coach management dashboard
   1. En lieu of a Chapter Lead, WIAL Global also does this for coaches in countries where the affiliate does not exist
2. Adds/removes coaches from chapter directory
3. Updates coach certifications and status
4. Coach appears in both local chapter directory and global directory
5. Changes sync to wial.org master directory

**UC4: Affiliates and instructors Pays Chapter Dues**

This process currently doesn’t exist today, but a working solution may allow WIAL Global to adopt and use this.

What we will require effective January 1st, 2026:

- $50 USD payment for each student being enrolled in our eLearning platform
- $30 USD payment for each student fully certified and encoded in the system as a coach
- Affiliates and instructors pay WIAL Global for the above, not the students

1. Coach logs in to chapter site
2. Navigates to "Renew Membership"
3. Selects payment method (Stripe/PayPal)
4. Completes payment
5. System updates membership status
6. Chapter lead receives payment notification and reports to global

**UC5: Organization Purchases Team Licenses**

Note: This would be a new process for WIAL. In-house organizational certification courses are currently handled by the instructors, so they follow the same process as public ones.

1. Corporate client wants to certify 50 internal coaches
2. Chapter lead creates bulk enrollment link
3. Organization purchases 50 CALC licenses
4. Team members self-enroll using company code
5. Platform tracks team progress
6. Reports sent to both organization and chapter lead

### **eLearning Platform \- Provided only as informational, we aren’t building this**

**UC6: Coach-in-Training Completes CALC Certification**

1. Trainee enrolls in CALC program via chapter or global site
2. Platform assigns structured 32+ hour learning path
3. Trainee completes modules (video, reading, quizzes)
4. Submits 2 practice session reports (90 mins each)
5. SALC/MALC mentor reviews and approves submissions
6. System automatically generates CALC certificate
7. Trainee receives digital credential and physical certificate option
8. 2-year recertification timer begins

**UC7: CALC Tracks Continuing Education for Recertification**

1. CALC logs in to learning platform dashboard
2. Views CE credits earned toward 2-year requirement
3. Browses available courses (free and paid)
4. Completes course and receives credit automatically
5. Platform sends reminder 3 months, 2 months, 1 month before recertification due
6. CALC completes required credits and recertifies

**UC8: SALC Creates and Delivers Training Cohort**

Note: What we don't have (but would be nice to have) is the capability for students from around the world to choose classes based on a calendar and join virtually.

1. SALC logs in with trainer role
2. Creates new CALC cohort (dates, capacity, pricing)
3. Assigns pre-built lesson plans or creates custom content
4. Trainees enroll and platform tracks attendance/completion
5. SALC evaluates submitted practice sessions
6. Platform generates certification for approved trainees
7. SALC exports completion report for records

**UC9: Content Creator Publishes New Course**

1. Content creator accesses course builder
2. Uploads videos, PDFs, SCORM packages
3. Creates assessments (quizzes, assignments)
4. Sets prerequisites and completion criteria
5. Defines certificate template
6. Sets pricing (free, one-time purchase, subscription)
7. Publishes course to catalog
8. Platform tracks enrollments and completion rates

---

# 🔭 Scope & Requirements

## Problem to Solve

**Website:** There are various chapters of WIAL all over the world, for each chapter it’s a challenge to have a standard way to collect dues, and allow for each chapter to maintain their own website, but maintain a standard template look and feel from the parent website.

## Scope

## **🖼 Website**

### **✅ P0 \- Must Haves**

1. **Minimal Viable Product (MVP)**
   - The most basic website, scroll-down type like a PDF file,
   - No integration to any third-party system.
   - To contact WIAL, we just provide the email address of the Executive Director
2. **Chapter Provisioning**
   - Note: Some affiliates have WIAL Action Learning as their only leadership offering, whereas others offer it as part of a suite of professional development. This might mean they link back to their own website for other offerings.
   - One-click chapter site creation by authorized chapter leads
   - Subdomain ([usa.wial.org](http://usa.wial.org), [nigeria.wial.org](http://nigeria.wial.org), etc.) OR subdirectory (wial.org/usa)
   - Auto-populated with WIAL template and core pages
   - **Role-Based Access Control**
   - **Super Admin (Global):** Full access to all sites, push template updates, manage all users
   - **Chapter Lead:** Create/manage chapter site, add local coaches, configure payment, manage local content only.
   - **Content Creator:** Edit content on assigned chapter(s), cannot change site structure
     1. Often, the Chapter lead is a content creator for their site, unless the chapter is very large and they have their own local board that manages the affiliate (like WIAL-USA).
   - **Coach:** View-only access to directory, can update own profile, pay dues
3. **Consistent Branding & Template Inheritance**
   - Parent template (header, footer, navigation, styling) enforced across all chapters
   - Chapter-specific content areas (events, team, local resources) editable by chapter leads
   - Template updates at parent level auto-deploy to all chapter sites
   - Override protection: chapters cannot break global styling
4. **Payment Integration**
   - Stripe and PayPal integration for dues collection
   - Payment receipts automated
   - Chapter-level reporting of collected dues
   - Global dashboard shows all chapter revenue
   - An automated method to handle dues not yet received via email reminders
5. **Coach Directory**
   - Global directory aggregating all coaches across chapters
   - Chapter-specific directories filtered by region
   - Fields: Name, Photo, Certification Level (CALC/PALC/SALC/MALC), Location, Contact, Bio
   - Searchable and filterable by location, certification level
   - Coaches can update own profiles
   - Certification badges display automatically based on LMS data, these are reviewed and approved by the executive director and are not active and published until approved.
6. **Core Pages from Current WIAL.org**
   - About WIAL
   - Certification Information
   - Coach Directory
   - Resources & Library
   - Events Calendar (global \+ chapter-specific)
   - Contact

### **🤔 P1 \- Should Haves**

1. **Multi-language Support**
   - Template available in English, Spanish, Portuguese, French
   - Chapters can select primary language
2. **Organizational Client List**
   - At either the Global or Chapter level, allow the ability to add specific clients supported by WIAL. With links to their website and their logo.
3. **Testimonials**
   - At either the Global or Chapter level allow testimonial videos or text quotes to be provided from clients.
4. **Event Management**
   - Chapter leads create local events
   - Events roll up to global calendar
   - RSVP and ticketing integration
5. **Email Campaigns**
   - Built-in newsletter system
   - Segment by chapter, certification level
   - Templates for announcements, recertification reminders
6. **Analytics Dashboard**
   - Traffic analytics per chapter
   - Membership growth tracking
   - Payment conversion metrics

### **🫣 P2 \- Nice to Haves**

1. **Mobile App**
   - iOS/Android app for coach directory and events
   - Push notifications for recertification reminders
2. **Member Forums**
   - Chapter-specific and global discussion forums
   - Q\&A for coaches
3. **Job Board**
   - Organizations post Action Learning coaching opportunities
   - Coaches can apply directly

### **🤖 Why AI Is Core to This Problem**

WIAL operates across 20+ countries, 10+ languages, and vastly different economic contexts. This creates matching, translation, and pricing challenges that are **structurally unsolvable at scale without AI.** Teams building this solution should pick 1-2 of the following AI features. Without at least one, the platform is just a static website builder.

#### **AI-1: Cross-Lingual Semantic Coach Directory Search (Recommended — Highest Impact)**

**The problem:** Someone in Lagos searching "team dynamics in manufacturing" must find a coach whose profile is written in Portuguese. Keyword search and filters cannot do this across languages. The directory becomes unusable for a global audience.

| Aspect                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **How it works**       | Embed each coach profile (bio, specializations, location) using a multilingual embedding model (Cohere `embed-multilingual-v3.0` or open-source `intfloat/multilingual-e5-small`). Store vectors in Supabase pgvector. At query time, embed the user's natural language query in any language, retrieve by cosine similarity. Layer an LLM to parse complex queries like "I need a SALC near São Paulo who works with government agencies" into structured filters \+ semantic search. |
| **Tech stack**         | Supabase pgvector (free tier), OpenAI or Cohere embeddings (\~$0.02/1M tokens), Claude or GPT-4o-mini for query parsing. Total cost: near zero.                                                                                                                                                                                                                                                                                                                                        |
| **Hackathon MVP**      | Search bar on coach directory. Embed all seed coach profiles at build time. Demo: type a query in Portuguese, retrieve coaches with English profiles. Show it finding results keyword search would miss.                                                                                                                                                                                                                                                                               |
| **Why it's essential** | Without this, the coach directory is 20 disconnected filtered lists. With it, WIAL has the only multilingual professional directory in the Action Learning space. Remove the AI and cross-lingual discovery is impossible.                                                                                                                                                                                                                                                             |
| **Hours to MVP**       | 2–4 hours                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

#### **AI-2: "Chapter-in-a-Box" — AI Content Generation for Chapter Sites**

**The problem:** Creating 20+ culturally-adapted chapter websites manually requires professional translators ($0.10–0.25/word × thousands of words × 20+ languages \= tens of thousands of dollars). Every content update needs re-translation. Smaller chapters (Ghana, Philippines) get inferior websites or none at all.

| Aspect                 | Detail                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **How it works**       | Chapter lead provides: coach roster, upcoming events, local testimonials, and selects language. LLM generates culturally-adapted page content — not just translated, but adjusted for local tone and examples. Brazilian Portuguese content references local business culture; Nigerian English uses appropriate formality. Output populates the chapter template. |
| **Tech stack**         | Claude or GPT-4o-mini. Cost: \~$0.02–0.10 per page generation. Cache generated content — regenerate only on updates.                                                                                                                                                                                                                                               |
| **Hackathon MVP**      | "Generate Chapter Content" button in chapter admin. Input: chapter name, 3 coach profiles, 1 event, 1 testimonial. Output: complete page content in target language in \~60 seconds. Demo generating Kenya (English) then Brazil (Portuguese) side by side.                                                                                                        |
| **Why it's essential** | Without this, chapter leads manually write and translate all content (or don't, and the site stays empty). This is the difference between 3 active chapter sites and 20+.                                                                                                                                                                                          |
| **Hours to MVP**       | 3–5 hours                                                                                                                                                                                                                                                                                                                                                          |

#### **AI-3: Smart Coach Matching (Stretch)**

**The problem:** A prospective client visits WIAL wanting to hire a coach but doesn't know how to navigate certification levels, specializations, or which chapter to contact. Current directory requires the user to already know what they're looking for.

| Aspect            | Detail                                                                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **How it works**  | Natural language intake: "We're a mid-size manufacturing company in Brazil looking to develop our leadership team." AI decomposes into: location (Brazil), domain (manufacturing), need (leadership development), and returns ranked coach recommendations with explanations of why each matches. |
| **Tech stack**    | Same embedding infrastructure as AI-1 \+ LLM reasoning layer. Marginal additional cost.                                                                                                                                                                                                           |
| **Hackathon MVP** | "Find a Coach" conversational widget on homepage. 3–5 demo queries showing intelligent matching vs. basic filters.                                                                                                                                                                                |
| **Hours to MVP**  | 2–3 hours (if AI-1 is already built)                                                                                                                                                                                                                                                              |

#### **AI-4: Knowledge Engine — AI-Powered Content from Journal Articles & Webinars**

#### **The problem:** WIAL has years of research published in the Action Learning Journal and a library of past/upcoming webinars. This content is invisible to most coaches and prospective clients — journal articles are long-form English PDFs, webinars are hour-long recordings. Nobody browses a 45-page PDF archive to decide if Action Learning is right for their organization. The knowledge exists but the format kills discoverability.

| Aspect                 | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **How it works**       | **Research side:** Upload journal article PDFs → AI generates: (1) 3-sentence plain-language summary, (2) key findings with relevance tags (e.g., "government sector," "team performance," "leadership development"), (3) translated summaries in chapter languages. Summaries are searchable alongside coach profiles — so a query like "does Action Learning work for healthcare teams?" returns both relevant coaches _and_ supporting research. **Marketing side:** Paste a webinar description or transcript → AI generates: social media copy (LinkedIn, Instagram), email teaser text, and a structured outline that a chapter lead can hand to a video editor for a 60-second clip. Not AI-generated video — AI-generated _scripts and hooks_ from existing content. |
| **Tech stack**         | Claude or GPT-4o-mini for summarization and content generation. Same embedding/pgvector infrastructure as AI-1 for making summaries searchable. PDF text extraction via pdf-parse. Cost: \~$0.02–0.05 per article, \~$0.01 per marketing snippet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Hackathon MVP**      | Seed 5–10 real Action Learning Journal articles. Show: (1) "Research Library" page with AI-generated summaries and language toggle, (2) search query like "impact of Action Learning on employee retention" returning relevant article summaries \+ matching coaches, (3) "Promote This Webinar" button that generates LinkedIn post \+ email draft from a webinar title and description.                                                                                                                                                                                                                                                                                                                                                                                    |
| **Why it's essential** | Without AI, journal articles sit unread in English-only PDFs and webinar promotion is manually written per-chapter. With it, WIAL's research becomes a multilingual sales tool — a prospective client finds evidence that Action Learning works in their industry _and_ a coach who can deliver it, in one search. Chapter leads get ready-to-post marketing content instead of staring at a blank page.                                                                                                                                                                                                                                                                                                                                                                     |
| **Hours to MVP**       | 3–5 hours                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

####

#### **Recommended Hackathon Strategy**

Complete all P0 website features (hours 0–12), then build **AI-1: Cross-Lingual Search** (hours 12–16). If time remains, add **AI-2: Chapter-in-a-Box** (hours 16–20). Together these prove this isn't just another website builder — it's an AI-native platform for running a global network. The demo narrative: generate a chapter site for Kenya in 60 seconds, then search the coach directory in Portuguese and retrieve English-language profiles.

#### **AI Cost Estimate**

| Feature                    | API Used           | Cost Per Use    | Monthly Est. (20 chapters, 200 coaches) |
| -------------------------- | ------------------ | --------------- | --------------------------------------- |
| Coach Directory Search     | Embeddings \+ LLM  | \~$0.002/query  | $1–5                                    |
| Chapter Content Generation | Claude/GPT-4o-mini | $0.02–0.10/page | $0.50–2 (mostly cached)                 |
| Smart Coach Matching       | Embeddings \+ LLM  | \~$0.005/query  | $1–3                                    |
| **TOTAL**                  |                    |                 | **$2–10/month**                         |

---

### **🌍 Global Accessibility: Low-Bandwidth Design Requirements**

WIAL has chapters in Nigeria, the Philippines, Brazil, and other regions where mobile data is expensive and connections are slow. The median web page in 2025 is 2,559 KB — that takes nearly a minute on a 2G connection and costs real money in sub-Saharan Africa where 1 GB can be 6–7% of monthly income.

**Performance Targets:**

| Page Type            | Max Size (compressed) | Why                                 |
| -------------------- | --------------------- | ----------------------------------- |
| Chapter landing page | ≤ 200 KB              | Loads in \~4s on slow 3G            |
| Coach directory page | ≤ 500 KB              | 5× lighter than median web page     |
| Image-heavy pages    | ≤ 800 KB              | Thumbnails only; click to load full |

**Required Techniques:**

- **Images:** AVIF primary, WebP fallback, JPEG last resort via `<picture>` element. No single image \> 50 KB. Lazy-load below-fold images.
- **Fonts:** System font stack (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`). Zero custom web fonts unless absolutely required for branding (saves 200–600 KB).
- **JavaScript:** Target \< 100 KB total JS on content pages. Use static site generation (SSG) — pre-build HTML at deploy time, not on every request.
- **Offline support:** Service workers cache the app shell on first visit. Form submissions (dues payment initiation, coach profile edits) queue and sync when connectivity returns.
- **Compression:** Brotli (15–25% smaller than gzip) on all static assets. Pre-compress at build time.

**Hosting Recommendation for Global Reach:** Cloudflare Pages (free tier: unlimited bandwidth, 500 builds/month) \+ Cloudflare's CDN with **330+ edge locations including \~32 African cities** (Lagos, Nairobi, Kigali, Kampala, etc.). No other CDN comes close to this African/SE Asian coverage. **Cloudflare Project Galileo** provides free Business-plan services (\~$200/month value) to qualifying nonprofits — DDoS protection, WAF, and bot management at zero cost.

**Total hosting cost: \~$10/year** (domain only). This is dramatically cheaper than the WordPress Multisite estimate of $6,000–13,000 Year 1\.

---

## **Technical Recommendations**

### **Website Platform**

**Recommended Solution:** Primary: A solution created by Opportunity Hack, Secondary: WordPress Multisite

#### Primary: A solution created by Opportunity Hack

**Why:**

- Cost of maintenance (needs to be updated, updates might break, etc)
- Security (considerable issues with WordPress security)
- Cost \- WordPress will likely have a considerable cost of licensing and hosting

#### Secondary: Wordpress Multisite

For Hackers who aren’t super technical, it might be easier to implement via WordPress.

**Why:**

- Native multi-site management (perfect for global \+ chapters)
- Subdomain or subdirectory support
- Template inheritance with child theme overrides
- Large plugin ecosystem for payments, directories, events
- Cost-effective (hosting \+ domain costs only)
- User roles built-in (Super Admin, Admin, Editor, Author)

**Key Plugins:**

- WooCommerce \+ Subscriptions (membership dues)
- Advanced Custom Fields (coach directory)
- The Events Calendar (event management)
- WPML (multi-language)
- Gravity Forms (contact/registration)

---

## **Success Metrics**

### **Website**

- Number of active chapter sites
- Membership growth rate per chapter
- Payment conversion rate above 90% \- the number of people who intend to make a payment by starting the process actually complete the payment
- Template update deployment success (0 errors)

---

## **Risks & Mitigations**

| Risk                                 | Impact | Mitigation                                             |
| ------------------------------------ | ------ | ------------------------------------------------------ |
| Chapters resist centralized template | Medium | Provide customization zones, gather feedback early     |
| Payment integration issues           | High   | Test thoroughly with each chapter's currency/region    |
| Content migration from old system    | Medium | Phased rollout, migration tools, dedicated support     |
| Hosting costs exceed budget          | Medium | Start with shared hosting, scale to VPS as needed      |
| Technical skill gap in chapter leads | Medium | Create detailed documentation, offer training webinars |

---

# Dec 17, 2025 Notes

**User Roles:**

1. General public
2. Subsidiaries
3. Admin (currently uses Brilliant Directories, WordPress, Constant Contact)

**Priority Objectives (P0-P2):**

- **P0 (Highest):** Develop an impressive public-facing website.
- **P1:** Enable affiliate directors to create consistent, branded chapter websites.
- **P2:** Implement administrative updates.

**Functional Requirements/Opportunities:**

- **Coach Directory:** Centralize the coach directory function within the main website.
- **Payment Collection:** Implement the ability to collect recertification and classwork payments from individual coaches and affiliates.
- **Visibility:** Explore options (e.g., a mobile app) to increase coach visibility.

**Existing System/Integration Notes (No Current Issues):**

- **Badges/Certification:** Uses Credly. Mark handles system enrollment and digital badge issuance _outside_ the website; coaches display these badges independently.
- **Learning Management System (LMS):** An external LMS is used for course delivery. Feedback on eLearning assignments is collected when the instructor delivers content on Day 1\. Coaches are not expected to create content. WIAL likes this current LMS and we should not look to modify this.
