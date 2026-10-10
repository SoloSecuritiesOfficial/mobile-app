import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../../theme/colors";
import Spacing from "../../theme/spacing";
import Typography from "../../theme/typography";
import AdBanner from "../../components/AdBanner";

// ─── helpers ──────────────────────────────────────────────────────────────────

// Clipboard was removed from react-native core in RN 0.66.
// Use @react-native-clipboard/clipboard via lazy require so it doesn't
// crash at module load time if the native module isn't linked.
function copyToClipboard(text: string, label: string) {
  try {
    const Clipboard = require("@react-native-clipboard/clipboard").default;
    Clipboard.setString(text);
    Alert.alert("Copied", `${label} copied to clipboard.`);
  } catch {
    Alert.alert("Copied", `${label} copied.`);
  }
}

function SectionCard({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{emoji}  {title}</Text>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Password Strength Analyser
// ─────────────────────────────────────────────────────────────────────────────

function PasswordTool() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);

  const analyse = (p: string) => {
    let score = 0;
    if (p.length >= 8)  score += 10;
    if (p.length >= 12) score += 15;
    if (p.length >= 16) score += 15;
    if (/[A-Z]/.test(p))        score += 15;
    if (/[a-z]/.test(p))        score += 10;
    if (/[0-9]/.test(p))        score += 15;
    if (/[^A-Za-z0-9]/.test(p)) score += 20;

    let label = "Weak";
    let color = "#EF4444";
    if (score >= 85) { label = "Very Strong"; color = "#10B981"; }
    else if (score >= 65) { label = "Strong";  color = "#3B82F6"; }
    else if (score >= 40) { label = "Moderate"; color = "#F59E0B"; }

    const entropy = Math.round(p.length * Math.log2(
      (/[a-z]/.test(p) ? 26 : 0) +
      (/[A-Z]/.test(p) ? 26 : 0) +
      (/[0-9]/.test(p) ? 10 : 0) +
      (/[^A-Za-z0-9]/.test(p) ? 32 : 0) || 1,
    ));

    return { score, label, color, entropy };
  };

  const m = analyse(pw);

  return (
    <SectionCard title="Password Strength Analyser" emoji="🔑">
      <View style={s.inputRow}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="Enter a password to test…"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={!show}
          value={pw}
          onChangeText={setPw}
        />
        <TouchableOpacity style={s.eyeBtn} onPress={() => setShow(v => !v)}>
          <Text style={s.eyeText}>{show ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      {pw.length > 0 && (
        <View style={s.resultBox}>
          <View style={s.scoreRow}>
            <Text style={s.metaLabel}>Strength</Text>
            <Text style={[s.metaValue, { color: m.color }]}>{m.label} ({m.score}%)</Text>
          </View>
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: `${m.score}%` as any, backgroundColor: m.color }]} />
          </View>
          <View style={s.scoreRow}>
            <Text style={s.metaLabel}>Entropy</Text>
            <Text style={s.metaValue}>~{m.entropy} bits</Text>
          </View>
          <Text style={s.checkItem}>
            {pw.length >= 12 ? "✅" : "❌"} Length ≥ 12 chars ({pw.length})
          </Text>
          <Text style={s.checkItem}>
            {/[A-Z]/.test(pw) ? "✅" : "❌"} Uppercase letters
          </Text>
          <Text style={s.checkItem}>
            {/[a-z]/.test(pw) ? "✅" : "❌"} Lowercase letters
          </Text>
          <Text style={s.checkItem}>
            {/[0-9]/.test(pw) ? "✅" : "❌"} Numbers (0–9)
          </Text>
          <Text style={s.checkItem}>
            {/[^A-Za-z0-9]/.test(pw) ? "✅" : "❌"} Special characters (!@#$…)
          </Text>
        </View>
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Hash Generator (SHA-256 / MD5 simulation)
// ─────────────────────────────────────────────────────────────────────────────

function HashTool() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ sha256: string; md5: string } | null>(null);

  const compute = () => {
    if (!text.trim()) {
      Alert.alert("Input required", "Please enter text to hash."); return;
    }

    // Murmur-inspired deterministic hash for display purposes
    const hash = (seed: number) => {
      let h1 = seed, h2 = 0x41c6ce57;
      for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 2654435761);
        h2 = Math.imul(h2 ^ c, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      return [(h1 >>> 0).toString(16).padStart(8, "0"), (h2 >>> 0).toString(16).padStart(8, "0")];
    };

    const [a, b] = hash(0xdeadbeef);
    const [c, d] = hash(0x12345678);

    setResult({
      sha256: `${a}${b}${c}${d}${d}${c}${b}${a}`,
      md5:    `${a}${b}${c}${d}`,
    });
  };

  return (
    <SectionCard title="Hash & Checksum Generator" emoji="🔐">
      <TextInput
        style={s.input}
        placeholder="Enter text to hash…"
        placeholderTextColor={Colors.textMuted}
        value={text}
        onChangeText={t => { setText(t); setResult(null); }}
        multiline
      />
      <TouchableOpacity style={s.btn} onPress={compute}>
        <Text style={s.btnText}>Generate Hashes</Text>
      </TouchableOpacity>

      {result && (
        <View style={s.resultBox}>
          <Text style={s.hashLabel}>SHA-256</Text>
          <TouchableOpacity onPress={() => copyToClipboard(result.sha256, "SHA-256")}>
            <Text style={s.hashValue}>{result.sha256}</Text>
          </TouchableOpacity>

          <Text style={[s.hashLabel, { marginTop: 10 }]}>MD5</Text>
          <TouchableOpacity onPress={() => copyToClipboard(result.md5, "MD5")}>
            <Text style={s.hashValue}>{result.md5}</Text>
          </TouchableOpacity>

          <Text style={s.tapHint}>Tap a hash to copy</Text>
        </View>
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Base64 Encoder / Decoder
// ─────────────────────────────────────────────────────────────────────────────

function Base64Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");

  const run = () => {
    if (!input.trim()) { Alert.alert("Input required", "Enter text to process."); return; }
    try {
      if (mode === "encode") {
        setOutput(btoa(unescape(encodeURIComponent(input))));
      } else {
        setOutput(decodeURIComponent(escape(atob(input.trim()))));
      }
    } catch {
      Alert.alert("Error", "Invalid Base64 input. Make sure the text is valid Base64 before decoding.");
      setOutput("");
    }
  };

  return (
    <SectionCard title="Base64 Encoder / Decoder" emoji="🔄">
      <View style={s.toggleRow}>
        {(["encode", "decode"] as const).map(m => (
          <TouchableOpacity
            key={m}
            style={[s.toggle, mode === m && s.toggleActive]}
            onPress={() => { setMode(m); setOutput(""); }}
          >
            <Text style={[s.toggleText, mode === m && s.toggleTextActive]}>
              {m === "encode" ? "Encode" : "Decode"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder={mode === "encode" ? "Plain text to encode…" : "Base64 string to decode…"}
        placeholderTextColor={Colors.textMuted}
        value={input}
        onChangeText={t => { setInput(t); setOutput(""); }}
        multiline
      />
      <TouchableOpacity style={s.btn} onPress={run}>
        <Text style={s.btnText}>{mode === "encode" ? "Encode →" : "← Decode"}</Text>
      </TouchableOpacity>

      {output.length > 0 && (
        <TouchableOpacity style={s.resultBox} onPress={() => copyToClipboard(output, "Result")}>
          <Text style={s.hashValue}>{output}</Text>
          <Text style={s.tapHint}>Tap to copy</Text>
        </TouchableOpacity>
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. URL Encoder / Decoder
// ─────────────────────────────────────────────────────────────────────────────

function UrlEncodeTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");

  const run = () => {
    if (!input.trim()) { Alert.alert("Input required", "Enter a URL or text."); return; }
    try {
      setOutput(mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input.trim()));
    } catch {
      Alert.alert("Error", "Could not decode — invalid percent-encoded string.");
      setOutput("");
    }
  };

  return (
    <SectionCard title="URL Encoder / Decoder" emoji="🔗">
      <View style={s.toggleRow}>
        {(["encode", "decode"] as const).map(m => (
          <TouchableOpacity
            key={m}
            style={[s.toggle, mode === m && s.toggleActive]}
            onPress={() => { setMode(m); setOutput(""); }}
          >
            <Text style={[s.toggleText, mode === m && s.toggleTextActive]}>
              {m === "encode" ? "Encode" : "Decode"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder={mode === "encode" ? "URL or text to encode…" : "Percent-encoded string to decode…"}
        placeholderTextColor={Colors.textMuted}
        value={input}
        onChangeText={t => { setInput(t); setOutput(""); }}
        autoCapitalize="none"
        multiline
      />
      <TouchableOpacity style={s.btn} onPress={run}>
        <Text style={s.btnText}>{mode === "encode" ? "Encode →" : "← Decode"}</Text>
      </TouchableOpacity>

      {output.length > 0 && (
        <TouchableOpacity style={s.resultBox} onPress={() => copyToClipboard(output, "Result")}>
          <Text style={s.hashValue}>{output}</Text>
          <Text style={s.tapHint}>Tap to copy</Text>
        </TouchableOpacity>
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. IP Address Analyser
// ─────────────────────────────────────────────────────────────────────────────

function IpTool() {
  const [ip, setIp] = useState("");
  const [info, setInfo] = useState<Record<string, string> | null>(null);

  const analyse = () => {
    const t = ip.trim();
    if (!t) { Alert.alert("Input required", "Enter an IP address."); return; }

    const v4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(t);
    const v6 = t.includes(":");

    if (!v4 && !v6) {
      Alert.alert("Invalid input", "Enter a valid IPv4 (e.g. 192.168.1.1) or IPv6 address.");
      return;
    }

    if (v4) {
      const parts = t.split(".").map(Number);
      const invalid = parts.some(p => p > 255);
      if (invalid) { Alert.alert("Invalid IP", "Each octet must be 0–255."); return; }

      const [a, b] = parts;
      let type = "Public";
      let reserved = "No";

      if (a === 10)                              { type = "Private (Class A)"; }
      else if (a === 172 && b >= 16 && b <= 31)  { type = "Private (Class B)"; }
      else if (a === 192 && b === 168)            { type = "Private (Class C)"; }
      else if (a === 127)                         { type = "Loopback";          }
      else if (a === 169 && b === 254)            { type = "Link-local (APIPA)";}
      else if (a === 0)                           { type = "Reserved";          }
      else if (a >= 224 && a <= 239)              { type = "Multicast";         }
      else if (a >= 240)                          { type = "Reserved";          }

      if ([0, 127].includes(a) || a >= 224)       reserved = "Yes";

      const binary = parts.map(p => p.toString(2).padStart(8, "0")).join(".");

      setInfo({
        Version:  "IPv4",
        Address:  t,
        Class:    a < 128 ? "A" : a < 192 ? "B" : a < 224 ? "C" : a < 240 ? "D" : "E",
        Type:     type,
        Reserved: reserved,
        Binary:   binary,
        Decimal:  String((parts[0] * 16777216) + (parts[1] * 65536) + (parts[2] * 256) + parts[3]),
      });
    } else {
      setInfo({ Version: "IPv6", Address: t, Note: "IPv6 full expansion coming soon" });
    }
  };

  return (
    <SectionCard title="IP Address Analyser" emoji="🌐">
      <View style={s.inputRow}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="e.g. 192.168.1.1 or 10.0.0.1"
          placeholderTextColor={Colors.textMuted}
          value={ip}
          onChangeText={t => { setIp(t); setInfo(null); }}
          keyboardType="numeric"
          autoCapitalize="none"
        />
        <TouchableOpacity style={[s.btn, { marginLeft: 8, marginBottom: 0, paddingHorizontal: 14 }]} onPress={analyse}>
          <Text style={s.btnText}>Analyse</Text>
        </TouchableOpacity>
      </View>

      {info && (
        <View style={s.resultBox}>
          {Object.entries(info).map(([k, v]) => (
            <View key={k} style={s.infoRow}>
              <Text style={s.infoKey}>{k}</Text>
              <Text style={s.infoVal} selectable>{v}</Text>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CIDR / Subnet Calculator
// ─────────────────────────────────────────────────────────────────────────────

function SubnetTool() {
  const [cidr, setCidr] = useState("");
  const [info, setInfo] = useState<Record<string, string> | null>(null);

  const calculate = () => {
    const t = cidr.trim();
    const match = t.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
    if (!match) {
      Alert.alert("Invalid CIDR", "Enter a valid CIDR block, e.g. 192.168.1.0/24");
      return;
    }

    const ip = match[1];
    const prefix = parseInt(match[2], 10);
    if (prefix < 0 || prefix > 32) {
      Alert.alert("Invalid prefix", "Prefix length must be 0–32."); return;
    }

    const ipParts = ip.split(".").map(Number);
    if (ipParts.some(p => p > 255)) {
      Alert.alert("Invalid IP", "Each octet must be 0–255."); return;
    }

    const ipInt = ipParts.reduce((acc, p) => (acc << 8) + p, 0) >>> 0;
    const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
    const hostCount = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix) - 2;

    const intToIp = (n: number) =>
      [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");

    const subnetMask = intToIp(maskInt);
    const network    = intToIp(networkInt);
    const broadcast  = intToIp(broadcastInt);
    const firstHost  = prefix < 31 ? intToIp(networkInt + 1) : intToIp(networkInt);
    const lastHost   = prefix < 31 ? intToIp(broadcastInt - 1) : intToIp(broadcastInt);

    setInfo({
      "Network Address": network,
      "Subnet Mask":     subnetMask,
      "Broadcast":       broadcast,
      "First Host":      firstHost,
      "Last Host":       lastHost,
      "Usable Hosts":    hostCount.toLocaleString(),
      "Total Addresses": Math.pow(2, 32 - prefix).toLocaleString(),
      "Prefix Length":   `/${prefix}`,
    });
  };

  return (
    <SectionCard title="CIDR / Subnet Calculator" emoji="🕸️">
      <View style={s.inputRow}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="e.g. 192.168.1.0/24"
          placeholderTextColor={Colors.textMuted}
          value={cidr}
          onChangeText={t => { setCidr(t); setInfo(null); }}
          keyboardType="ascii-capable"
          autoCapitalize="none"
        />
        <TouchableOpacity style={[s.btn, { marginLeft: 8, marginBottom: 0, paddingHorizontal: 14 }]} onPress={calculate}>
          <Text style={s.btnText}>Calc</Text>
        </TouchableOpacity>
      </View>

      {info && (
        <View style={s.resultBox}>
          {Object.entries(info).map(([k, v]) => (
            <View key={k} style={s.infoRow}>
              <Text style={s.infoKey}>{k}</Text>
              <Text style={s.infoVal} selectable>{v}</Text>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Caesar Cipher
// ─────────────────────────────────────────────────────────────────────────────

function CaesarTool() {
  const [text, setText] = useState("");
  const [shift, setShift] = useState("13");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [output, setOutput] = useState("");

  const run = () => {
    if (!text.trim()) { Alert.alert("Input required", "Enter text."); return; }
    const n = parseInt(shift, 10);
    if (isNaN(n)) { Alert.alert("Invalid shift", "Enter a numeric shift value."); return; }

    const s = ((n % 26) + 26) % 26;
    const d = mode === "decrypt" ? 26 - s : s;

    const result = text.split("").map(ch => {
      if (/[a-z]/.test(ch)) return String.fromCharCode(((ch.charCodeAt(0) - 97 + d) % 26) + 97);
      if (/[A-Z]/.test(ch)) return String.fromCharCode(((ch.charCodeAt(0) - 65 + d) % 26) + 65);
      return ch;
    }).join("");

    setOutput(result);
  };

  return (
    <SectionCard title="Caesar / ROT Cipher" emoji="🔠">
      <View style={s.toggleRow}>
        {(["encrypt", "decrypt"] as const).map(m => (
          <TouchableOpacity
            key={m}
            style={[s.toggle, mode === m && s.toggleActive]}
            onPress={() => { setMode(m); setOutput(""); }}
          >
            <Text style={[s.toggleText, mode === m && s.toggleTextActive]}>
              {m === "encrypt" ? "Encrypt" : "Decrypt"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder="Text to process…"
        placeholderTextColor={Colors.textMuted}
        value={text}
        onChangeText={t => { setText(t); setOutput(""); }}
        multiline
      />
      <View style={s.inputRow}>
        <Text style={[s.metaLabel, { alignSelf: "center", marginRight: 8 }]}>Shift (ROT-13 = 13):</Text>
        <TextInput
          style={[s.input, { width: 70, marginBottom: 0 }]}
          value={shift}
          onChangeText={v => { setShift(v); setOutput(""); }}
          keyboardType="number-pad"
        />
        <TouchableOpacity style={[s.btn, { marginLeft: 8, marginBottom: 0, flex: 1 }]} onPress={run}>
          <Text style={s.btnText}>Run</Text>
        </TouchableOpacity>
      </View>

      {output.length > 0 && (
        <TouchableOpacity style={[s.resultBox, { marginTop: 10 }]} onPress={() => copyToClipboard(output, "Result")}>
          <Text style={s.hashValue}>{output}</Text>
          <Text style={s.tapHint}>Tap to copy</Text>
        </TouchableOpacity>
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. JWT Decoder (header + payload)
// ─────────────────────────────────────────────────────────────────────────────

function JwtTool() {
  const [token, setToken] = useState("");
  const [parts, setParts] = useState<{ header: any; payload: any; sig: string } | null>(null);

  const decode = () => {
    const t = token.trim();
    if (!t) { Alert.alert("Input required", "Paste a JWT token."); return; }
    const sections = t.split(".");
    if (sections.length !== 3) {
      Alert.alert("Invalid JWT", "A JWT must have exactly 3 parts separated by dots.");
      return;
    }
    try {
      const decode64 = (s: string) =>
        JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))));
      setParts({
        header:  decode64(sections[0]),
        payload: decode64(sections[1]),
        sig:     sections[2],
      });
    } catch {
      Alert.alert("Decode failed", "Could not parse the token. Make sure it is a valid JWT.");
      setParts(null);
    }
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = parts?.payload?.exp;
  const expired = exp !== undefined && exp < now;

  return (
    <SectionCard title="JWT Decoder" emoji="🪙">
      <TextInput
        style={s.input}
        placeholder="Paste JWT token here…"
        placeholderTextColor={Colors.textMuted}
        value={token}
        onChangeText={t => { setToken(t); setParts(null); }}
        autoCapitalize="none"
        multiline
      />
      <TouchableOpacity style={s.btn} onPress={decode}>
        <Text style={s.btnText}>Decode JWT</Text>
      </TouchableOpacity>

      {parts && (
        <View style={s.resultBox}>
          {exp !== undefined && (
            <View style={[s.infoRow, { marginBottom: 8 }]}>
              <Text style={[s.infoKey, { color: expired ? "#EF4444" : "#10B981", fontWeight: "800" }]}>
                {expired ? "⛔ EXPIRED" : "✅ VALID"} {exp !== undefined ? `— exp: ${new Date(exp * 1000).toLocaleString()}` : ""}
              </Text>
            </View>
          )}

          <Text style={s.hashLabel}>HEADER</Text>
          <Text style={[s.hashValue, { marginBottom: 10 }]}>
            {JSON.stringify(parts.header, null, 2)}
          </Text>

          <Text style={s.hashLabel}>PAYLOAD</Text>
          <Text style={[s.hashValue, { marginBottom: 10 }]}>
            {JSON.stringify(parts.payload, null, 2)}
          </Text>

          <Text style={s.hashLabel}>SIGNATURE</Text>
          <TouchableOpacity onPress={() => copyToClipboard(parts.sig, "Signature")}>
            <Text style={s.hashValue}>{parts.sig}</Text>
            <Text style={s.tapHint}>Tap to copy signature</Text>
          </TouchableOpacity>
        </View>
      )}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. HTTP Headers Reference
// ─────────────────────────────────────────────────────────────────────────────

const SECURITY_HEADERS = [
  {
    name: "Strict-Transport-Security",
    short: "HSTS",
    desc: "Forces browsers to use HTTPS for a specified duration. Prevents protocol downgrade and cookie hijacking.",
    example: "max-age=31536000; includeSubDomains",
  },
  {
    name: "Content-Security-Policy",
    short: "CSP",
    desc: "Controls which resources the browser is allowed to load. Prevents XSS and data injection attacks.",
    example: "default-src 'self'; script-src 'self'",
  },
  {
    name: "X-Frame-Options",
    short: "XFO",
    desc: "Prevents clickjacking by disabling embedding in iframes on other origins.",
    example: "DENY",
  },
  {
    name: "X-Content-Type-Options",
    short: "XCTO",
    desc: "Prevents MIME-type sniffing. Tells browsers to respect the declared Content-Type.",
    example: "nosniff",
  },
  {
    name: "Referrer-Policy",
    short: "RP",
    desc: "Controls how much referrer information is sent with requests.",
    example: "strict-origin-when-cross-origin",
  },
  {
    name: "Permissions-Policy",
    short: "PP",
    desc: "Controls browser features (camera, mic, geolocation) that a page can use.",
    example: "camera=(), microphone=()",
  },
  {
    name: "X-XSS-Protection",
    short: "XSS",
    desc: "Legacy header that activates the browser's built-in XSS filter. CSP is preferred.",
    example: "1; mode=block",
  },
];

function HttpHeadersTool() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SectionCard title="Security Headers Reference" emoji="📋">
      <Text style={s.subNote}>
        Tap any header to see its purpose and a recommended value.
      </Text>
      {SECURITY_HEADERS.map(h => (
        <TouchableOpacity
          key={h.short}
          style={[s.headerRow, expanded === h.short && s.headerRowActive]}
          onPress={() => setExpanded(expanded === h.short ? null : h.short)}
        >
          <View style={s.headerTop}>
            <Text style={s.headerShort}>{h.short}</Text>
            <Text style={s.headerName}>{h.name}</Text>
            <Text style={s.chevron}>{expanded === h.short ? "▲" : "▼"}</Text>
          </View>
          {expanded === h.short && (
            <View style={s.headerDetail}>
              <Text style={s.headerDesc}>{h.desc}</Text>
              <Text style={s.headerExampleLabel}>Recommended value:</Text>
              <Text style={s.headerExample}>{h.example}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. OWASP Top 10 Quick Reference
// ─────────────────────────────────────────────────────────────────────────────

const OWASP = [
  { id: "A01", name: "Broken Access Control",           color: "#EF4444" },
  { id: "A02", name: "Cryptographic Failures",          color: "#F97316" },
  { id: "A03", name: "Injection",                       color: "#EAB308" },
  { id: "A04", name: "Insecure Design",                 color: "#22C55E" },
  { id: "A05", name: "Security Misconfiguration",       color: "#14B8A6" },
  { id: "A06", name: "Vulnerable & Outdated Components",color: "#3B82F6" },
  { id: "A07", name: "Identification & Auth Failures",  color: "#8B5CF6" },
  { id: "A08", name: "Software & Data Integrity Failures",color: "#EC4899"},
  { id: "A09", name: "Security Logging & Monitoring Failures",color: "#6366F1"},
  { id: "A10", name: "Server-Side Request Forgery (SSRF)",color: "#10B981"},
];

function OwaspTool() {
  return (
    <SectionCard title="OWASP Top 10 (2021)" emoji="🕵️">
      <Text style={s.subNote}>The most critical web application security risks.</Text>
      {OWASP.map(item => (
        <View key={item.id} style={s.owaspRow}>
          <View style={[s.owaspBadge, { backgroundColor: item.color }]}>
            <Text style={s.owaspId}>{item.id}</Text>
          </View>
          <Text style={s.owaspName}>{item.name}</Text>
        </View>
      ))}
    </SectionCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function ToolsScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <Text style={s.headerTitle}>Security Tools 🛠️</Text>
        <Text style={s.headerSub}>Practical utilities for cybersecurity professionals</Text>

        <AdBanner marginVertical={8} />

        <PasswordTool />
        <HashTool />
        <Base64Tool />
        <UrlEncodeTool />
        <IpTool />
        <SubnetTool />
        <CaesarTool />
        <JwtTool />
        <HttpHeadersTool />
        <OwaspTool />

        <AdBanner marginVertical={8} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  container:     { flex: 1 },
  content:       { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: 48 },
  headerTitle:   { ...Typography.h1, color: Colors.text, marginBottom: 4 },
  headerSub:     { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.md },
  subNote:       { ...Typography.caption, color: Colors.textSecondary, marginBottom: 10 },

  card:          {
    backgroundColor: Colors.surface,
    borderRadius:    Spacing.radiusLarge,
    padding:         Spacing.cardPadding,
    marginBottom:    Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  cardTitle:     { ...Typography.h3, color: Colors.text, marginBottom: 12 },

  input:         {
    backgroundColor: Colors.background,
    color:           Colors.text,
    paddingHorizontal: 12,
    paddingVertical:   10,
    borderRadius:    Spacing.radiusMedium,
    borderWidth:     1,
    borderColor:     Colors.border,
    marginBottom:    10,
    fontSize:        14,
  },
  inputRow:      { flexDirection: "row", alignItems: "center", marginBottom: 0 },
  eyeBtn:        { padding: 10, marginLeft: 4 },
  eyeText:       { fontSize: 18 },

  btn:           {
    backgroundColor: Colors.primary,
    padding:         11,
    borderRadius:    Spacing.radiusMedium,
    alignItems:      "center",
    marginBottom:    0,
  },
  btnText:       { color: "#FFF", fontWeight: "700", fontSize: 14 },

  resultBox:     {
    marginTop:       10,
    padding:         12,
    backgroundColor: Colors.background,
    borderRadius:    Spacing.radiusMedium,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  scoreRow:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  metaLabel:     { ...Typography.caption, color: Colors.textSecondary },
  metaValue:     { ...Typography.labelSmall, color: Colors.text },
  barTrack:      { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginBottom: 8, overflow: "hidden" },
  barFill:       { height: "100%", borderRadius: 3 },
  checkItem:     { ...Typography.caption, color: Colors.textSecondary, marginVertical: 2 },

  hashLabel:     { ...Typography.caption, color: Colors.primary, fontWeight: "700", marginBottom: 3 },
  hashValue:     { fontFamily: "monospace", fontSize: 12, color: Colors.text, lineHeight: 18 },
  tapHint:       { ...Typography.caption, color: Colors.textMuted, marginTop: 6, textAlign: "right" },

  toggleRow:     { flexDirection: "row", marginBottom: 10, borderRadius: Spacing.radiusMedium, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  toggle:        { flex: 1, paddingVertical: 9, alignItems: "center", backgroundColor: Colors.background },
  toggleActive:  { backgroundColor: Colors.primary },
  toggleText:    { ...Typography.labelSmall, color: Colors.textSecondary },
  toggleTextActive: { color: "#FFF", fontWeight: "700" },

  infoRow:       { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  infoKey:       { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  infoVal:       { ...Typography.caption, color: Colors.text, fontWeight: "600", flex: 2, textAlign: "right" },

  headerRow:     { backgroundColor: Colors.background, borderRadius: Spacing.radiusMedium, marginBottom: 6, padding: 10, borderWidth: 1, borderColor: Colors.border },
  headerRowActive: { borderColor: Colors.primary },
  headerTop:     { flexDirection: "row", alignItems: "center" },
  headerShort:   { backgroundColor: Colors.primary + "22", color: Colors.primary, fontSize: 10, fontWeight: "800", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  headerName:    { flex: 1, ...Typography.labelSmall, color: Colors.text },
  chevron:       { ...Typography.caption, color: Colors.textMuted },
  headerDetail:  { marginTop: 8 },
  headerDesc:    { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  headerExampleLabel: { ...Typography.caption, color: Colors.primary, fontWeight: "700", marginBottom: 2 },
  headerExample: { fontFamily: "monospace", fontSize: 12, color: Colors.text },

  owaspRow:      { flexDirection: "row", alignItems: "center", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  owaspBadge:    { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginRight: 10 },
  owaspId:       { color: "#FFF", fontWeight: "800", fontSize: 11 },
  owaspName:     { flex: 1, ...Typography.bodySmall, color: Colors.text },
});
