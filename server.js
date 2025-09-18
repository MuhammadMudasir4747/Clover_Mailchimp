

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const crypto = require("crypto");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Mailchimp config
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

/**
 * 🔹 Get marketing permissions from list or member
 */
async function getListMarketingPermissions(testEmail) {
  // Try list endpoint first
  try {
    const listUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}`;
    const listRes = await axios.get(listUrl, {
      headers: { Authorization: `apikey ${MAILCHIMP_API_KEY}` },
    });
    if (Array.isArray(listRes.data.marketing_permissions)) {
      return listRes.data.marketing_permissions;
    }
  } catch (err) {
    console.warn(
      "⚠️ List endpoint didn’t return marketing_permissions:",
      err.response?.data || err.message
    );
  }

  // Fallback to member (requires test email already in list)
  if (testEmail) {
    try {
      const subHash = crypto.createHash("md5").update(testEmail.toLowerCase()).digest("hex");
      const memberUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${subHash}`;
      const memberRes = await axios.get(memberUrl, {
        headers: { Authorization: `apikey ${MAILCHIMP_API_KEY}` },
      });
      if (Array.isArray(memberRes.data.marketing_permissions)) {
        return memberRes.data.marketing_permissions;
      }
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error(`Mailchimp member ${testEmail} not found (HTTP 404). Add one first.`);
      }
      throw new Error(
        `Error fetching member marketing_permissions: ${err.response?.data || err.message}`
      );
    }
  }

  throw new Error("❌ Could not find marketing_permissions from list or member.");
}

/**
 * 🔹 Sync contact to Mailchimp
 */

async function syncToMailchimpWithSms(customer) {
  if (!customer || !customer.email) throw new Error("Missing customer or email");

  // Normalize phone
  let phone = (customer.phone || "").toString().trim().replace(/[^+\d]/g, "");
  if (phone && !phone.startsWith("+")) phone = "+" + phone;

  // Merge fields
  const merge_fields = {
    FNAME: customer.firstName || "",
    LNAME: customer.lastName || "",
  };
  if (phone) {
    merge_fields.PHONE = phone;
    merge_fields.SMSPHONE = phone;
  }

  // Subscriber hash
  const subHash = crypto.createHash("md5").update(customer.email.toLowerCase()).digest("hex");

  // Request body without marketing_permissions
  const body = {
    email_address: customer.email,
    status_if_new: "subscribed",
    merge_fields,
  };

  try {
    const putUrl = `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_AUDIENCE_ID}/members/${subHash}`;
    const resp = await axios.put(putUrl, body, {
      headers: {
        Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Mailchimp synced:", resp.data.email_address);
    return resp.data;
  } catch (error) {
    console.error("❌ Error syncing customer:", error.response?.data || error.message);
    throw error;
  }
}
// Debug route
app.get("/mailchimp/permissions", async (req, res) => {
  try {
    const email = req.query.email; // optional
    const perms = await getListMarketingPermissions(email);
    res.json({ ok: true, marketing_permissions: perms });
  } catch (err) {
    console.error("Error /mailchimp/permissions:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

// Schema
const customerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  phone: String,
  smsOptIn: Boolean,
  lastSyncedToMailchimp: Date,
});
const Customer = mongoose.model("Customer", customerSchema);

// HTML form
app.get("/form", (req, res) => {
  res.sendFile(__dirname + "/public/Customer.html");
});

// Add customer route
app.post("/add-customer", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, consent } = req.body;

    // Save in DB
    const newCustomer = new Customer({
      firstName,
      lastName,
      email,
      phone,
      smsOptIn: consent === "yes",
    });
    await newCustomer.save();

    // Sync with Mailchimp
    await syncToMailchimpWithSms({
      email,
      firstName,
      lastName,
      phone,
      smsOptIn: consent === "yes",
    });

    res.send("✅ Customer added successfully!");
  } catch (err) {
    console.error("❌ Error adding customer:", err.message);
    res.status(500).send("Error adding customer.");
  }
});

// Clover webhook
app.post("/webhook", (req, res) => {
  console.log("📩 Webhook received:", req.body);
  res.sendStatus(200);
});

// Clover OAuth callback
app.get("/auth/clover/callback", async (req, res) => {
  const { code, merchant_id } = req.query;
  if (!code || !merchant_id) return res.status(400).send("Missing code or merchant_id");

  try {
    const tokenResp = await axios.post("https://sandbox.dev.clover.com/oauth/token", null, {
      params: {
        client_id: process.env.CLOVER_CLIENT_ID,
        client_secret: process.env.CLOVER_CLIENT_SECRET,
        code,
      },
    });

    console.log("✅ OAuth Success!");
    console.log("Merchant ID:", merchant_id);
    console.log("Access Token:", tokenResp.data.access_token);

    res.send("✅ Clover App Installed! You can close this window.");
  } catch (err) {
    console.error("❌ OAuth error:", err.message);
    res.status(500).send("OAuth failed");
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

