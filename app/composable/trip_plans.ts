/** Saved trip-planner conversations (XR-archaeology-server `plannerConversations`). */
import moment from "moment";
import { TranslationKey } from "@/locales";
import { fill } from "./auth_errors";

type Translate = (key: TranslationKey) => string;

export interface SavedPlan {
  _id: string;
  title?: string;
  stage?: string;
  conversationId?: string;
  messages?: { role: "user" | "assistant"; content: string; at?: string }[];
  tripPlan?: string;
  tripData?: { startDate?: string; endDate?: string; people?: number };
  createdAt?: string;
  updatedAt?: string;
}

/** Stages at which the AI has produced a full itinerary. */
export function planReady(stage?: string) {
  return stage === "generating_plan" || stage === "refining_plan" || stage === "completed";
}

/** "20 - 22 Sep, 2 people", or what is still missing. */
export function planSummary(plan: SavedPlan, t: Translate) {
  const parts: string[] = [];
  const { startDate, endDate, people } = plan.tripData || {};
  if (startDate) {
    const s = moment.utc(startDate);
    const e = endDate ? moment.utc(endDate) : null;
    if (!e || e.isSame(s, "day")) parts.push(s.format("D MMM YYYY"));
    else if (e.isSame(s, "month")) parts.push(`${s.format("D")} - ${e.format("D MMM YYYY")}`);
    else parts.push(`${s.format("D MMM")} - ${e.format("D MMM YYYY")}`);
  } else {
    parts.push(t("tripPlans.datesNotSet"));
  }
  if (people) parts.push(people === 1 ? t("tripPlans.peopleOne") : fill(t("tripPlans.peopleMany"), { count: people }));
  return parts.join(", ");
}
