# FahmIQ — iOS App Store Submission Guide

## What's Already Done (via API)

### ✅ App Store Connect — Completed Automatically
1. **Subscription Group Created**: "FahmIQ Subscriptions" (ID: 22030664)
2. **4 Subscription Products Created**:
   - `com.seekconsultingltd.fahmiq.pro.monthly` (ID: 6762152952) — MISSING_METADATA
   - `com.seekconsultingltd.fahmiq.pro.yearly` (ID: 6762152979) — MISSING_METADATA
   - `com.seekconsultingltd.fahmiq.ultra.monthly` (ID: 6762153137) — MISSING_METADATA
   - `com.seekconsultingltd.fahmiq.ultra.yearly` (ID: 6762152866) — MISSING_METADATA
3. **Existing IAP**: `com.seekconsultingltd.forgeiq.credits_100` - Deep Task Credits Pack (READY_TO_SUBMIT)
4. **EAS Configuration**: `eas.json` created with production build settings
5. **Complete App Code**: 30+ TypeScript files with full agent pipeline

### ✅ Code Configuration
- Bundle ID in app.json: `com.seekconsultingltd.forgeiq` (matches App Store Connect)
- iOS permissions configured (Camera, Photo Library, Microphone)
- Non-exempt encryption flag set (no export compliance needed)
- StoreKit product IDs match App Store Connect

---

## Manual Steps Required (App Store Connect Admin Access)

### Step 1: Complete Subscription Metadata
Go to **App Store Connect → My Apps → FahmIQ → Subscriptions**

For each subscription product, click it and fill in:

**FahmIQ Pro Monthly ($9.99)**:
- Subscription Duration: 1 Month
- Price: $9.99 (Tier 10)
- Localization (en-US):
  - Display Name: "FahmIQ Pro"
  - Description: "Unlimited queries, balanced model access, deep tasks, and web search. All AI runs on your device."

**FahmIQ Pro Yearly ($71.99)**:
- Subscription Duration: 1 Year
- Price: $71.99 (Tier 55)
- Localization (en-US):
  - Display Name: "FahmIQ Pro Annual"
  - Description: "Save 40%! Unlimited queries, balanced model, deep tasks, web search. All AI on-device."

**FahmIQ Ultra Monthly ($19.99)**:
- Subscription Duration: 1 Month
- Price: $19.99 (Tier 20)
- Localization (en-US):
  - Display Name: "FahmIQ Ultra"
  - Description: "Everything in Pro plus precision model, autonomous director, and automation rules."

**FahmIQ Ultra Yearly ($143.99)**:
- Subscription Duration: 1 Year
- Price: $143.99 (Tier 87)
- Localization (en-US):
  - Display Name: "FahmIQ Ultra Annual"
  - Description: "Save 40%! All features including precision model, autonomous director, automation."

### Step 2: Create New App Version (1.0.1)
Go to **App Store Connect → My Apps → FahmIQ → App Store tab**

1. Click "+" next to iOS App to create version 1.0.1
2. Fill in:
   - **What's New**: "Complete rebuild with multi-agent reasoning pipeline, on-device inference with Qwen language models, subscription tiers, and enhanced privacy features."
   - **Description**: 
     ```
     FahmIQ is a rigorous thinking tool for professionals and researchers. Unlike typical AI chatbots, FahmIQ runs ALL AI inference directly on your iPhone — no cloud, no data collection, no sycophancy.

     Key Features:
     • Multi-Agent Pipeline: 7 specialized AI agents analyze every query
     • 100% On-Device: All AI runs on your iPhone using Qwen language models
     • Anti-Sycophancy: Tells you what is TRUE, not what you want to hear
     • Deep Tasks: Multi-step autonomous research projects
     • Web Research: Optional web search for current information
     • Workspace: Save and organize important outputs
     • Automation: Set up rules for recurring AI tasks

     Privacy First:
     • Zero cloud AI processing
     • Zero analytics or telemetry
     • Everything stays on your device

     FahmIQ Pro ($9.99/mo): Balanced model, unlimited queries, deep tasks
     FahmIQ Ultra ($19.99/mo): Precision model, autonomous director, automation
     ```
   - **Keywords**: AI, on-device, private, reasoning, research, agent, thinking, productivity
   - **Promotional Text**: "Think clearly. Stay private. Multi-agent AI reasoning — entirely on your iPhone."
   - **Support URL**: https://seekconsulting.co.uk/support
   - **Copyright**: © 2025 Seek Consulting Ltd

### Step 3: App Privacy
Go to **App Privacy** section:
- Data Types: Select **"Data Not Collected"**
  - FahmIQ does NOT collect any user data
  - No analytics, no tracking, no telemetry
  - All data stays on device

### Step 4: Age Rating
- Set to **4+** (no objectionable content)
- No unrestricted web access (web search is controlled)
- No gambling, violence, or mature content

---

## Build & Submit

### Option A: EAS Build (Recommended)
```bash
# 1. Push code to GitHub first via Emergent "Save to Github"

# 2. Login to Expo (need account at expo.dev)
cd frontend
eas login

# 3. Build for iOS
eas build --platform ios --profile production

# 4. Submit to App Store
eas submit --platform ios --profile production
```

### Option B: Local Build (requires macOS)
```bash
# 1. Clone from GitHub
git clone <your-repo-url>
cd frontend

# 2. Install dependencies
yarn install

# 3. Generate native project
npx expo prebuild --platform ios

# 4. Open in Xcode
open ios/FahmIQ.xcworkspace

# 5. Build and archive in Xcode
# Product → Archive → Distribute to App Store Connect
```

---

## Apple Credentials Reference
- **Team ID**: RZG4B93C88
- **Issuer ID**: 4c19f293-33c2-47d3-a911-766e694b8095
- **Key ID**: GT5LJK6XLQ
- **Auth Key**: AuthKey_GT5LJK6XLQ.p8
- **App ID**: 6761907571
- **Bundle ID**: com.seekconsultingltd.forgeiq
