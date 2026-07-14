// lib/smsService.ts
//
// Generic SMS gateway wrapper. Default implementation targets Africa's Talking
// (the standard gateway for Kenyan SMS), but is isolated behind `sendSms()` so
// swapping providers later means editing this file only — nothing upstream changes.
//
// Required env vars for Africa's Talking:
//   AT_USERNAME, AT_API_KEY, AT_SENDER_ID (optional)

import type { SmsResult } from '@/types';

const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY = process.env.AT_API_KEY;
const AT_SENDER_ID = process.env.AT_SENDER_ID; // optional shortcode/alphanumeric sender

function normalizeKenyanNumber(phone: string): string {
  // Accepts 07xx / 01xx / 2547xx / +2547xx and normalizes to +254 format
  let p = phone.trim().replace(/\s+/g, '');
  if (p.startsWith('+')) return p;
  if (p.startsWith('254')) return `+${p}`;
  if (p.startsWith('0')) return `+254${p.slice(1)}`;
  return `+254${p}`;
}

export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  const to = normalizeKenyanNumber(phone);

  if (!AT_USERNAME || !AT_API_KEY) {
    console.warn('[smsService] AT credentials missing — SMS not sent (dev/no-op mode).', { to, message });
    return { success: false, provider: 'africastalking', error: 'Missing AT credentials' };
  }

  try {
    const body = new URLSearchParams({
      username: AT_USERNAME,
      to,
      message,
      ...(AT_SENDER_ID ? { from: AT_SENDER_ID } : {}),
    });

    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey: AT_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    const data = await res.json();
    const recipient = data?.SMSMessageData?.Recipients?.[0];

    if (!res.ok || !recipient || recipient.status !== 'Success') {
      const err = recipient?.status || data?.SMSMessageData?.Message || 'Unknown SMS failure';
      console.error('[smsService] SMS send failed:', err);
      return { success: false, provider: 'africastalking', error: err };
    }

    return { success: true, provider: 'africastalking', messageId: recipient.messageId };
  } catch (error: any) {
    console.error('[smsService] SMS send threw:', error.message);
    return { success: false, provider: 'africastalking', error: error.message };
  }
}
