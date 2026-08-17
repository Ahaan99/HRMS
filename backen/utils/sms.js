/**
 * SMS sender. Uses Twilio when TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
 * TWILIO_FROM_NUMBER are configured; otherwise runs in dev mode
 * (logs the message and reports delivered:false so callers can
 * surface the OTP for testing).
 */
export const sendSms = async (to, body) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (sid && token && from) {
    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization:
              "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: to, From: from, Body: body }),
        },
      );
      if (!res.ok) {
        const err = await res.text();
        console.error("[SMS] Twilio error:", err.slice(0, 200));
        return { delivered: false, error: "Twilio send failed" };
      }
      return { delivered: true };
    } catch (e) {
      console.error("[SMS] Twilio exception:", e.message);
      return { delivered: false, error: e.message };
    }
  }

  console.log(`[SMS dev-mode] To ${to}: ${body}`);
  return { delivered: false, dev: true };
};
