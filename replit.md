# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### FahmIQ (`artifacts/forge-iq`)

iOS-only premium local-first AI agent app. **No external AI API calls** — 100% on-device inference.

**Architecture: 4-Band Pipeline (Scout → Worker[Think@N] → Critic → Judge)**
- Inference provider chain (`InferenceEngine`):
  1. `LocalMLCProvider` — real MLC LLM bridge (Qwen2.5 via `@mlc-ai/mlc-llm-react-native`); `isAvailable()` returns true in EAS iOS build
  2. `MockLocalProvider` — active fallback in Expo Go / web preview; domain-aware responses
  3. `CloudBoostProvider` — permanently OFF
- **Think@N**: Parallel Worker sampling (n=1/2/3 by band), DTR heuristic picks best response
- **Domain-specific Worker prompts**: 9 expert personas (strategy, cyber, research, finance, engineering, academic, legal, product, data)
- **Web Search**: Scout detects queries needing live data → calls `/api/search` proxy (DuckDuckGo + Wikipedia, no key)
- **Long-term memory**: `LongTermMemory` persists user expertise/preferences via AsyncStorage; injected into Worker context
- **Adversarial Critic v2**: Devil's Advocate mode — actively tries to find flaws
- Repair loop fires when Critic aggregate < 0.72
- **Model download screen**: `app/model-download.tsx` — shown on first iOS launch; downloads Qwen2.5 models (~1.3GB total)

**Key Files**
- `src/agents/DeepTaskOrchestrator.ts` — full pipeline with Think@N, domain prompts, web search, memory
- `src/agents/InferenceEngine.ts` — provider chain
- `src/agents/providers/LocalMLCProvider.ts` — real MLC LLM iOS bridge (graceful fallback to mock)
- `src/agents/providers/MockLocalProvider.ts` — web/Expo Go fallback
- `src/agents/orchestrator/ThinkAtN.ts` — parallel multi-sampling with DTR scorer
- `src/agents/prompts/worker.prompts.ts` — 9 domain-specific expert personas
- `src/agents/tools/WebSearch.ts` — web search via API server proxy
- `src/agents/StructuredOutputParser.ts` — JSON extraction with retry
- `src/cognition/LongTermMemory.ts` — persistent cross-session user memory
- `src/cognition/EthicalGuard.ts`, `ClarifyingQuestions.ts` — guardrails
- `src/context/AppContext.tsx` — global state with AsyncStorage persistence
- `src/components/ui/HeroArt.tsx` — dark neural network canvas ("Private · Web Search · On-device")
- `app/model-download.tsx` — model download screen with progress UI
- `app/(tabs)/ask.tsx`, `task.tsx`, `automate.tsx`, `workspace.tsx`, `settings.tsx`
- `app/onboarding.tsx` — 5-slide onboarding flow

**API Server**
- `routes/search.ts` — GET `/api/search?q=` proxy (DuckDuckGo + Wikipedia, no API key)
- `routes/ask.ts` — legacy Claude endpoint (not used by mobile app)

**Design System**
- Navy (#1E3A5F) + Indigo (#6366F1) palette; dark HeroArt canvas (#0A0A14)
- Inter font family; 5 tabs: Ask, Deep Task, Automate, Workspace, Settings

**IAP / Payment System (as of 2026-04-10)**
- Library: `react-native-iap` v14 + `react-native-nitro-modules` (StoreKit 2)
- Product: `com.seekconsultingltd.forgeiq.credits_100` (ASC IAP ID: 6762006063)
  - Type: Consumable — price $0.29 (lowest Apple tier), 100 credits per purchase
  - State: READY_TO_SUBMIT in App Store Connect
- `src/hooks/useIAP.ios.ts` — native iOS purchase flow (initConnection → requestPurchase → finishTransaction)
- `src/hooks/useIAP.ts` — web/simulator mock (Metro picks the right file per platform)
- `src/context/AppContext.tsx` — `addCredits(n)` callback fed to useIAP hook
- Settings screen: "Buy 100 Credits — $0.29" button triggers Apple's native payment sheet
- Credits per task: 0.00000000000001 (essentially free usage per run)

**EAS Build / App Store status (as of 2026-04-10)**
- App name: **FahmIQ** (renamed from Forge IQ due to trademark)
- Bundle ID: `com.seekconsultingltd.forgeiq` (unchanged)
- App Store Connect App ID: **6761907571**
- EAS project: `seekconsultingltd/forge-iq` (project slug unchanged)
- Build #12 (EAS ID: 597e18c0-dafb-4996-81fa-14c5d1269596): in queue — full IAP implementation
- App version 1.0 in REJECTED state — needs new build + IAP resubmission
- Credentials: `ios_certs/dist_cert_sha1.p12` (SHA1-3DES P12 with full Apple WWDR chain)
- To rebuild: `GIT_OPTIONAL_LOCKS=1 npx eas-cli build --platform ios --profile production --non-interactive --no-wait`
- To submit binary: `GIT_OPTIONAL_LOCKS=1 npx eas-cli submit --platform ios --id <BUILD_ID> --non-interactive`
- After submit: create new review submission in ASC → link IAP 6762006063 → resubmit

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
