import express from "express";
import client from "../config/twilio.js";
import { ENV } from "../config/env.js";

const router = express.Router();
router.get("/test-sms", async (req, res) => {
  try {
    const message = await client.messages.create({
      body: "🚨 Test SMS from HRMS",
      from: ENV.TWILIO_PHONE,
      to: ENV.MY_PHONE, // must be verified number
    });

    res.json({ success: true, sid: message.sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SMS failed" });
  }
});


router.get("/call", (req, res) => {
  res.send("CALL ROUTE WORKING");
});


router.post("/call", async (req, res) => {
  try {
    const { phone } = req.body;

    const call = await client.calls.create({
      to: phone,
      from: ENV.TWILIO_PHONE,
      url: "https://hrms-backend.recruweb.com/api/voice",
    });

    res.json({ success: true, sid: call.sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/voice", (req, res) => {
  res.type("text/xml");

  res.send(`
    <Response>
      <Say>Hello, this is HR from your company.</Say>
    <Gather 
      input="speech" 
      action="https://hrms-backend.recruweb.com/api/response" 
      method="POST"
    >
        <Say>Are you looking for a job change?</Say>
      </Gather>
    </Response>
  `);
});

router.post("/response", (req, res) => {
  const speech = req.body.SpeechResult;

  console.log("User said:", speech);

  res.type("text/xml");
  res.send(`
    <Response>
      <Say>Thanks, we will contact you soon.</Say>
    </Response>
  `);
});

export default router;
