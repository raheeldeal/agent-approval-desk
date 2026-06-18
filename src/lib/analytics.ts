"use client";

import { usePostHog } from "@posthog/next";

export function captureDeskEvent(
  posthog: ReturnType<typeof usePostHog> | null,
  event: string,
  properties?: Record<string, unknown>,
) {
  posthog?.capture(event, properties);
}
