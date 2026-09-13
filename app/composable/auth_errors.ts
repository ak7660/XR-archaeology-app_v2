/** Turns an error from the account endpoints into a sentence for the person using the app.
 *
 * The server (XR-archaeology-server server/api/public/account.ts and users) sends
 * English messages plus `data.reason` / `data.field`; mapping on those lets every
 * language show its own wording.
 */
import { TranslationKey } from "@/locales";

type Translate = (key: TranslationKey) => string;

export function describeAuthError(error: any, t: Translate, context?: "login" | "signup" | "code" | "changePassword"): string {
  const code = error?.code;
  const reason = error?.data?.reason;
  const field = error?.data?.field;

  if (!code || error?.name === "Timeout" || /network|timeout|xhr|fetch/i.test(String(error?.message))) return t("authErrors.network");
  if (code === 429) return t("authErrors.tooMany");
  if (code === 409) return t("authErrors.emailTaken");
  if (code === 401) return context === "login" ? t("authErrors.invalidLogin") : t("authErrors.sessionEnded");
  if (code === 400) {
    if (reason === "wrong") return t("authErrors.codeWrong");
    if (reason === "expired" || reason === "missing") return t("authErrors.codeExpired");
    if (reason === "locked") return t("authErrors.codeLocked");
    if (field === "currentPassword") return t("authErrors.currentPasswordWrong");
    if (field === "password") return t("authErrors.passwordShort");
    // The server's own message is written for people; better than a generic line.
    if (error?.message) return error.message;
  }
  return t("authErrors.generic");
}

/** Fill `{name}` placeholders in a translated string. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}
