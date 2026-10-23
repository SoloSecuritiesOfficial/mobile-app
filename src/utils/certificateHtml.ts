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
    certificate.title?.trim() || "Certificate of Achievement";

  const issuer =
    certificate.issuedBy?.trim() || "SoloSecurities";

  const category =
    certificate.category?.trim() || "Professional Achievement";

  const certificateId =
    certificate.certificateId?.trim() || "Not available";

  const issueDate = formatDate(
    certificate.issueDate || certificate.createdAt
  );

  const description =
    certificate.description?.trim() ||
    `This certificate recognizes the successful completion of ${title}.`;

  const skills = (certificate.skills || [])
    .filter(
      (skill) =>
        typeof skill === "string" && skill.trim().length > 0
    )
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
      <div class="logoFallback">
        <span>S</span>
      </div>
    `;

  const verified =
    certificate.verified === true ||
    certificate.status?.toLowerCase() === "verified";

  const verificationUrl = certificate.verificationUrl?.trim();

  const verification = verificationUrl
    ? `
      <div class="verification">
        <span class="verificationLabel">VERIFY CERTIFICATE</span>
        <span class="verificationValue">
          ${escapeHtml(verificationUrl)}
        </span>
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

  <title>${escapeHtml(title)}</title>

  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html,
    body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #000000;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      -webkit-text-size-adjust: 100%;
    }

    body {
      display: flex;
      align-items: stretch;
      justify-content: stretch;
    }

    /*
      Premium cybersecurity certificate with black, red, and white color scheme.
      Landscape orientation with modern, professional design.
    */

    .certificate {
      position: relative;
      isolation: isolate;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      background: #FFFFFF;
      color: #000000;
      padding: 3.5% 5%;
    }

    /* Premium black and red frame */

    .frame {
      position: absolute;
      z-index: -1;
      inset: 2%;
      border: 3px solid #000000;
      pointer-events: none;
    }

    .frameInner {
      position: absolute;
      inset: 0.8%;
      border: 1px solid #DC143C;
      pointer-events: none;
    }

    .topAccent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(
        90deg,
        #000000 0%,
        #000000 40%,
        #DC143C 40%,
        #DC143C 60%,
        #000000 60%,
        #000000 100%
      );
    }

    .bottomAccent {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(
        90deg,
        #000000 0%,
        #000000 40%,
        #DC143C 40%,
        #DC143C 60%,
        #000000 60%,
        #000000 100%
      );
    }

    .watermark {
      position: absolute;
      z-index: -1;
      right: 5%;
      bottom: 10%;
      color: rgba(220, 20, 60, 0.04);
      font-size: clamp(100px, 25vw, 200px);
      font-weight: 900;
      line-height: 1;
      pointer-events: none;
      transform: rotate(-8deg);
    }

    .cornerAccent {
      position: absolute;
      width: 40px;
      height: 40px;
      border: 2px solid #DC143C;
    }

    .cornerAccent.topLeft {
      top: 3%;
      left: 3%;
      border-right: none;
      border-bottom: none;
    }

    .cornerAccent.topRight {
      top: 3%;
      right: 3%;
      border-left: none;
      border-bottom: none;
    }

    .cornerAccent.bottomLeft {
      bottom: 3%;
      left: 3%;
      border-right: none;
      border-top: none;
    }

    .cornerAccent.bottomRight {
      bottom: 3%;
      right: 3%;
      border-left: none;
      border-top: none;
    }

    /* Header */

    .header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      gap: 12px;
      padding-bottom: 2%;
      border-bottom: 2px solid #000000;
    }

    .brand {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .logo {
      display: block;
      width: clamp(30px, 6vw, 50px);
      height: clamp(30px, 6vw, 50px);
      object-fit: contain;
      flex-shrink: 0;
    }

    .logoFallback {
      width: clamp(30px, 6vw, 50px);
      height: clamp(30px, 6vw, 50px);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000000;
      border: 2px solid #DC143C;
      flex-shrink: 0;
    }

    .logoFallback span {
      color: #FFFFFF;
      font-size: clamp(18px, 4vw, 30px);
      font-weight: 900;
    }

    .brandName {
      color: #000000;
      font-size: clamp(10px, 2.5vw, 18px);
      font-weight: 900;
      letter-spacing: 1.5px;
      overflow-wrap: anywhere;
    }

    .brandTagline {
      color: #DC143C;
      font-size: clamp(6px, 1.3vw, 10px);
      font-weight: 700;
      letter-spacing: 0.8px;
      margin-top: 2px;
    }

    .statusBadge {
      flex-shrink: 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 4px;
      border: 2px solid ${verified ? "#000000" : "#DC143C"};
      background: ${verified ? "#000000" : "#FFFFFF"};
      color: ${verified ? "#FFFFFF" : "#DC143C"};
      font-size: clamp(6px, 1.3vw, 10px);
      font-weight: 900;
      letter-spacing: 1px;
    }

    /* Main certificate content */

    .content {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 0;
      padding: 3% 4%;
    }

    .ornament {
      color: #DC143C;
      font-size: clamp(14px, 3.5vw, 24px);
      line-height: 1;
      margin-bottom: 1.5%;
      font-weight: 300;
    }

    .eyebrow {
      color: #DC143C;
      font-size: clamp(7px, 1.6vw, 11px);
      font-weight: 900;
      letter-spacing: 3px;
      margin-bottom: 1.5%;
    }

    .mainTitle {
      max-width: 100%;
      color: #000000;
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: clamp(18px, 5vw, 36px);
      font-weight: 700;
      line-height: 1.15;
      overflow-wrap: anywhere;
      margin: 0 0 2%;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .titleRule {
      width: 25%;
      min-width: 50px;
      height: 3px;
      background: #DC143C;
      margin-bottom: 2%;
    }

    .subtitle {
      color: #333333;
      font-size: clamp(7px, 1.6vw, 12px);
      line-height: 1.4;
      margin-bottom: 1.8%;
      font-weight: 500;
    }

    .recipientName {
      width: 100%;
      max-width: 100%;
      color: #000000;
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: clamp(20px, 5.5vw, 40px);
      font-weight: 700;
      line-height: 1.2;
      overflow-wrap: anywhere;
      word-break: normal;
      margin: 0 0 1.5%;
      border-bottom: 3px solid #000000;
      padding-bottom: 8px;
      display: inline-block;
    }

    .recipientUnderline {
      width: 40%;
      height: 2px;
      background: #DC143C;
      margin-bottom: 2%;
    }

    .description {
      max-width: 88%;
      color: #1a1a1a;
      font-size: clamp(7px, 1.6vw, 12px);
      line-height: 1.6;
      overflow-wrap: anywhere;
      margin: 0 0 2%;
      font-weight: 400;
    }

    .infoGrid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: clamp(8px, 2vw, 16px);
      max-width: 90%;
      margin: 2% 0;
      width: 100%;
    }

    .infoItem {
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-left: 3px solid #DC143C;
      padding: clamp(6px, 1.5vw, 12px);
      text-align: left;
    }

    .infoLabel {
      color: #DC143C;
      font-size: clamp(5px, 1.2vw, 8px);
      font-weight: 900;
      letter-spacing: 1px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .infoValue {
      color: #000000;
      font-size: clamp(6px, 1.4vw, 10px);
      font-weight: 600;
      overflow-wrap: anywhere;
    }

    .skills {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      max-width: 90%;
      margin-top: 1.5%;
    }

    .skill {
      display: inline-block;
      padding: 4px 10px;
      color: #FFFFFF;
      background: #000000;
      border: 1px solid #DC143C;
      border-radius: 3px;
      font-size: clamp(6px, 1.3vw, 9px);
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    /* Footer */

    .bottom {
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
      flex-shrink: 0;
      gap: 12px;
      padding-top: 2%;
      border-top: 2px solid #000000;
    }

    .signature {
      flex: 1;
      min-width: 0;
    }

    .signatureLine {
      width: 85%;
      max-width: 160px;
      border-top: 2px solid #DC143C;
      margin-bottom: 6px;
    }

    .signatureName {
      color: #000000;
      font-size: clamp(7px, 1.5vw, 11px);
      font-weight: 900;
      overflow-wrap: anywhere;
      letter-spacing: 0.5px;
    }

    .signatureLabel {
      color: #666666;
      font-size: clamp(5px, 1.1vw, 8px);
      letter-spacing: 1px;
      margin-top: 4px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .seal {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: clamp(40px, 9vw, 65px);
      height: clamp(40px, 9vw, 65px);
      border: 3px solid #DC143C;
      background: #000000;
      border-radius: 50%;
      color: #FFFFFF;
      text-align: center;
      position: relative;
    }

    .seal::before {
      content: '';
      position: absolute;
      inset: -6px;
      border: 1px solid #DC143C;
      border-radius: 50%;
    }

    .sealIcon {
      font-size: clamp(14px, 3.5vw, 24px);
      line-height: 1;
      font-weight: 900;
      color: #DC143C;
    }

    .sealText {
      font-size: clamp(5px, 1vw, 7px);
      font-weight: 900;
      letter-spacing: 0.8px;
      margin-top: 4px;
    }

    .metadata {
      flex: 1;
      min-width: 0;
      text-align: right;
    }

    .metadataLabel {
      color: #666666;
      font-size: clamp(5px, 1.1vw, 8px);
      letter-spacing: 1px;
      margin-bottom: 4px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .metadataValue {
      color: #000000;
      font-size: clamp(7px, 1.5vw, 11px);
      font-weight: 900;
      overflow-wrap: anywhere;
    }

    .verification {
      display: flex;
      flex-direction: column;
      margin-top: 6px;
    }

    .verificationLabel {
      color: #666666;
      font-size: clamp(5px, 1vw, 7px);
      font-weight: 700;
      text-transform: uppercase;
    }

    .verificationValue {
      color: #DC143C;
      font-size: clamp(5px, 1vw, 7px);
      overflow-wrap: anywhere;
      font-weight: 600;
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
        overflow: hidden;
      }

      .certificate {
        width: 297mm;
        height: 210mm;
        padding: 10mm 16mm;
        border: 3mm solid #101E3A;
      }

      .frame {
        inset: 5mm;
        border-width: 0.5mm;
      }

      .frameInner {
        inset: 8mm;
      }

      .topAccent {
        height: 2mm;
      }

      .logo,
      .logoFallback {
        width: 12mm;
        height: 12mm;
      }

      .brandName {
        font-size: 12pt;
      }

      .brandTagline {
        font-size: 7pt;
      }

      .mainTitle {
        font-size: 28pt;
      }

      .recipientName {
        font-size: 25pt;
      }

      .description {
        font-size: 9pt;
      }

      .skill {
        font-size: 7pt;
      }

      .metadataValue,
      .signatureName {
        font-size: 9pt;
      }
    }
  </style>
</head>

<body>
  <main class="certificate">
    <div class="topAccent"></div>
    <div class="bottomAccent"></div>
    <div class="frame"></div>
    <div class="frameInner"></div>
    <div class="watermark">SS</div>
    <div class="cornerAccent topLeft"></div>
    <div class="cornerAccent topRight"></div>
    <div class="cornerAccent bottomLeft"></div>
    <div class="cornerAccent bottomRight"></div>

    <header class="header">
      <div class="brand">
        ${logo}

        <div>
          <div class="brandName">SOLOSECURITIES</div>
          <div class="brandTagline">
            CYBERSECURITY EXCELLENCE
          </div>
        </div>
      </div>

      <div class="statusBadge">
        ${verified ? "✓ VERIFIED" : "◈ CERTIFIED"}
      </div>
    </header>

    <section class="content">
      <div class="ornament">◆</div>

      <div class="eyebrow">
        CERTIFICATE OF ACHIEVEMENT
      </div>

      <h1 class="mainTitle">
        ${escapeHtml(title)}
      </h1>

      <div class="titleRule"></div>

      <div class="subtitle">
        This certificate is proudly awarded to
      </div>

      <h2 class="recipientName">
        ${escapeHtml(recipientName)}
      </h2>

      <p class="description">
        ${escapeHtml(description)}
      </p>

      <div class="infoGrid">
        <div class="infoItem">
          <div class="infoLabel">CATEGORY</div>
          <div class="infoValue">${escapeHtml(category)}</div>
        </div>
        <div class="infoItem">
          <div class="infoLabel">ISSUED BY</div>
          <div class="infoValue">${escapeHtml(issuer)}</div>
        </div>
        <div class="infoItem">
          <div class="infoLabel">CERTIFICATE ID</div>
          <div class="infoValue">${escapeHtml(certificateId)}</div>
        </div>
        <div class="infoItem">
          <div class="infoLabel">DATE ISSUED</div>
          <div class="infoValue">${escapeHtml(issueDate)}</div>
        </div>
      </div>

      ${
        skills
          ? `<div class="skills">${skills}</div>`
          : ""
      }
    </section>

    <footer class="bottom">
      <div class="signature">
        <div class="signatureLine"></div>

        <div class="signatureName">
          ${escapeHtml(issuer)}
        </div>

        <div class="signatureLabel">
          AUTHORIZED SIGNATORY
        </div>
      </div>

      <div class="seal">
        <div class="sealIcon">✓</div>
        <div class="sealText">CERTIFIED</div>
      </div>

      <div class="metadata">
        ${
          verified
            ? `<div style="margin-bottom: 8px;">
                <div class="metadataLabel">STATUS</div>
                <div class="metadataValue" style="color: #DC143C;">VERIFIED ✓</div>
               </div>`
            : ""
        }

        ${verification}
      </div>
    </footer>
  </main>
</body>
</html>`;
}