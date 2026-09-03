import { isDbConfigured, saveSubmission, markDeliveredToGhl } from "./db";
import { isEmailConfigured, sendTeamNotification } from "./notify";
import { isConfigured as isGhlConfigured, deliverSubmission } from "./gohighlevel";
import type { Answers, Submission } from "./validation";

export interface DeliveryOutcome {
  /** True when at least one destination is set up. */
  configured: boolean;
  /** True when the submission reached at least one durable destination. */
  delivered: boolean;
  stored: boolean;
  emailed: boolean;
  sentToGhl: boolean;
  submissionId?: string;
  warnings: string[];
}

export function hasAnyDestination(): boolean {
  return isDbConfigured() || isEmailConfigured() || isGhlConfigured();
}

/**
 * Fans a submission out to every configured destination: the database, the
 * team notification email, and GoHighLevel.
 *
 * Each is independent and best-effort — one failing never stops the others,
 * and the caller treats the submission as captured if any of them succeeded.
 * GoHighLevel is entirely optional; the database is the system of record when
 * it's configured.
 */
export async function handleSubmission(
  answers: Answers,
  meta: Submission["meta"],
): Promise<DeliveryOutcome> {
  const warnings: string[] = [];
  let submissionId: string | undefined;
  let stored = false;
  let emailed = false;
  let sentToGhl = false;

  if (isDbConfigured()) {
    try {
      submissionId = await saveSubmission(answers, meta);
      stored = true;
    } catch (error) {
      warnings.push(`database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (isEmailConfigured()) {
    try {
      await sendTeamNotification(answers, meta, submissionId);
      emailed = true;
    } catch (error) {
      warnings.push(`email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (isGhlConfigured()) {
    try {
      const result = await deliverSubmission(answers, meta);
      sentToGhl = result.delivered;
      warnings.push(...result.warnings.map((warning) => `gohighlevel: ${warning}`));

      if (stored && submissionId && result.delivered) {
        try {
          await markDeliveredToGhl(submissionId, result.contactId);
        } catch (error) {
          warnings.push(`database: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      warnings.push(`gohighlevel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    configured: hasAnyDestination(),
    delivered: stored || emailed || sentToGhl,
    stored,
    emailed,
    sentToGhl,
    submissionId,
    warnings,
  };
}
