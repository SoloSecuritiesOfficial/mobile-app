export type CertificateHtmlData = {
  _id?: string;
  title?: string;
  category?: string;
  certificateId?: string;
  issuedBy?: string;
  issuedTo?: string;
  description?: string;
  skills?: string[];
  issueDate?: string;
  createdAt?: string;
  verified?: boolean;
  status?: string;
  verificationUrl?: string;
};

export type CertificateHtmlOptions = {
  recipientName?: string;
  logoDataUri?: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value?: string): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function generateCertificateHtml(
  certificate: CertificateHtmlData,
  options: CertificateHtmlOptions = {}
): string {
  const recipientName =
    options.recipientName?.trim() ||
    certificate.issuedTo?.trim() ||
    "Certificate Holder";

  const title =
    certificate.title?.trim() || "Cybersecurity Achievement";

  const issuer =
    certificate.issuedBy?.trim() || "SoloSecurities";

  const category =
    certificate.category?.trim() || "Cybersecurity";

  const certificateId =
    certificate.certificateId?.trim() ||
    certificate._id?.trim() ||
    "Not available";

  const issueDate = formatDate(
    certificate.issueDate || certificate.createdAt
  );

  const description =
    certificate.description?.trim() ||
    "In recognition of demonstrated knowledge, practical learning, and achievement in cybersecurity.";

  const verified =
    certificate.verified === true ||
    certificate.status?.toLowerCase() === "verified";

  const skills = (certificate.skills || [])
    .filter(
      (skill) =>
        typeof skill === "string" && skill.trim().length > 0
    )
    .slice(0, 6)
    .map(
      (skill) =>
        `<span class="skill">${escapeHtml(skill.trim())}</span>`
    )
    .join("");

  const logo = options.logoDataUri
    ? `<img class="logo" src="${escapeHtml(
        options.logoDataUri
      )}" alt="SoloSecurities logo" />`
    : `
      <div class="logoFallback" aria-label="SoloSecurities shield">
        <svg viewBox="0 0 64 72" aria-hidden="true">
          <path
            d="M32 3 L57 13 V32 C57 49 46 61 32 68 C18 61 7 49 7 32 V13 Z"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          />
          <path
            d="M20 35 L28 43 L45 25"
            fill="none"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    `;

  const verificationUrl = certificate.verificationUrl?.trim();

  const verification = verificationUrl
    ? `
      <div class="verification">
        <span class="verificationDot"></span>
        <span class="verificationLabel">VERIFY ONLINE</span>
        <span class="verificationUrl">${escapeHtml(verificationUrl)}</span>
      </div>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
  />

  <meta name="color-scheme" content="light" />

  <title>${escapeHtml(title)} | SoloSecurities</title>

  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html,
    body {
      width: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0;
      background: #f0f2f5;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
    }

    body {
      padding: 12px;
    }

    .stage {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .certificate {
      position: relative;
      isolation: isolate;
      width: 100%;
      aspect-ratio: 1.414 / 1;
      min-height: 0;
      overflow: hidden;
      background: #ffffff;
      color: #101010;
      border: 1px solid #d8d8d8;
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.12);
    }

    /* Technical background */

    .darkPanel {
      position: absolute;
      z-index: -2;
      top: 0;
      right: 0;
      width: 23%;
      height: 100%;
      background: #090909;
      clip-path: polygon(28% 0, 100% 0, 100% 100%, 0 100%, 16% 77%, 0 57%);
    }

    .topAccent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 7px;
      background: linear-gradient(
        90deg,
        #090909 0%,
        #090909 55%,
        #dc143c 55%,
        #dc143c 100%
      );
    }

    .bottomAccent {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: #dc143c;
    }

    .outerFrame {
      position: absolute;
      inset: 12px;
      border: 1px solid #171717;
      pointer-events: none;
    }

    .innerFrame {
      position: absolute;
      inset: 17px;
      border: 1px solid rgba(220, 20, 60, 0.7);
      pointer-events: none;
    }

    .circuitPattern {
      position: absolute;
      z-index: -1;
      right: 1%;
      top: 5%;
      width: 27%;
      height: 37%;
      opacity: 0.8;
      pointer-events: none;
    }

    .watermark {
      position: absolute;
      z-index: -1;
      left: 27%;
      bottom: 13%;
      width: 35%;
      opacity: 0.045;
      pointer-events: none;
    }

    /* Header */

    .header {
      position: absolute;
      top: 7%;
      left: 7%;
      right: 7%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .logo,
    .logoFallback {
      width: clamp(28px, 5vw, 48px);
      height: clamp(28px, 5vw, 48px);
      flex-shrink: 0;
      object-fit: contain;
    }

    .logoFallback {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #dc143c;
    }

    .logoFallback svg {
      width: 100%;
      height: 100%;
    }

    .brandName {
      color: #090909;
      font-size: clamp(10px, 1.8vw, 18px);
      font-weight: 900;
      letter-spacing: 1.5px;
      overflow-wrap: anywhere;
    }

    .brandTagline {
      margin-top: 4px;
      color: #dc143c;
      font-size: clamp(6px, 0.9vw, 9px);
      font-weight: 800;
      letter-spacing: 1.5px;
    }

    .headerCode {
      text-align: right;
      color: #ffffff;
      font-size: clamp(6px, 0.9vw, 9px);
      line-height: 1.7;
      letter-spacing: 1px;
      overflow-wrap: anywhere;
    }

    .headerCode strong {
      display: block;
      color: #ff4b69;
      font-size: clamp(7px, 1vw, 11px);
    }

    /* Main content */

    .content {
      position: absolute;
      top: 23%;
      left: 9%;
      right: 24%;
      bottom: 24%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 0;
    }

    .microLabel {
      margin-bottom: 8px;
      color: #dc143c;
      font-size: clamp(7px, 1vw, 11px);
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
    }

    .title {
      margin: 0;
      max-width: 100%;
      color: #090909;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(20px, 3.5vw, 42px);
      font-weight: 700;
      line-height: 1.08;
      letter-spacing: 0.5px;
      overflow-wrap: anywhere;
    }

    .titleUnderline {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 120px;
      max-width: 40%;
      margin: 12px 0;
    }

    .titleUnderline::before,
    .titleUnderline::after {
      content: "";
      height: 1px;
      flex: 1;
      background: #dc143c;
    }

    .titleUnderline span {
      width: 7px;
      height: 7px;
      background: #dc143c;
      transform: rotate(45deg);
    }

    .presentedText {
      margin: 0;
      color: #5b5b5b;
      font-size: clamp(8px, 1.1vw, 12px);
      letter-spacing: 1.3px;
      text-transform: uppercase;
    }

    .recipientName {
      width: 100%;
      max-width: 100%;
      margin: 8px 0;
      color: #090909;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(19px, 3.4vw, 39px);
      font-weight: 700;
      line-height: 1.12;
      overflow-wrap: anywhere;
      word-break: normal;
    }

    .recipientRule {
      width: 68%;
      height: 2px;
      margin-bottom: 10px;
      background: linear-gradient(
        90deg,
        transparent,
        #dc143c,
        transparent
      );
    }

    .description {
      max-width: 90%;
      margin: 0;
      color: #3f3f3f;
      font-size: clamp(8px, 1.05vw, 12px);
      line-height: 1.55;
      overflow-wrap: anywhere;
    }

    .courseTitle {
      max-width: 100%;
      margin-top: 8px;
      color: #dc143c;
      font-size: clamp(10px, 1.6vw, 17px);
      font-weight: 900;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }

    .skills {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 5px;
      margin-top: 9px;
      max-width: 100%;
    }

    .skill {
      padding: 4px 8px;
      border: 1px solid #d6d6d6;
      border-left: 3px solid #dc143c;
      background: #f7f7f7;
      color: #171717;
      font-size: clamp(6px, 0.8vw, 9px);
      font-weight: 700;
    }

    /* Right-side security identity */

    .securityPanel {
      position: absolute;
      top: 26%;
      right: 5.3%;
      width: 15%;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #ffffff;
      text-align: center;
    }

    .shield {
      width: clamp(48px, 8vw, 86px);
      height: auto;
      color: #ff3157;
      margin-bottom: 12px;
      filter: drop-shadow(0 4px 12px rgba(220, 20, 60, 0.2));
    }

    .securityTitle {
      color: #ffffff;
      font-size: clamp(7px, 1vw, 11px);
      font-weight: 900;
      letter-spacing: 1.2px;
      line-height: 1.5;
    }

    .securityLine {
      width: 35px;
      height: 2px;
      margin: 8px 0;
      background: #dc143c;
    }

    .securitySub {
      color: #bcbcbc;
      font-size: clamp(5px, 0.75vw, 8px);
      line-height: 1.6;
      letter-spacing: 0.7px;
    }

    .seal {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: clamp(42px, 6vw, 64px);
      aspect-ratio: 1;
      margin-top: 16px;
      border: 2px solid #dc143c;
      outline: 1px solid rgba(255, 255, 255, 0.35);
      outline-offset: 4px;
      border-radius: 50%;
      color: #ffffff;
      background: #151515;
    }

    .sealIcon {
      color: #ff3157;
      font-size: clamp(15px, 2vw, 24px);
      font-weight: 900;
      line-height: 1;
    }

    .sealText {
      margin-top: 4px;
      font-size: clamp(4px, 0.6vw, 7px);
      font-weight: 900;
      letter-spacing: 1px;
    }

    /* Footer */

    .footer {
      position: absolute;
      bottom: 7%;
      left: 7%;
      right: 7%;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      align-items: end;
      gap: 14px;
    }

    .footerBlock {
      min-width: 0;
    }

    .footerBlock.center {
      text-align: center;
    }

    .footerBlock.right {
      text-align: right;
    }

    .footerLabel {
      margin-bottom: 5px;
      color: #777777;
      font-size: clamp(6px, 0.85vw, 9px);
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .footerValue {
      color: #101010;
      font-size: clamp(7px, 1vw, 11px);
      font-weight: 900;
      line-height: 1.4;
      overflow-wrap: anywhere;
    }

    .footerRule {
      width: 75%;
      height: 2px;
      margin-bottom: 6px;
      background: #dc143c;
    }

    .center .footerRule {
      margin-left: auto;
      margin-right: auto;
    }

    .right .footerRule {
      margin-left: auto;
    }

    .verification {
      margin-top: 6px;
      color: #dc143c;
      font-size: clamp(5px, 0.75vw, 8px);
      font-weight: 800;
      line-height: 1.5;
      overflow-wrap: anywhere;
    }

    .verifiedDot {
      display: inline-block;
      width: 6px;
      height: 6px;
      margin-right: 4px;
      border-radius: 50%;
      background: #dc143c;
    }

    /* Compact responsive layout */

    @media (max-width: 600px) {
      body {
        padding: 5px;
      }

      .outerFrame {
        inset: 6px;
      }

      .innerFrame {
        inset: 10px;
      }

      .header {
        top: 7%;
        left: 7%;
        right: 7%;
        gap: 5px;
      }

      .brand {
        gap: 5px;
      }

      .brandName {
        letter-spacing: 0.6px;
      }

      .brandTagline {
        letter-spacing: 0.5px;
      }

      .content {
        top: 24%;
        left: 7%;
        right: 24%;
        bottom: 23%;
      }

      .microLabel {
        letter-spacing: 1.5px;
        margin-bottom: 5px;
      }

      .titleUnderline {
        margin: 7px 0;
      }

      .recipientName {
        margin: 5px 0;
      }

      .recipientRule {
        margin-bottom: 6px;
      }

      .description {
        max-width: 96%;
        line-height: 1.35;
      }

      .courseTitle {
        margin-top: 5px;
      }

      .skills {
        gap: 3px;
        margin-top: 5px;
      }

      .skill {
        padding: 3px 5px;
      }

      .securityPanel {
        right: 5%;
        top: 31%;
      }

      .shield {
        margin-bottom: 5px;
      }

      .seal {
        margin-top: 7px;
      }

      .footer {
        bottom: 7%;
        gap: 6px;
      }
    }

    @media print {
      @page {
        size: A4 landscape;
        margin: 0;
      }

      html,
      body {
        width: 297mm;
        height: 210mm;
        padding: 0;
        overflow: hidden;
        background: #ffffff;
      }

      .stage {
        width: 297mm;
        height: 210mm;
        max-width: none;
      }

      .certificate {
        width: 297mm;
        height: 210mm;
        aspect-ratio: auto;
        box-shadow: none;
        border: none;
      }

      .header,
      .footer,
      .content,
      .securityPanel {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>

<body>
  <main class="stage">
    <article class="certificate">
      <div class="darkPanel"></div>
      <div class="topAccent"></div>
      <div class="bottomAccent"></div>
      <div class="outerFrame"></div>
      <div class="innerFrame"></div>

      <svg
        class="circuitPattern"
        viewBox="0 0 300 250"
        fill="none"
        aria-hidden="true"
      >
        <g stroke="#DC143C" stroke-width="2">
          <path d="M30 0 V40 H90 V80 H140 V120 H200 V170 H300" />
          <path d="M100 0 V25 H155 V65 H220 V105 H300" />
          <path d="M0 150 H55 V190 H120 V230 H185 V250" />
          <path d="M190 0 V35 H245 V65 H300" />
        </g>
        <g fill="#DC143C">
          <circle cx="90" cy="40" r="5" />
          <circle cx="140" cy="80" r="5" />
          <circle cx="200" cy="120" r="5" />
          <circle cx="155" cy="25" r="5" />
          <circle cx="220" cy="65" r="5" />
          <circle cx="55" cy="150" r="5" />
          <circle cx="120" cy="190" r="5" />
          <circle cx="245" cy="35" r="5" />
        </g>
      </svg>

      <svg
        class="watermark"
        viewBox="0 0 64 72"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M32 3 L57 13 V32 C57 49 46 61 32 68 C18 61 7 49 7 32 V13 Z"
          stroke="#DC143C"
          stroke-width="3"
        />
        <path
          d="M20 35 L28 43 L45 25"
          stroke="#DC143C"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <header class="header">
        <div class="brand">
          ${logo}

          <div>
            <div class="brandName">SOLOSECURITIES</div>
            <div class="brandTagline">
              CYBERSECURITY · LEARNING · DEFENSE
            </div>
          </div>
        </div>

        <div class="headerCode">
          SECURITY CREDENTIAL
          <strong>SS-${escapeHtml(certificateId)}</strong>
        </div>
      </header>

      <section class="content">
        <div class="microLabel">
          Certificate of Achievement
        </div>

        <h1 class="title">
          ${escapeHtml(title)}
        </h1>

        <div class="titleUnderline"><span></span></div>

        <p class="presentedText">
          This credential is awarded to
        </p>

        <h2 class="recipientName">
          ${escapeHtml(recipientName)}
        </h2>

        <div class="recipientRule"></div>

        <p class="description">
          ${escapeHtml(description)}
        </p>

        <div class="courseTitle">
          ${escapeHtml(category)}
        </div>

        ${skills ? `<div class="skills">${skills}</div>` : ""}
      </section>

      <aside class="securityPanel">
        <svg
          class="shield"
          viewBox="0 0 100 116"
          fill="none"
          aria-label="Cybersecurity shield"
        >
          <path
            d="M50 4 L91 20 V49 C91 76 73 98 50 110 C27 98 9 76 9 49 V20 Z"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            d="M50 15 L80 27 V49 C80 69 67 87 50 97 C33 87 20 69 20 49 V27 Z"
            stroke="currentColor"
            stroke-width="1.5"
            opacity="0.65"
          />
          <path
            d="M33 55 L44 66 L67 42"
            stroke="currentColor"
            stroke-width="5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <div class="securityTitle">
          DIGITAL<br />SECURITY
        </div>

        <div class="securityLine"></div>

        <div class="securitySub">
          SKILLS<br />
          KNOWLEDGE<br />
          ACHIEVEMENT
        </div>

        <div class="seal">
          <div class="sealIcon">✓</div>
          <div class="sealText">
            ${verified ? "VERIFIED" : "AWARDED"}
          </div>
        </div>
      </aside>

      <footer class="footer">
        <div class="footerBlock">
          <div class="footerRule"></div>
          <div class="footerLabel">Issued by</div>
          <div class="footerValue">${escapeHtml(issuer)}</div>
        </div>

        <div class="footerBlock center">
          <div class="footerRule"></div>
          <div class="footerLabel">Date of issue</div>
          <div class="footerValue">${escapeHtml(issueDate)}</div>
        </div>

        <div class="footerBlock right">
          <div class="footerRule"></div>
          <div class="footerLabel">Certificate ID</div>
          <div class="footerValue">${escapeHtml(certificateId)}</div>

          ${
            verified
              ? `<div class="verification">
                   <span class="verifiedDot"></span> VERIFIED
                 </div>`
              : ""
          }

          ${verification}
        </div>
      </footer>
    </article>
  </main>
</body>
</html>`;
}

export default generateCertificateHtml;