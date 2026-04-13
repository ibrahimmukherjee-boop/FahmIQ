/**
 * CloudBoostProvider — FahmIQ v2
 * ─────────────────────────────────────────────────────────────────────────────
 * FEATURE-FLAGGED OFF — does NOT activate unless:
 *   1. CLOUD_BOOST_ENABLED = true (env/settings flag)
 *   2. User has explicitly consented
 *
 * Optional relay to high-parameter remote models for long-document processing.
 * No external model API is specified — this is intentionally cloud-agnostic.
 *
 * Status: Off by default. v1 ships entirely local.
 */

import type { InferenceRequest, InferenceResponse } from "../types";

const CLOUD_BOOST_ENABLED = false; // Hard-coded OFF for v1

export class CloudBoostProvider {
  private userConsented = false;

  isAvailable(): boolean {
    return CLOUD_BOOST_ENABLED && this.userConsented;
  }

  setUserConsent(consented: boolean): void {
    this.userConsented = consented;
  }

  async run(_req: InferenceRequest): Promise<InferenceResponse> {
    throw new Error(
      "CloudBoostProvider: feature is disabled in v1. Enable CLOUD_BOOST_ENABLED and obtain user consent to use."
    );
  }
}
