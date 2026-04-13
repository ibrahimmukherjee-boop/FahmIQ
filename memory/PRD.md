# FahmIQ — Product Requirements Document

## Overview
FahmIQ is a premium, privacy-first iOS AI agent app that runs all inference on-device using open-source Qwen language models via MLC LLM. It features a multi-agent reasoning pipeline with adversarial review, designed for professionals and researchers who demand accuracy over sycophancy.

## App Identity
- **Name**: FahmIQ
- **Tagline**: Think clearly. Stay private.
- **Bundle ID**: com.seekconsultingltd.fahmiq
- **Platform**: iOS (iPhone)
- **Category**: Productivity
- **Version**: 1.0.1 (Build 2)

## Architecture
- **Frontend**: Expo SDK 54 + React Native + Expo Router v3 + TypeScript
- **State Management**: Zustand v5
- **On-Device Inference**: @react-native-ai/mlc (MLC LLM Engine)
- **Models**: Qwen2.5 series (0.5B Fast, 1.5B Balanced, 3B Precision)
- **Backend**: FastAPI (web search proxy only)
- **IAP**: react-native-iap (StoreKit 2)

## Features Implemented

### Core Features
1. **Multi-Agent Pipeline**: Scout → Planner → Worker → Critic → Validator → Synthesizer → Judge
2. **On-Device Inference**: Real MLC provider for iOS builds + DevProvider for development
3. **4 Tab Navigation**: Ask, Task, Workspace, Automate
4. **Onboarding Flow**: 4-screen flow (Welcome, Privacy, Model Download, Guardrails)
5. **Settings**: Theme toggle (dark/light), Model Bands, Subscription management
6. **Paywall**: Pro ($9.99/mo) and Ultra ($19.99/mo) tiers
7. **Real Web Search**: DuckDuckGo HTML scraping via backend proxy ($0 cost)
8. **Content Guardrails**: Safety filter, sycophancy blocker, emotional dependency guard

### Design System
- Dark/Light theme with #5B6EF5 indigo accent
- SF Pro typography, 4pt grid spacing
- Spring physics animations via react-native-reanimated v3
- Animated concentric circles logo (red, blue, green)

### IAP Products
- com.seekconsultingltd.fahmiq.pro.monthly ($9.99)
- com.seekconsultingltd.fahmiq.pro.yearly ($71.99)
- com.seekconsultingltd.fahmiq.ultra.monthly ($19.99)
- com.seekconsultingltd.fahmiq.ultra.yearly ($143.99)

## Apple Configuration
- **Team ID**: RZG4B93C88
- **Issuer ID**: 4c19f293-33c2-47d3-a911-766e694b8095
- **Key ID**: GT5LJK6XLQ
- **Numeric App ID**: 6761907571
- **Minimum iOS**: 17.0

## File Structure
- 30+ TypeScript files implementing complete app
- Agent architecture with real inference engine interfaces
- Backend with real DuckDuckGo web search (free, no API key)
- StoreKit integration with real IAP code

## Privacy
- Zero cloud LLM API calls
- Zero analytics/telemetry
- All data stored locally on device
- Web search is the only network operation (optional)
