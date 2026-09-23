import { firestoreAdd } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/firebase/types";

export async function logCampaignEvent(params: {
  campaign_id: string;
  recipient_id?: string;
  event_type: string;
  event_data?: Record<string, unknown>;
  user_email?: string;
}) {
  try {
    await firestoreAdd(COLLECTIONS.EMAIL_CAMPAIGN_EVENTS, {
      ...params,
      created_at: new Date().toISOString(),
    });
    await firestoreAdd(COLLECTIONS.ACTIVITY_LOG, {
      type: "email_campaign",
      action: params.event_type,
      campaign_id: params.campaign_id,
      recipient_id: params.recipient_id,
      user_email: params.user_email,
      createdAt: new Date(),
    });
  } catch (e) {
    console.warn("audit log failed", e);
  }
}
