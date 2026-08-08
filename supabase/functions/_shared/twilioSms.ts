/**
 * SMS transactionnels via REST Twilio — utilisé depuis les Edge Functions.
 * Secrets : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ; expéditeur : TWILIO_MESSAGING_SERVICE_SID (privilégié) OU TWILIO_FROM_NUMBER (E.164).
 */

export async function sendTwilioTransactionalSms(opts: {
  toE164: string;
  body: string;
}): Promise<{ ok: true; sid?: string } | { ok: false; error: string }> {
  const sid = (Deno.env.get("TWILIO_ACCOUNT_SID") || "").trim();
  const token = (Deno.env.get("TWILIO_AUTH_TOKEN") || "").trim();
  const fromNum = (Deno.env.get("TWILIO_FROM_NUMBER") || "").trim();
  const messagingServiceSid = (Deno.env.get("TWILIO_MESSAGING_SERVICE_SID") || "").trim();

  if (!sid || !token || (!fromNum && !messagingServiceSid)) {
    return { ok: false, error: "twilio_not_configured" };
  }

  const body = opts.body.trim().slice(0, 1530); // évite payloads absurdes
  if (!body) return { ok: false, error: "empty_body" };

  const params = new URLSearchParams({
    To: opts.toE164.trim(),
    Body: body,
  });
  if (messagingServiceSid) params.set("MessagingServiceSid", messagingServiceSid);
  else params.set("From", fromNum);

  const auth = btoa(`${sid}:${token}`);
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    const json = (await res.json().catch(() => ({}))) as {
      sid?: string;
      message?: string;
      code?: number;
      status?: string;
      error_message?: string;
    };

    if (!res.ok) {
      const err =
        typeof json.message === "string"
          ? json.message
          : typeof json.error_message === "string"
            ? json.error_message
            : `twilio_${res.status}`;
      console.error("[twilioSms]", res.status, err, json.code);
      return { ok: false, error: err.slice(0, 200) };
    }
    return { ok: true, sid: typeof json.sid === "string" ? json.sid : undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[twilioSms] fetch error:", msg);
    return { ok: false, error: msg.slice(0, 200) };
  }
}
