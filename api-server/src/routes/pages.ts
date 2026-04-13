import { Router } from "express";

const pagesRouter = Router();

const marketingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FahmIQ — Private On-Device AI</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0A0A14;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}
  .hero{text-align:center;padding:80px 24px 60px}
  .logo{font-size:48px;font-weight:800;letter-spacing:-1px;background:linear-gradient(135deg,#6366f1,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .tagline{margin-top:16px;font-size:22px;color:#a1a1aa;font-weight:400}
  .badges{display:flex;gap:12px;justify-content:center;margin-top:28px;flex-wrap:wrap}
  .badge{background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);color:#818cf8;padding:6px 16px;border-radius:999px;font-size:14px;font-weight:500}
  .features{max-width:800px;margin:0 auto;padding:0 24px 80px;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}
  .card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px}
  .card h3{font-size:16px;font-weight:600;margin-bottom:8px;color:#e2e8f0}
  .card p{font-size:14px;color:#71717a;line-height:1.6}
  .icon{font-size:28px;margin-bottom:12px}
  .cta{text-align:center;padding:0 24px 80px}
  .cta a{display:inline-block;background:linear-gradient(135deg,#6366f1,#22d3ee);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:18px;font-weight:600}
  footer{text-align:center;padding:24px;color:#3f3f46;font-size:13px;border-top:1px solid rgba(255,255,255,.06)}
</style>
</head>
<body>
<div class="hero">
  <div class="logo">FahmIQ</div>
  <p class="tagline">Expert AI Reasoning. Entirely On Your Device.</p>
  <div class="badges">
    <span class="badge">No Cloud</span>
    <span class="badge">No Tracking</span>
    <span class="badge">Works Offline</span>
    <span class="badge">iOS Only</span>
  </div>
</div>
<div class="features">
  <div class="card"><div class="icon">🔒</div><h3>Private by Design</h3><p>All inference runs locally on your iPhone. Your conversations never leave your device.</p></div>
  <div class="card"><div class="icon">🧠</div><h3>4-Band Pipeline</h3><p>Scout → Worker → Critic → Judge — four AI agents collaborate to give you the best possible answer.</p></div>
  <div class="card"><div class="icon">🎯</div><h3>9 Expert Domains</h3><p>Strategy, legal, finance, engineering, research, cybersecurity, product, data, and more.</p></div>
  <div class="card"><div class="icon">⚡</div><h3>Think@N Technology</h3><p>Multiple parallel reasoning paths compete head-to-head. The strongest answer wins.</p></div>
  <div class="card"><div class="icon">🌐</div><h3>Optional Web Search</h3><p>Pull live information from the web without revealing your identity.</p></div>
  <div class="card"><div class="icon">💾</div><h3>Long-Term Memory</h3><p>FahmIQ remembers your preferences and expertise across sessions.</p></div>
</div>
<div class="cta">
  <a href="https://apps.apple.com/app/fahmiq/id6761907571">Download on the App Store</a>
</div>
<footer>
  © 2026 Seek Consulting Ltd · <a href="/fahmiq/support" style="color:#52525b">Support</a> · <a href="/fahmiq/privacy" style="color:#52525b">Privacy Policy</a>
</footer>
</body>
</html>`;

const supportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FahmIQ Support</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0A0A14;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}
  header{text-align:center;padding:60px 24px 40px;border-bottom:1px solid rgba(255,255,255,.08)}
  header a{color:#6366f1;text-decoration:none;font-size:14px}
  h1{font-size:36px;font-weight:700;margin-top:8px}
  h1 span{background:linear-gradient(135deg,#6366f1,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .content{max-width:720px;margin:0 auto;padding:40px 24px 80px}
  .faq{margin-bottom:32px;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:32px}
  .faq h3{font-size:17px;font-weight:600;color:#e2e8f0;margin-bottom:10px}
  .faq p{font-size:15px;color:#71717a;line-height:1.7}
  .contact{background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:16px;padding:32px;text-align:center;margin-top:40px}
  .contact h2{font-size:20px;font-weight:600;margin-bottom:8px}
  .contact p{color:#71717a;margin-bottom:20px}
  .contact a{display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600}
  footer{text-align:center;padding:24px;color:#3f3f46;font-size:13px;border-top:1px solid rgba(255,255,255,.06)}
</style>
</head>
<body>
<header>
  <a href="/fahmiq">← FahmIQ</a>
  <h1>Support for <span>FahmIQ</span></h1>
</header>
<div class="content">
  <div class="faq">
    <h3>How does FahmIQ work without internet?</h3>
    <p>FahmIQ downloads Qwen2.5 language models (~1.3 GB) to your iPhone on first launch. After that, all AI reasoning runs entirely on-device using Apple's Neural Engine. No internet connection is needed for AI responses.</p>
  </div>
  <div class="faq">
    <h3>How much storage does FahmIQ need?</h3>
    <p>Approximately 1.3 GB for the on-device models, plus the app itself (~50 MB). We recommend at least 2 GB of free space before downloading.</p>
  </div>
  <div class="faq">
    <h3>What iPhone models are supported?</h3>
    <p>FahmIQ requires iOS 17 or later. For best performance, an iPhone 15 Pro or newer is recommended, as the A17 Pro and A18 chips significantly accelerate on-device inference.</p>
  </div>
  <div class="faq">
    <h3>Does FahmIQ collect any personal data?</h3>
    <p>No. FahmIQ does not collect, transmit, or store any personal data on external servers. All conversations stay on your device. The optional web search feature uses DuckDuckGo and does not send identifying information.</p>
  </div>
  <div class="faq">
    <h3>What is the 4-band pipeline?</h3>
    <p>FahmIQ routes your question through four AI stages: Scout (context analysis), Worker (domain-expert response), Critic (adversarial stress-testing), and Judge (best-answer synthesis). This multi-agent approach produces higher quality answers than a single model.</p>
  </div>
  <div class="faq">
    <h3>How do I delete my data?</h3>
    <p>All your data is stored locally on your device. To delete everything, go to Settings → FahmIQ → Delete App, or use the in-app Settings → Clear All Data option. Uninstalling the app removes all data permanently.</p>
  </div>
  <div class="contact">
    <h2>Still need help?</h2>
    <p>Our team typically responds within one business day.</p>
    <a href="mailto:support@seek.consulting">Email Support</a>
  </div>
</div>
<footer>© 2026 Seek Consulting Ltd</footer>
</body>
</html>`;

const privacyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FahmIQ Privacy Policy</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0A0A14;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}
  header{text-align:center;padding:60px 24px 40px;border-bottom:1px solid rgba(255,255,255,.08)}
  header a{color:#6366f1;text-decoration:none;font-size:14px}
  h1{font-size:36px;font-weight:700;margin-top:8px}
  .content{max-width:720px;margin:0 auto;padding:40px 24px 80px}
  h2{font-size:18px;font-weight:600;color:#e2e8f0;margin:28px 0 10px}
  p{font-size:15px;color:#71717a;line-height:1.8;margin-bottom:14px}
  footer{text-align:center;padding:24px;color:#3f3f46;font-size:13px;border-top:1px solid rgba(255,255,255,.06)}
</style>
</head>
<body>
<header>
  <a href="/fahmiq">← FahmIQ</a>
  <h1>Privacy Policy</h1>
</header>
<div class="content">
  <p><strong>Last updated:</strong> April 2026</p>
  <h2>We Collect No Data</h2>
  <p>FahmIQ is built on a simple principle: your conversations are yours alone. The app does not collect, transmit, or share any personal data with Seek Consulting Ltd or any third party.</p>
  <h2>On-Device Processing</h2>
  <p>All AI inference in FahmIQ is performed locally on your device using downloaded language models. Your questions and answers are never sent to any server.</p>
  <h2>Optional Web Search</h2>
  <p>If you enable web search, FahmIQ retrieves search results using DuckDuckGo's API. Search queries are not associated with your identity, device, or account in any way.</p>
  <h2>Local Storage Only</h2>
  <p>Conversation history, memory, and settings are stored exclusively in your device's local storage (AsyncStorage). This data is never uploaded or backed up to external servers.</p>
  <h2>Analytics &amp; Advertising</h2>
  <p>FahmIQ contains no analytics SDKs, no advertising networks, and no crash reporting services that transmit data externally.</p>
  <h2>Contact</h2>
  <p>Questions about this policy? Email us at <a href="mailto:privacy@seek.consulting" style="color:#6366f1">privacy@seek.consulting</a></p>
</div>
<footer>© 2026 Seek Consulting Ltd</footer>
</body>
</html>`;

pagesRouter.get(["/fahmiq", "/fahmiq/"], (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(marketingHtml);
});

pagesRouter.get("/fahmiq/support", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(supportHtml);
});

pagesRouter.get("/fahmiq/privacy", (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(privacyHtml);
});

export default pagesRouter;
