# FahmIQ — Push to iOS App Store

## Quick Start (3 Commands)

After saving to GitHub via Emergent:

```bash
# 1. Login to Expo (one-time, create account at expo.dev if needed)
cd frontend
npx eas-cli login

# 2. Build for iOS (runs on Expo's cloud — takes ~15 min)
npx eas-cli build --platform ios --profile production --non-interactive

# 3. Auto-submits to App Store Connect (configured in eas.json)
# If autoSubmit fails, manually submit:
npx eas-cli submit --platform ios --profile production --non-interactive
```

## GitHub Actions (Automatic)

If you want builds to trigger automatically on push:

1. Go to **expo.dev** → Create account → Settings → Access Tokens → Create token
2. In your GitHub repo, go to **Settings → Secrets → Actions**
3. Add these secrets:
   - `EXPO_TOKEN` = your Expo access token
   - `ASC_API_KEY` = contents of AuthKey_9U8HZ8CRST.p8

The workflow at `.github/workflows/build-ios.yml` will build and submit automatically.

## Apple Credentials (Already Configured in eas.json)
- App ID: 6761907571
- Team ID: RZG4B93C88
- API Key ID: 9U8HZ8CRST
- Issuer ID: 4c19f293-33c2-47d3-a911-766e694b8095
- Key File: AuthKey_9U8HZ8CRST.p8 (in frontend/ directory)

## App Store Connect Status
- ✅ App description, keywords, promotional text
- ✅ Age rating: 4+
- ✅ Category: Productivity
- ✅ Subscription group: FahmIQ Subscriptions
- ✅ 4 subscriptions with localizations, durations, prices, availability
- ✅ Review notes for all subscriptions
- ⏳ Build upload (after EAS build)
- ⏳ Submit for review
