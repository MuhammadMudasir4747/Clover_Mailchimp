

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mongo schema
const mongooseSchema = new mongoose.Schema({
  email: String,
  fname: String,
  lname: String,
  address: String,
  phone_alt: String,
  phone_sms: String,
  birthday: String,
  company: String,
  consentSms: Boolean,
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", mongooseSchema);

// Serve the HTML form
app.get("/form", (req, res) => {
  res.sendFile(__dirname + "/customer.html");
});

// Clover webhook route
// app.post("/webhook/clover", express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString("utf8"); } }), (req, res) => {
//   // Log headers
//   console.log("📥 Headers received:", req.headers);

//   // Log raw body
//   console.log("📥 Raw body:", req.rawBody);

//   // Clover webhook verification
//   if (req.body.verificationCode) {
//     console.log("✅ Clover webhook verification request received");
//     console.log("🔑 Verification Code:", req.body.verificationCode);

//     // Must send the code back so Clover accepts webhook
//     return res.status(200).send(req.body.verificationCode);
//   }

//   // Real webhook events
//   console.log("➡️ Clover webhook event received:");
//   console.dir(req.body, { depth: null });

//   // Respond quickly
//   return res.status(200).send("Webhook received");
// });

// Clover webhook route
app.post(
  "/webhook/clover",
  express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString("utf8"); } }),
  async (req, res) => {
    console.log("📥 Headers received:", req.headers);
    console.log("📥 Raw body:", req.rawBody);

    // ✅ Handle webhook verification
    if (req.body.verificationCode) {
      console.log("✅ Clover webhook verification request received");
      console.log("🔑 Verification Code:", req.body.verificationCode);
      return res.status(200).send(req.body.verificationCode);
    }

    console.log("➡️ Clover webhook event received:");
    console.dir(req.body, { depth: null });

    try {
      const merchantId = Object.keys(req.body.merchants || {})[0];
      const events = req.body.merchants[merchantId] || [];

      for (const event of events) {
        if (event.type === "CREATE" || event.type === "UPDATE") {
          const c = event.object;

          const payload = {
            email: c.emailAddresses?.[0]?.emailAddress || "",
            fname: c.firstName || "",
            lname: c.lastName || "",
            address: c.addresses?.[0]?.address1 || "",
            phone_alt: c.phoneNumbers?.[0]?.phoneNumber || "",
            phone_sms: c.phoneNumbers?.[0]?.phoneNumber || "",
            birthday: c.metadata?.dobMonth && c.metadata?.dobDay
              ? `${c.metadata.dobMonth}/${c.metadata.dobDay}`
              : "",
            company: c.metadata?.businessName || "",
            consentSms: c.marketingAllowed || false,
          };

          console.log("📝 Clover → Mongo payload:", payload);

          // ✅ Upsert into MongoDB (update if email exists, else insert new)
          await User.findOneAndUpdate(
            { email: payload.email },
            payload,
            { upsert: true, new: true }
          );

          console.log("✅ Clover customer saved/updated in MongoDB");
        }
      }
    } catch (err) {
      console.error("❌ Error saving Clover customer:", err);
    }

    // Respond quickly to Clover
    return res.status(200).send("Webhook received");
  }
);


// Get latest customer for prefill
app.get("/api/customer/latest", async (req, res) => {
  try {
    const latest = await User.findOne().sort({ createdAt: -1 }).lean();
    if (!latest) return res.status(404).json({});
    res.json(latest);
  } catch (err) {
    console.error("❌ Error fetching latest customer:", err);
    res.status(500).json({ error: err.message });
  }
});



// Fetch customer data by ID
app.get("/api/customer/:id", async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    console.error("❌ Error fetching customer:", err);
    res.status(500).json({ error: "Server error" });
  }
});





// Save + Mailchimp endpoint
app.post("/save", async (req, res) => {
  try {
    console.log("📥 Incoming form submission:", req.body);

    const payload = {
      email: req.body.email,
      fname: req.body.fname,
      lname: req.body.lname,
      address: req.body.address,
      phone_alt: req.body.phone_alt,
      phone_sms: req.body.smsPhone || req.body.phone || "",
      birthday: req.body.birthday,
      company: req.body.company,
      consentSms: req.body.consent === "true" || req.body.consent === true,
    };

    console.log("📝 Final payload to save:", payload);

    // ✅ Save to MongoDB
    const savedUser = await User.create(payload);
    console.log("✅ Saved to MongoDB:", savedUser);









    // 📤 Send to Mailchimp
    const url = `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_AUDIENCE_ID}/members`;

    const data = {
      email_address: payload.email,
      status: "subscribed", // single opt-in
      merge_fields: {
        FNAME: payload.fname || "",
        LNAME: payload.lname || "",
        PHONE: payload.phone_alt || "",
        SMSPHONE: payload.phone_sms || "",
        BIRTHDAY: payload.birthday || "",
        COMPANY: payload.company || "",
      },
    };

    let mcResponse;
    try {
      mcResponse = await axios.post(url, data, {
        headers: {
          Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
          "Content-Type": "application/json",
        },
      });
      console.log("📤 Sent to Mailchimp:", mcResponse.data);
    } catch (mcErr) {
      console.error("❌ Mailchimp error:", mcErr.response?.data || mcErr.message);
    }

    return res.json({
      success: true,
      user: savedUser,
      mailchimp: mcResponse?.data || null,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log("✅ Connected to MongoDB");
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
