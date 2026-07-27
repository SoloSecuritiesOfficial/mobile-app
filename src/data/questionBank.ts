export interface LabQuestion {
  id: string;
  title: string;
  category: "Web App" | "API Security" | "Cryptography" | "Cloud Security" | "Mobile Security" | "Auth & Session" | "Network Defense";
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  points: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUESTION_BANK: LabQuestion[] = [
  // --- WEB APP SECURITY ---
  {
    id: "web-1",
    title: "SQL Injection (SQLi) Authentication Bypass",
    category: "Web App",
    difficulty: "Medium",
    points: 100,
    question: "Select the SQL payload that bypasses authentication for: SELECT * FROM users WHERE user='$input' AND pass='$input'",
    options: ["admin' --", "admin' OR '1'='1", "' OR 1=1 --", "All of the above"],
    correctIndex: 3,
    explanation: "All listed payloads inject SQL syntax that causes the boolean condition to evaluate to true or comment out password checks."
  },
  {
    id: "web-2",
    title: "Reflected Cross-Site Scripting (XSS)",
    category: "Web App",
    difficulty: "Easy",
    points: 50,
    question: "Which HTML tag is used to execute inline JavaScript in a reflective XSS scenario?",
    options: ["<html>", "<script>", "<style>", "<iframe>"],
    correctIndex: 1,
    explanation: "The <script> tag causes web browsers to parse and execute contained JavaScript code."
  },
  {
    id: "web-3",
    title: "DOM-Based XSS Sink Identification",
    category: "Web App",
    difficulty: "Hard",
    points: 150,
    question: "Which JavaScript property acts as an insecure sink for DOM-based XSS when assigned untrusted data?",
    options: ["element.innerText", "element.innerHTML", "console.log()", "Math.random()"],
    correctIndex: 1,
    explanation: "element.innerHTML parses assigned strings as raw HTML markup, executing inline event handlers or script tags."
  },
  {
    id: "web-4",
    title: "Blind SQL Injection (Boolean-Based)",
    category: "Web App",
    difficulty: "Hard",
    points: 150,
    question: "In blind SQL injection where no data is reflected on screen, how do attackers extract database contents character-by-character?",
    options: ["By observing HTTP response status or conditional page differences", "By reading server error logs", "By deleting database tables", "By brute forcing SSL certificates"],
    correctIndex: 0,
    explanation: "Boolean-based blind SQLi leverages conditional SQL queries (e.g. SUBSTRING(username,1,1)='a') that alter the HTTP response."
  },
  {
    id: "web-5",
    title: "Server-Side Template Injection (SSTI)",
    category: "Web App",
    difficulty: "Expert",
    points: 200,
    question: "What test string is commonly evaluated by template engines (e.g. Jinja2, Twig) to confirm Server-Side Template Injection?",
    options: ["{{7*7}}", "<script>alert(1)</script>", "' OR '1'='1", "../../../etc/passwd"],
    correctIndex: 0,
    explanation: "If {{7*7}} evaluates to 49 in the server's rendered output, it confirms expression evaluation in template engines."
  },
  {
    id: "web-6",
    title: "Local File Inclusion (LFI) Traversal",
    category: "Web App",
    difficulty: "Medium",
    points: 100,
    question: "Which parameter string is used in directory traversal to read system files outside the web root on Linux?",
    options: ["../../../../etc/passwd", "<file>passwd</file>", "http://localhost/passwd", "SELECT * FROM files"],
    correctIndex: 0,
    explanation: "Relative path traversal sequence '../' navigates up the directory hierarchy to access system files like /etc/passwd."
  },
  {
    id: "web-7",
    title: "HTTP Request Smuggling (CL.TE)",
    category: "Web App",
    difficulty: "Expert",
    points: 200,
    question: "In a Content-Length / Transfer-Encoding (CL.TE) request smuggling attack, which component uses the Content-Length header?",
    options: ["The Front-End Reverse Proxy", "The Back-End Application Server", "The Client Web Browser", "The DNS Resolver"],
    correctIndex: 0,
    explanation: "In CL.TE vulnerabilities, the front-end proxy processes Content-Length while the back-end processes Transfer-Encoding: chunked."
  },
  {
    id: "web-8",
    title: "Cross-Site Flashing & Clickjacking",
    category: "Web App",
    difficulty: "Medium",
    points: 100,
    question: "Which HTTP header prevents Clickjacking attacks by forbidding a site from being rendered inside an iframe?",
    options: ["X-Frame-Options: DENY", "Strict-Transport-Security", "Access-Control-Allow-Origin: *", "X-Content-Type-Options: nosniff"],
    correctIndex: 0,
    explanation: "X-Frame-Options: DENY instructs browsers not to render the page inside any <frame>, <iframe>, or <object>."
  },
  {
    id: "web-9",
    title: "Unrestricted File Upload Vulnerability",
    category: "Web App",
    difficulty: "Hard",
    points: 150,
    question: "How do attackers achieve Remote Code Execution (RCE) via file upload mechanisms?",
    options: ["By uploading executable code files (e.g. .php, .jsp) to a publicly accessible web directory", "By uploading large text files", "By renaming PNG images to JPG", "By sending invalid Content-Length headers"],
    correctIndex: 0,
    explanation: "If web servers permit execution of uploaded server-side scripts (.php, .jsp, .aspx), opening the file URL executes the code."
  },
  {
    id: "web-10",
    title: "XML External Entity (XXE) Injection",
    category: "Web App",
    difficulty: "Hard",
    points: 150,
    question: "What XML construct allows attackers to read local files during XML parsing in an XXE vulnerability?",
    options: ["<!ENTITY xxe SYSTEM 'file:///etc/passwd'>", "<?xml version='1.0'?>", "<script>fetch('/etc/passwd')</script>", "<!DOCTYPE html>"],
    correctIndex: 0,
    explanation: "XML External Entity definitions using the SYSTEM keyword instruct vulnerable parsers to resolve file URIs."
  },

  // --- API SECURITY ---
  {
    id: "api-1",
    title: "Broken Object Level Authorization (BOLA / IDOR)",
    category: "API Security",
    difficulty: "Medium",
    points: 100,
    question: "In OWASP API Security Top 10, what is Broken Object Level Authorization (BOLA)?",
    options: ["Failure to check if the requesting user has permissions to access the specific object ID in API endpoints", "Using HTTP instead of HTTPS", "Exposing API keys in GitHub", "Sending JSON payloads"],
    correctIndex: 0,
    explanation: "BOLA (IDOR) occurs when an API exposes endpoints that handle object identifiers without proper object-level permission checks."
  },
  {
    id: "api-2",
    title: "Broken User Authentication in REST APIs",
    category: "API Security",
    difficulty: "Easy",
    points: 50,
    question: "Which HTTP header is standard for transmitting JWT Bearer tokens in REST API requests?",
    options: ["Authorization: Bearer <token>", "Cookie: token=<token>", "X-API-Key: <token>", "Content-Type: application/json"],
    correctIndex: 0,
    explanation: "The Authorization HTTP header with Bearer scheme is the standard for RESTful API authentication."
  },
  {
    id: "api-3",
    title: "Excessive Data Exposure in JSON Responses",
    category: "API Security",
    difficulty: "Medium",
    points: 100,
    question: "Why is returning full user database objects (including password hashes & SSNs) in API responses dangerous, even if hidden in the UI?",
    options: ["Clients can inspect raw JSON HTTP response bodies in browser DevTools", "It causes database lockups", "It corrupts SSL certificates", "It slows down CPU rendering"],
    correctIndex: 0,
    explanation: "APIs relying on client-side filtering still expose sensitive fields in network payloads."
  },
  {
    id: "api-4",
    title: "Lack of Resources & Rate Limiting",
    category: "API Security",
    difficulty: "Easy",
    points: 50,
    question: "What defense prevents automated brute-forcing of API authentication endpoints (/api/login)?",
    options: ["Rate Limiting & Throttling (e.g. 5 attempts per minute)", "Increasing database size", "Disabling GET requests", "Using long domain names"],
    correctIndex: 0,
    explanation: "Rate limiting restricts request frequency per IP or account, blocking automated brute-force attacks."
  },
  {
    id: "api-5",
    title: "Mass Assignment Vulnerability",
    category: "API Security",
    difficulty: "Hard",
    points: 150,
    question: "In REST APIs, how does Mass Assignment allow non-admin users to elevate their privileges?",
    options: ["By adding unexpected JSON fields like 'is_admin': true to POST/PUT payloads", "By modifying HTTP user-agent header", "By sending 500 server error codes", "By deleting API documentation"],
    correctIndex: 0,
    explanation: "Mass assignment binds client request parameters directly to internal data model properties without whitelisting."
  },
  {
    id: "api-6",
    title: "CORS Wildcard Misconfiguration",
    category: "API Security",
    difficulty: "Medium",
    points: 100,
    question: "Why is Access-Control-Allow-Origin: * combined with Access-Control-Allow-Credentials: true insecure for sensitive APIs?",
    options: ["It allows arbitrary third-party websites to read authenticated user API responses", "It breaks TLS 1.3 encryption", "It causes 404 Page Not Found errors", "It disables browser cookies"],
    correctIndex: 0,
    explanation: "Wildcard CORS configurations permit malicious origins to read response data from authenticated API calls."
  },
  {
    id: "api-7",
    title: "Broken Function Level Authorization (BFLA)",
    category: "API Security",
    difficulty: "Hard",
    points: 150,
    question: "What is Broken Function Level Authorization in API security?",
    options: ["Regular users accessing administrative API endpoints (e.g. DELETE /api/admin/users)", "Slow API response times", "Using outdated Node.js versions", "Invalid JSON syntax"],
    correctIndex: 0,
    explanation: "BFLA happens when administrative endpoints lack role-based access checks, allowing normal users to invoke admin functions."
  },
  {
    id: "api-8",
    title: "GraphQL Query Alias Depth Exhaustion",
    category: "API Security",
    difficulty: "Expert",
    points: 200,
    question: "How do attackers exploit GraphQL APIs without rate limiting using query aliasing?",
    options: ["By batching hundreds of query aliases into a single HTTP POST request", "By sending raw SQL code", "By deleting schema files", "By sending empty HTTP headers"],
    correctIndex: 0,
    explanation: "GraphQL allows batching multiple query aliases in one request, bypassing traditional HTTP rate limits."
  },

  // --- CRYPTOGRAPHY ---
  {
    id: "crypto-1",
    title: "TLS 1.3 Cryptographic Improvements",
    category: "Cryptography",
    difficulty: "Hard",
    points: 150,
    question: "Which legacy cryptographic algorithm was completely removed in TLS 1.3 due to security flaws?",
    options: ["RSA Key Exchange", "AES-GCM", "ChaCha20-Poly1305", "ECDHE"],
    correctIndex: 0,
    explanation: "TLS 1.3 eliminated RSA key transport in favor of ephemeral Diffie-Hellman (ECDHE) for mandatory Forward Secrecy."
  },
  {
    id: "crypto-2",
    title: "Password Hashing with Salt & Work Factor",
    category: "Cryptography",
    difficulty: "Medium",
    points: 100,
    question: "Why is raw SHA-256 unsuitable for storing user passwords compared to bcrypt or Argon2id?",
    options: ["SHA-256 is too fast, enabling GPU brute-force attacks at billions of hashes/sec", "SHA-256 is asymmetric", "SHA-256 cannot hash strings longer than 10 characters", "SHA-256 produces invalid characters"],
    correctIndex: 0,
    explanation: "Password hashing algorithms like bcrypt and Argon2id feature configurable work factors and built-in salts to resist GPU cracking."
  },
  {
    id: "crypto-3",
    title: "Symmetric vs Asymmetric Encryption",
    category: "Cryptography",
    difficulty: "Easy",
    points: 50,
    question: "Which algorithm is a symmetric block cipher used for high-speed data encryption?",
    options: ["AES-256-GCM", "RSA-4096", "ECC (Elliptic Curve Cryptography)", "Diffie-Hellman"],
    correctIndex: 0,
    explanation: "AES (Advanced Encryption Standard) is a symmetric cipher using the same key for encryption and decryption."
  },
  {
    id: "crypto-4",
    title: "HMAC Data Integrity Verification",
    category: "Cryptography",
    difficulty: "Medium",
    points: 100,
    question: "What does an HMAC (Hash-based Message Authentication Code) provide that a simple cryptographic hash does not?",
    options: ["Authentication of message origin using a shared secret key", "Automatic compression", "Asymmetric public key generation", "Data anonymization"],
    correctIndex: 0,
    explanation: "HMAC combines a secret key with a cryptographic hash, verifying both message integrity and sender authenticity."
  },
  {
    id: "crypto-5",
    title: "Initialization Vector (IV) Reuse in AES-CBC",
    category: "Cryptography",
    difficulty: "Expert",
    points: 200,
    question: "What vulnerability occurs when an Initialization Vector (IV) is reused across multiple encryptions in AES-CBC mode?",
    options: ["Attackers can infer identical plaintext prefixes across encrypted messages", "The key is automatically deleted", "Encryption speed slows down", "Ciphertext length doubles"],
    correctIndex: 0,
    explanation: "IV reuse in CBC mode leads to deterministic ciphertexts, allowing adversaries to detect duplicate plaintext blocks."
  },

  // --- CLOUD & INFRASTRUCTURE SECURITY ---
  {
    id: "cloud-1",
    title: "AWS S3 Bucket Public Read Exposure",
    category: "Cloud Security",
    difficulty: "Easy",
    points: 50,
    question: "Which AWS S3 configuration setting prevents accidental public data leaks?",
    options: ["Block Public Access", "Enable S3 Transfer Acceleration", "Disable S3 Versioning", "Increase Bucket Storage Limit"],
    correctIndex: 0,
    explanation: "AWS S3 Block Public Access enforces bucket policies that override public ACL permissions."
  },
  {
    id: "cloud-2",
    title: "Kubernetes RBAC Privilege Escalation",
    category: "Cloud Security",
    difficulty: "Expert",
    points: 200,
    question: "Which Kubernetes RBAC verb combination on cluster resources allows a compromised service account to escalate to cluster-admin?",
    options: ["create/bind/escalate on ClusterRoleBindings", "get/list on pods", "watch on services", "describe on nodes"],
    correctIndex: 0,
    explanation: "Granting 'bind' or 'escalate' permissions on ClusterRoleBindings lets service accounts assign cluster-admin roles."
  },
  {
    id: "cloud-3",
    title: "Docker Container Root Privilege Escape",
    category: "Cloud Security",
    difficulty: "Hard",
    points: 150,
    question: "Why is running Docker containers with '--privileged' flag dangerous in production?",
    options: ["It grants container processes full access to the host kernel & Linux capabilities", "It disables networking", "It limits container RAM", "It forces HTTP connections"],
    correctIndex: 0,
    explanation: "'--privileged' disables Docker security isolation, allowing containerized processes to access host devices and escape to host root."
  },

  // --- MOBILE SECURITY ---
  {
    id: "mobile-1",
    title: "Android Hardcoded API Keys in Manifest",
    category: "Mobile Security",
    difficulty: "Easy",
    points: 50,
    question: "Why should sensitive API secret keys never be stored directly in AndroidManifest.xml or APK strings.xml?",
    options: ["APKs can be decompiled in seconds using APKTool or JADX", "AndroidManifest.xml cannot read strings", "Android OS deletes strings during updates", "It corrupts the APK build"],
    correctIndex: 0,
    explanation: "Android APK packages are easily decompiled using reverse engineering tools, revealing embedded strings and keys."
  },
  {
    id: "mobile-2",
    title: "SSL/TLS Certificate Pinning in Mobile Apps",
    category: "Mobile Security",
    difficulty: "Hard",
    points: 150,
    question: "What attack does SSL/TLS Certificate Pinning prevent on mobile devices?",
    options: ["Man-In-The-Middle (MITM) proxy inspection using installed custom Root CA certificates", "SQL Injection", "Buffer Overflow", "Device theft"],
    correctIndex: 0,
    explanation: "Certificate Pinning verifies that the server's public key matches an exact hardcoded hash in the mobile app, preventing MITM interception."
  },
  {
    id: "mobile-3",
    title: "iOS Keychain vs NSUserDefaults Storage",
    category: "Mobile Security",
    difficulty: "Medium",
    points: 100,
    question: "Where should sensitive authentication tokens be securely saved on iOS devices?",
    options: ["iOS Keychain Services", "NSUserDefaults", "Plist configuration files", "Raw text files"],
    correctIndex: 0,
    explanation: "iOS Keychain provides encrypted, hardware-backed secure storage for passwords, keys, and tokens."
  },

  // --- AUTH & SESSION ---
  {
    id: "auth-1",
    title: "OAuth 2.0 PKCE Extension",
    category: "Auth & Session",
    difficulty: "Hard",
    points: 150,
    question: "Why is Proof Key for Code Exchange (PKCE) mandatory for public mobile & single-page app OAuth flows?",
    options: ["It prevents authorization code interception attacks on public clients", "It encrypts user passwords", "It speeds up OAuth redirects", "It replaces HTTPS"],
    correctIndex: 0,
    explanation: "PKCE binds authorization code exchange to dynamically generated secret verifiers, protecting public apps lacking client secrets."
  },
  {
    id: "auth-2",
    title: "Session Fixation Attack",
    category: "Auth & Session",
    difficulty: "Medium",
    points: 100,
    question: "How do web applications prevent Session Fixation attacks during user login?",
    options: ["By invalidating current session ID and issuing a new session ID upon authentication", "By storing session IDs in URLs", "By disabling cookies", "By lengthening session timeouts"],
    correctIndex: 0,
    explanation: "Regenerating session IDs upon login ensures attackers cannot force pre-known session keys onto authenticated users."
  },

  // --- NETWORK DEFENSE ---
  {
    id: "net-1",
    title: "DNS Spoofing & Cache Poisoning",
    category: "Network Defense",
    difficulty: "Medium",
    points: 100,
    question: "What security extension adds cryptographic signatures to DNS records to prevent cache poisoning?",
    options: ["DNSSEC (Domain Name System Security Extensions)", "DNSSLC", "HTTPS DNS", "FTP-SEC"],
    correctIndex: 0,
    explanation: "DNSSEC authenticates DNS responses using digital signatures, protecting users from redirection to malicious IP addresses."
  },
  {
    id: "net-2",
    title: "SYN Flood Denial of Service Defense",
    category: "Network Defense",
    difficulty: "Hard",
    points: 150,
    question: "What kernel mechanism mitigates TCP SYN flood attacks by avoiding memory allocation for half-open connections?",
    options: ["SYN Cookies", "TCP Fast Open", "ICMP Redirect", "UDP Buffering"],
    correctIndex: 0,
    explanation: "SYN cookies encode connection state into the initial TCP sequence number, postponing memory allocation until ACK is received."
  }
];
