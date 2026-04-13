import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

const BASE_URL = process.env.DOCS_BASE_URL ?? "http://127.0.0.1:3000";
const ADMIN_IDENTIFIER = process.env.DOCS_ADMIN_IDENTIFIER ?? "admin";
const ADMIN_PASSWORD = process.env.DOCS_ADMIN_PASSWORD ?? "Istkon2026admin";

const docsDir = path.resolve("docs");
const screenshotsDir = path.join(docsDir, "screenshots");
const pdfPath = path.join(docsDir, "BuddyMatcher-Introduction-and-User-Guide-EN.pdf");

mkdirSync(screenshotsDir, { recursive: true });

const WEIGHTED_DIMENSIONS = [
  { key: "socialScore", label: "Social", weight: 18 },
  { key: "opennessScore", label: "Openness", weight: 16 },
  { key: "flexibilityScore", label: "Flexibility", weight: 14 },
  { key: "structureScore", label: "Structure", weight: 10 },
  { key: "partyScore", label: "Party style", weight: 14 },
  { key: "travelStyleScore", label: "Travel style", weight: 12 },
  { key: "communicationScore", label: "Communication", weight: 16 },
];

const FORCED_CHOICE_WEIGHTS = [
  { label: "Planning style", weight: "28%" },
  { label: "Buddy priority", weight: "28%" },
  { label: "Ideal activity", weight: "26%" },
  { label: "Time style", weight: "18%" },
];

const LIKERT_SECTIONS = [
  {
    title: "1. Social Energy & Interaction",
    questions: [
      "I easily start conversations with new people.",
      "I enjoy being in large social groups.",
      "I feel energized after social interactions.",
      "I prefer spending time alone rather than with a group.",
      "I actively participate in group activities.",
      "I like meeting new people from different backgrounds.",
      "I feel comfortable being the center of attention.",
      "I usually wait for others to approach me first.",
    ],
  },
  {
    title: "2. Openness & Cultural Curiosity",
    questions: [
      "I am excited to experience new cultures.",
      "I enjoy trying unfamiliar foods.",
      "I like learning different perspectives.",
      "I feel uncomfortable in unfamiliar environments.",
      "I adapt quickly to new situations.",
      "I enjoy stepping outside my comfort zone.",
      "I am curious about how people live in other countries.",
    ],
  },
  {
    title: "3. Planning & Lifestyle",
    questions: [
      "I prefer having a clear plan for the day.",
      "I get stressed when plans change suddenly.",
      "I like organizing activities in advance.",
      "I enjoy spontaneous decisions.",
      "Being on time is very important to me.",
      "I prefer structured schedules over flexible ones.",
      "I can easily adjust to unexpected changes.",
    ],
  },
  {
    title: "4. Social Activities & Party Style",
    questions: [
      "I enjoy nightlife and parties.",
      "I like high-energy social environments.",
      "I prefer calm and quiet activities.",
      "I enjoy dancing or active social events.",
      "I feel comfortable in loud environments.",
      "I prefer meaningful conversations over parties.",
    ],
  },
  {
    title: "5. Daily Rhythm",
    questions: [
      "I am more productive in the morning.",
      "I enjoy staying up late.",
      "I prefer starting the day early.",
      "I feel active during late hours.",
    ],
  },
  {
    title: "6. Travel & Exploration",
    questions: [
      "I prefer fast-paced travel schedules.",
      "I enjoy exploring multiple places in one day.",
      "I prefer relaxed travel with fewer activities.",
    ],
  },
  {
    title: "7. Communication & Comfort",
    questions: [
      "I feel confident communicating in English.",
      "I enjoy deep conversations with new people.",
      "I can maintain conversations easily.",
      "I prefer listening rather than speaking.",
    ],
  },
];

const FORCED_CHOICE_QUESTIONS = [
  {
    title: "8A. Which describes you better?",
    options: [
      "I plan ahead but can be flexible",
      "I am spontaneous but can plan when needed",
      "I prefer clear structure and detailed plans",
      "I go with the flow and adapt on the move",
    ],
  },
  {
    title: "8B. Which matters more in a buddy?",
    options: [
      "Fun and social",
      "Calm and reliable",
      "Curious and open to deep conversations",
      "Action-oriented and motivated",
    ],
  },
  {
    title: "8C. Ideal activity choice",
    options: [
      "Party / Social",
      "Cultural / Museum",
      "Mixed",
      "Outdoor / Nature",
      "Food / Coffee / City walk",
    ],
  },
  {
    title: "8D. Preferred time style",
    options: [
      "Early sleeper / early riser",
      "Late sleeper / night active",
      "Balanced day-night rhythm",
      "Late morning starter",
    ],
  },
];

