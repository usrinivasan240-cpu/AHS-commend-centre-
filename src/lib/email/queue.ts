"use client";
import { firestoreUpdate } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/types";

export async function updateCampaignStatus(campaignId: string, status: string, extra: Record<string, unknown> = {}) {
  await firestoreUpdate(COLLECTIONS.EMAIL_CAMPAIGNS, campaignId, {
    status,
    updated_at: new Date().toISOString(),
    ...extra,
  });
}
