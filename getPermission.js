require("dotenv").config();
const axios = require("axios");

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX; // e.g., us20
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

async function fetchPermissions() {
  try {
    const listUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}`;
    const listRes = await axios.get(listUrl, {
      headers: { Authorization: `apikey ${MAILCHIMP_API_KEY}` },
    });

    console.log("✅ Marketing Permissions:");
    console.log(listRes.data.marketing_permissions);
  } catch (err) {
    console.error("❌ Error fetching permissions:", err.response?.data || err.message);
  }
}

fetchPermissions();