function imageDataUri(filePath) {
  const bytes = readFileSync(filePath);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

async function capture(page, routePath, outputName, options = {}) {
  const { fullPage = false, waitForSelector } = options;
  await page.goto(`${BASE_URL}${routePath}`, { waitUntil: "networkidle" });
  if (waitForSelector) {
    await page.locator(waitForSelector).first().waitFor({ state: "visible", timeout: 20000 });
  }
  await page.waitForTimeout(700);
  const outputPath = path.join(screenshotsDir, outputName);
  await page.screenshot({ path: outputPath, fullPage });
  return outputPath;
}

function renderWeightedRows() {
  return WEIGHTED_DIMENSIONS.map(
    (item) => `
      <tr>
        <td>${item.label}</td>
        <td>${item.weight}</td>
      </tr>
    `,
  ).join("");
}

function renderForcedChoiceWeightRows() {
  return FORCED_CHOICE_WEIGHTS.map(
    (item) => `
      <tr>
        <td>${item.label}</td>
        <td>${item.weight}</td>
      </tr>
    `,
  ).join("");
}

function renderLikertQuestionGroups() {
  return LIKERT_SECTIONS.map(
    (section) => `
      <div class="question-group">
        <h3>${section.title}</h3>
        <ol>
          ${section.questions.map((q) => `<li>${q}</li>`).join("")}
        </ol>
      </div>
    `,
  ).join("");
}

function renderForcedChoiceQuestionGroups() {
  return FORCED_CHOICE_QUESTIONS.map(
    (question) => `
      <div class="question-group">
        <h3>${question.title}</h3>
        <ul>
          ${question.options.map((option) => `<li>${option}</li>`).join("")}
        </ul>
      </div>
    `,
  ).join("");
}

function buildHtml(images) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>BuddyMatcher Introduction and User Guide</title>
    <style>
      @page { margin: 20mm 15mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #1f2937;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.45;
        background: #ffffff;
      }
      h1, h2, h3 { margin: 0; }
      .cover {
        min-height: 90vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 16px;
        background: linear-gradient(145deg, #fff8e5 0%, #fff2c2 50%, #ffe7a1 100%);
        border: 2px solid #f8d267;
        border-radius: 18px;
        padding: 36px;
      }
      .cover h1 {
        font-size: 36px;
        color: #7c3e00;
        letter-spacing: 0.4px;
      }
      .cover p {
        font-size: 16px;
        max-width: 760px;
        margin: 0;
      }
      .badge {
        display: inline-block;
        width: fit-content;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        background: #7c3e00;
        color: #fff9e9;
        border-radius: 999px;
        padding: 7px 14px;
        letter-spacing: 0.08em;
      }
      .page-break {
        page-break-before: always;
      }
      .section {
        margin-bottom: 26px;
      }
      .section h2 {
        font-size: 24px;
        color: #8a4b00;
        margin-bottom: 6px;
      }
      .section p {
        margin: 0 0 14px;
        font-size: 14px;
      }
      .feature-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin: 14px 0 6px;
      }
      .feature {
        border: 1px solid #f1d693;
        border-radius: 12px;
        padding: 10px;
        background: #fffaf0;
      }
      .feature strong {
        display: block;
        margin-bottom: 4px;
        color: #7a3f00;
      }
      figure {
        margin: 0 0 18px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        background: #fff;
      }
      figcaption {
        font-size: 12px;
        color: #6b7280;
        padding: 8px 12px;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
      }
      img {
        width: 100%;
        height: auto;
        display: block;
      }
      ol {
        margin: 0;
        padding-left: 22px;
      }
      li {
        margin-bottom: 8px;
        font-size: 14px;
      }
      .tip-box {
        margin-top: 18px;
        border-left: 5px solid #d97706;
        background: #fff7e8;
        padding: 12px 14px;
        border-radius: 8px;
      }
      .tip-box h3 {
        font-size: 14px;
        margin-bottom: 6px;
        color: #92400e;
      }
      .tip-box p {
        margin: 0;
        font-size: 13px;
      }
      .math-block {
        margin: 12px 0;
        border: 1px solid #f1d693;
        border-radius: 10px;
        background: #fffaf0;
        padding: 10px 12px;
        font-family: Consolas, "Courier New", monospace;
        font-size: 12px;
        white-space: pre-wrap;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0 14px;
        font-size: 13px;
      }
      th, td {
        border: 1px solid #e5e7eb;
        padding: 8px;
        text-align: left;
      }
      th {
        background: #fff4d6;
        color: #7c3e00;
      }
      .question-group {
        margin-bottom: 14px;
        border: 1px solid #f1d693;
        border-radius: 10px;
        padding: 10px 12px;
        background: #fffdf7;
      }
      .question-group h3 {
        font-size: 14px;
        color: #7a3f00;
        margin-bottom: 6px;
      }
      .question-group ol,
      .question-group ul {
        margin: 0;
        padding-left: 20px;
      }
      .question-group li {
        margin-bottom: 4px;
        font-size: 12.5px;
      }
      .small-note {
        font-size: 12px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <section class="cover">
      <span class="badge">Product Brief</span>
      <h1>BuddyMatcher Introduction and User Guide</h1>
      <p>
        BuddyMatcher helps program organizers create high-quality one-to-one cultural exchange pairs by combining survey insights,
        profile context, and practical administration tools in one workflow.
      </p>
      <p>
        This guide introduces the main screens and explains how users and admins can operate the platform effectively.
      </p>
      <p><strong>Language:</strong> English</p>
    </section>

    <section class="page-break section">
      <h2>1. What BuddyMatcher Does</h2>
      <p>
        BuddyMatcher collects participant profile and survey data, computes compatibility, and presents each user with their recommended buddy.
      </p>
      <div class="feature-grid">
        <div class="feature">
          <strong>Structured Onboarding</strong>
          Participants provide public profile details and private matching answers.
        </div>
        <div class="feature">
          <strong>Compatibility-Driven Matching</strong>
          Pairing uses weighted survey dimensions and forced-choice preferences.
        </div>
        <div class="feature">
          <strong>Participant Directory</strong>
          All participants can browse public profiles and social links.
        </div>
        <div class="feature">
          <strong>Admin Controls</strong>
          CSV import, answer permissions, and match runs are centralized.
        </div>
      </div>
    </section>

    <section class="section">
      <h2>2. Main Screens</h2>
      <figure>
        <img src="${images.home}" alt="Home page" />
        <figcaption>Home page with clear navigation to login and registration.</figcaption>
      </figure>
      <figure>
        <img src="${images.login}" alt="Login page" />
        <figcaption>Login page where users sign in with username/email and password.</figcaption>
      </figure>
      <figure>
        <img src="${images.register}" alt="Register page" />
        <figcaption>Registration screen for new participant account creation.</figcaption>
      </figure>
      <figure>
        <img src="${images.forgot}" alt="Forgot password page" />
        <figcaption>Password recovery flow with verification code delivery.</figcaption>
      </figure>
    </section>

    <section class="page-break section">
      <h2>3. Dashboard Workflow</h2>
      <figure>
        <img src="${images.dashboard}" alt="Dashboard" />
        <figcaption>Dashboard with public profile editor, private answers entry point, and buddy overview.</figcaption>
      </figure>
      <figure>
        <img src="${images.privateAnswers}" alt="Private answers modal" />
        <figcaption>Private answers modal used for Likert and forced-choice matching inputs.</figcaption>
      </figure>
      <figure>
        <img src="${images.participants}" alt="Participants page" />
        <figcaption>Participants directory highlighting public bios, tags, and social links.</figcaption>
      </figure>
    </section>

    <section class="section">
      <h2>4. How To Use BuddyMatcher</h2>
      <ol>
        <li>Open BuddyMatcher and choose English from the language selector.</li>
        <li>Register a participant account or log in with existing credentials.</li>
        <li>Complete public profile details, including profile photo and short bio.</li>
        <li>Open the private answers modal and complete all survey questions.</li>
        <li>Save profile and answers to update compatibility calculations.</li>
        <li>Check the dashboard to view your assigned buddy when matching is available.</li>
        <li>Browse the participants directory to explore other public profiles.</li>
        <li>Admins can import CSV data and trigger matching from the admin panel.</li>
      </ol>
      <div class="tip-box">
        <h3>Operational Tip</h3>
        <p>
          For best matching quality, encourage participants to write clear bios in English and answer private questions consistently.
        </p>
      </div>
    </section>

    <section class="page-break section">
      <h2>5. Matching Algorithm (Detailed)</h2>
      <p>
        BuddyMatcher uses a two-step approach: first it calculates pairwise compatibility scores between Turkish and German participants,
        then it computes a global optimal assignment using the Hungarian algorithm.
      </p>

      <h3>5.1 Pair constraints</h3>
      <ul>
        <li>Only TR-DE pairs are allowed.</li>
        <li>TR and DE participant counts must be equal for one-to-one matching.</li>
        <li>If constraints are not met, matching is blocked.</li>
      </ul>

      <h3>5.2 Compatibility score per pair (0-100)</h3>
      <p>Weighted survey dimensions are normalized by absolute difference and contribute up to 76 points.</p>
      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          ${renderWeightedRows()}
        </tbody>
      </table>

      <p>Additional score components:</p>
      <ul>
        <li>Openness bridge score: up to +8 points.</li>
        <li>Night rhythm similarity: up to +4 points.</li>
        <li>Travel-after-program alignment: +4 if aligned, +0 otherwise.</li>
        <li>Forced-choice similarity: up to +8 points (fallback 4.4 for legacy profiles).</li>
      </ul>

      <p>Forced-choice internal weighting:</p>
      <table>
        <thead>
          <tr>
            <th>Forced-choice block</th>
            <th>Weight inside forced-choice similarity</th>
          </tr>
        </thead>
        <tbody>
          ${renderForcedChoiceWeightRows()}
        </tbody>
      </table>

      <div class="math-block">finalScore = clamp(0, 100,
  coreWeightedScore(0..76)
  + opennessBridge(0..8)
  + rhythmSimilarity(0..4)
  + travelAlignment(0 or 4)
  + forcedChoiceComponent(0..8)
)</div>

      <h3>5.3 Global assignment step (Hungarian)</h3>
      <ul>
        <li>Build a cost matrix with cost = 100 - compatibilityScore.</li>
        <li>Run Hungarian optimization to minimize total cost across all pairs.</li>
        <li>This produces a globally optimal matching, not a greedy local choice.</li>
        <li>For each final pair, BuddyMatcher stores score and an explanation string.</li>
      </ul>
    </section>

    <section class="page-break section">
      <h2>6. Questions Used for Matching</h2>
      <p class="small-note">
        Likert items use a 1-5 scale: 1 = Strongly disagree, 5 = Strongly agree.
      </p>

      ${renderLikertQuestionGroups()}

      <div class="question-group">
        <h3>Travel preference (yes/no)</h3>
        <ul>
          <li>I want to travel after the program. (Yes / No)</li>
        </ul>
      </div>

      ${renderForcedChoiceQuestionGroups()}
    </section>
  </body>
</html>
`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript(() => {
    window.localStorage.setItem("bm_locale", "en");
  });

  const page = await context.newPage();

  const homePath = await capture(page, "/", "01-home.png", { waitForSelector: "main" });
  const loginPath = await capture(page, "/login", "02-login.png", { waitForSelector: "form" });
  const registerPath = await capture(page, "/register", "03-register.png", { waitForSelector: "form" });
  const forgotPath = await capture(page, "/forgot-password", "04-forgot-password.png", { waitForSelector: "form" });

  const loginResponse = await context.request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      identifier: ADMIN_IDENTIFIER,
      password: ADMIN_PASSWORD,
    },
  });
  if (!loginResponse.ok()) {
    const body = await loginResponse.text();
    throw new Error(`Automated login failed: ${loginResponse.status()} ${body}`);
  }

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });

  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 20000 });
  await page.waitForTimeout(900);
  const dashboardPath = path.join(screenshotsDir, "05-dashboard.png");
  await page.screenshot({ path: dashboardPath, fullPage: true });

  const openAnswers = page.getByRole("button", { name: /Open answers/i });
  if (await openAnswers.count()) {
    await openAnswers.first().click();
    await page.waitForTimeout(700);
  }
  const privateAnswersPath = path.join(screenshotsDir, "06-private-answers-modal.png");
  await page.screenshot({ path: privateAnswersPath, fullPage: true });

  await page.goto(`${BASE_URL}/participants`, { waitUntil: "networkidle" });
  await page.waitForSelector('h1:has-text("Participants")', { timeout: 20000 });
  await page.waitForTimeout(700);
  const participantsPath = path.join(screenshotsDir, "07-participants.png");
  await page.screenshot({ path: participantsPath, fullPage: true });

  const pdfPage = await context.newPage();
  const html = buildHtml({
    home: imageDataUri(homePath),
    login: imageDataUri(loginPath),
    register: imageDataUri(registerPath),
    forgot: imageDataUri(forgotPath),
    dashboard: imageDataUri(dashboardPath),
    privateAnswers: imageDataUri(privateAnswersPath),
    participants: imageDataUri(participantsPath),
  });

  writeFileSync(path.join(docsDir, "BuddyMatcher-Guide-EN.html"), html, "utf8");

  await pdfPage.setContent(html, { waitUntil: "networkidle" });
  await pdfPage.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "16mm",
      right: "12mm",
      bottom: "16mm",
      left: "12mm",
    },
  });

  await browser.close();

  console.log("Guide generated successfully:");
  console.log(pdfPath);
}

main().catch((error) => {
  console.error("Failed to generate guide PDF.");
  console.error(error);
  process.exit(1);
});
