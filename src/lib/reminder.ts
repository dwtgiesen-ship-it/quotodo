import type { Invoice, Company } from "@/types";
import { formatCents, daysOverdue } from "@/lib/utils";

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

/**
 * Generate a polite but firm payment reminder message.
 * Returns both email and WhatsApp versions.
 */
export function generateReminderTexts(invoice: Invoice, company: Company) {
  const clientName = invoice.client_name || "there";
  const amount = formatCents(invoice.total, invoice.currency);
  const dueStr = invoice.due_date ? formatDate(invoice.due_date) : "the agreed date";
  const overdueDays = invoice.due_date ? daysOverdue(invoice.due_date) : 0;
  const overdueText =
    overdueDays > 0 ? ` This payment is ${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue.` : "";

  // Email — full, formal
  const emailSubject = `Reminder: Invoice ${invoice.invoice_number} (${amount})`;
  const emailBody = `Dear ${clientName},

We kindly remind you that invoice ${invoice.invoice_number} (${amount}) was due on ${dueStr}.${overdueText}

We would appreciate payment at your earliest convenience to IBAN ${company.iban}, referencing ${invoice.invoice_number}.

Please let us know if you have any questions or if you have already made the payment — in which case, kindly disregard this message.

Kind regards,
${company.company_name}`;

  // WhatsApp — short, conversational
  const whatsapp = `Hi ${clientName}, a quick reminder about invoice ${invoice.invoice_number} (${amount}) which was due ${dueStr}.${overdueText} Could you confirm payment status when you get a chance? Thanks — ${company.company_name}`;

  return {
    emailSubject,
    emailBody,
    // Combined email text (subject + blank line + body), useful for "copy entire email"
    emailFull: `Subject: ${emailSubject}\n\n${emailBody}`,
    whatsapp,
  };
}
