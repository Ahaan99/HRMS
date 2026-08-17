/**
 * WhatsApp sender via Meta WhatsApp Cloud API.
 * Uses WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN when configured;
 * otherwise runs in dev/simulation mode (logs the message and reports
 * delivered:false so callers can surface simulation status).
 */
export const sendWhatsApp = async (to, body) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (phoneNumberId && accessToken) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: String(to).replace(/[^\d+]/g, ""),
            type: "text",
            text: { body },
          }),
        },
      );
      if (!res.ok) {
        const err = await res.text();
        console.error("[WhatsApp] Cloud API error:", err.slice(0, 200));
        return { delivered: false, error: "WhatsApp send failed" };
      }
      return { delivered: true };
    } catch (e) {
      console.error("[WhatsApp] exception:", e.message);
      return { delivered: false, error: e.message };
    }
  }

  console.log(`[WhatsApp dev-mode] To ${to}: ${body}`);
  return { delivered: false, dev: true };
};

export const whatsappConfigured = () =>
  !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);

export const smsConfigured = () =>
  !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  );
