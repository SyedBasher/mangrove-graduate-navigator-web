import { PAYMENTS_ENABLED } from './config.js';

export async function mountPaidReportDeliveryIfUnlocked() {
  // Paid delivery is intentionally private-core controlled.
  // The public shell exposes no payment or report-generation implementation.
  if (!PAYMENTS_ENABLED) return false;
  return false;
}
