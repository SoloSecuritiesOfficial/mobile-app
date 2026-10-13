/**
 * certificateHtml.ts
 *
 * Generates a full-page HTML certificate that is rendered by expo-print
 * into a PDF. The design is a professional landscape A4 certificate with:
 *  - Gold border frame
 *  - SoloSecurities branding and shield icon
 *  - Recipient name in a large calligraphic-style font
 *  - Category ribbon, issue date, certificate ID
 *  - Signature line and QR-code verification URL
 *  - Skills chips
 */

export interface CertificateData {
  title: string;
  category: string;
  issuedTo: string;
  issuedBy: string;
  certificateId: string;
  description?: string;
  skills?: string[];
  issueDate: string;       // formatted date string
  verificationUrl?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Web Security":      "#1565C0",
  "Network Security":  "#6A1B9A",
  "Cloud Security":    "#00838F",
  "Bug Bounty":        "#C62828",
  "CTF":               "#E65100",
  "Learning":          "#2E7D32",
  "Other":             "#455A64",
};

export function generateCertificateHtml(data: CertificateData): string {
  const catColor = CATEGORY_COLORS[data.category] || "#1565C0";
  const skills = (data.skills ?? []).filter(Boolean);

  const skillsHtml = skills.length > 0
    ? `<div class="skills">
        ${skills.map(s => `<span class="skill-chip">${s}</span>`).join("")}
       </div>`
    : "";

  const descHtml = data.description
    ? `<p class="description">&ldquo;${data.description}&rdquo;</p>`
    : "";

  const verifyHtml = data.verificationUrl
    ? `<p class="verify-url">Verify at: <strong>${data.verificationUrl}</strong></p>`
    : `<p class="verify-url">Certificate ID: <strong>${data.certificateId}</strong></p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Certificate — ${data.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@300;400;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    width: 297mm;
    height: 210mm;
    background: #fff;
    font-family: 'Lato', sans-serif;
  }

  .page {
    width: 297mm;
    height: 210mm;
    background: #FFFDF6;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 14mm 18mm;
  }

  /* ── Outer gold border ── */
  .border-outer {
    position: absolute;
    inset: 6mm;
    border: 3px solid #C5A028;
    border-radius: 4px;
  }
  .border-inner {
    position: absolute;
    inset: 8.5mm;
    border: 1px solid #D4AF37;
    border-radius: 2px;
  }

  /* ── Corner ornaments ── */
  .corner {
    position: absolute;
    width: 14mm;
    height: 14mm;
    color: #C5A028;
    font-size: 26px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .corner.tl { top: 5mm; left: 5mm; }
  .corner.tr { top: 5mm; right: 5mm; }
  .corner.bl { bottom: 5mm; left: 5mm; }
  .corner.br { bottom: 5mm; right: 5mm; }

  /* ── Background watermark ── */
  .watermark {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 120px;
    opacity: 0.03;
    pointer-events: none;
    user-select: none;
    color: #C5A028;
  }

  /* ── Content ── */
  .content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
    gap: 0;
  }

  /* ── Brand header ── */
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2mm;
  }
  .brand-shield {
    width: 28px;
    height: 28px;
    background: #C62828;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 1;
  }
  .brand-name {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    letter-spacing: 3px;
    color: #C62828;
    text-transform: uppercase;
    font-weight: 700;
  }

  /* ── Decorative rule ── */
  .rule {
    width: 80mm;
    height: 2px;
    background: linear-gradient(to right, transparent, #C5A028, transparent);
    margin: 2.5mm auto;
  }
  .rule-thin {
    width: 50mm;
    height: 1px;
    background: linear-gradient(to right, transparent, #C5A028, transparent);
    margin: 1.5mm auto;
  }

  /* ── Certificate of Achievement headline ── */
  .headline {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 5px;
    color: #8B6914;
    text-transform: uppercase;
    margin-bottom: 1mm;
  }

  /* ── Title ── */
  .cert-title {
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    color: #1A1A1A;
    font-weight: 700;
    line-height: 1.2;
    margin: 2mm 0 1mm;
    max-width: 220mm;
  }

  /* ── "This is to certify that" ── */
  .certify-text {
    font-family: 'Lato', sans-serif;
    font-size: 11px;
    color: #555;
    letter-spacing: 1px;
    margin-bottom: 1mm;
  }

  /* ── Recipient name ── */
  .recipient {
    font-family: 'Playfair Display', serif;
    font-size: 34px;
    font-style: italic;
    color: #C62828;
    margin: 1.5mm 0;
    line-height: 1.1;
  }

  /* ── Category ribbon ── */
  .category-badge {
    display: inline-block;
    padding: 3px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin: 2mm 0;
    color: #fff;
    background: ${catColor};
  }

  /* ── Description ── */
  .description {
    font-family: 'Lato', sans-serif;
    font-size: 10px;
    color: #666;
    font-style: italic;
    max-width: 180mm;
    line-height: 1.5;
    margin: 1.5mm 0;
  }

  /* ── Skills ── */
  .skills {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    justify-content: center;
    margin: 1.5mm 0;
  }
  .skill-chip {
    padding: 2px 10px;
    border: 1px solid ${catColor}88;
    border-radius: 12px;
    font-size: 9px;
    color: ${catColor};
    background: ${catColor}12;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  /* ── Footer row: date + signatures + cert ID ── */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    margin-top: 4mm;
    padding: 0 5mm;
  }

  .sig-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 45mm;
  }
  .sig-line {
    width: 40mm;
    height: 1px;
    background: #C5A028;
    margin-bottom: 2px;
  }
  .sig-name {
    font-family: 'Cinzel', serif;
    font-size: 9px;
    color: #333;
    letter-spacing: 0.5px;
  }
  .sig-role {
    font-size: 8px;
    color: #888;
  }

  .center-seal {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .seal-circle {
    width: 20mm;
    height: 20mm;
    border: 2px solid #C5A028;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    background: #FFFDF6;
    box-shadow: 0 0 8px #C5A02844;
  }
  .seal-text {
    font-family: 'Cinzel', serif;
    font-size: 7px;
    color: #8B6914;
    letter-spacing: 0.5px;
  }

  .cert-id-block {
    text-align: right;
  }
  .verify-url {
    font-size: 8px;
    color: #888;
    margin-bottom: 1mm;
  }
  .verify-url strong {
    color: #444;
  }
  .issue-date {
    font-size: 8px;
    color: #888;
  }
  .issue-date strong {
    color: #444;
  }
</style>
</head>
<body>
<div class="page">

  <!-- Borders -->
  <div class="border-outer"></div>
  <div class="border-inner"></div>

  <!-- Corner ornaments -->
  <div class="corner tl">✦</div>
  <div class="corner tr">✦</div>
  <div class="corner bl">✦</div>
  <div class="corner br">✦</div>

  <!-- Background watermark -->
  <div class="watermark">🛡️</div>

  <!-- Main content -->
  <div class="content">

    <!-- Brand header -->
    <div class="brand">
      <div class="brand-shield">🛡️</div>
      <span class="brand-name">SoloSecurities</span>
    </div>

    <div class="rule"></div>

    <p class="headline">Certificate of Achievement</p>

    <!-- Title -->
    <h1 class="cert-title">${escapeHtml(data.title)}</h1>

    <div class="rule-thin"></div>

    <!-- Certify text -->
    <p class="certify-text">This is to certify that</p>

    <!-- Recipient -->
    <p class="recipient">${escapeHtml(data.issuedTo)}</p>

    <!-- Category badge -->
    <span class="category-badge">${escapeHtml(data.category)}</span>

    ${descHtml}
    ${skillsHtml}

    <div class="rule"></div>

    <!-- Footer -->
    <div class="footer">
      <!-- Left: Issued by sig -->
      <div class="sig-block">
        <div class="sig-line"></div>
        <span class="sig-name">${escapeHtml(data.issuedBy)}</span>
        <span class="sig-role">Director, SoloSecurities</span>
      </div>

      <!-- Center: Seal -->
      <div class="center-seal">
        <div class="seal-circle">🏅</div>
        <span class="seal-text">VERIFIED &amp; CERTIFIED</span>
      </div>

      <!-- Right: Date + cert ID -->
      <div class="cert-id-block">
        <p class="issue-date">Date Issued: <strong>${escapeHtml(data.issueDate)}</strong></p>
        ${verifyHtml}
      </div>
    </div>

  </div>
</div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
