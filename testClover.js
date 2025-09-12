const axios = require("axios");

const CLOVER_MERCHANT_ID = process.env.CLOVER_MERCHANT_ID || "PKGFWC0HMVSQ1";
const CLOVER_API_TOKEN = process.env.CLOVER_ACCESS_TOKEN || "7adcc6c7-541f-4af0-2012-c70470b84bed";

axios.get(
  `https://sandbox.dev.clover.com/v3/merchants/${CLOVER_MERCHANT_ID}/customers`,
  {
    headers: { Authorization: `Bearer ${CLOVER_API_TOKEN}` },
  }
)
.then(res => console.log("✅ Customers:", res.data))
.catch(err => console.error("❌ Error:", err.response?.data || err.message));
