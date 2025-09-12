// // server.js
// require("dotenv").config();
// const express = require("express");
// const bodyParser = require("body-parser");
// const mongoose = require("mongoose");
// const axios = require("axios");

// const app = express();
// app.use(bodyParser.json());

// // ----------------------
// // MongoDB Atlas Connection
// // ----------------------
// mongoose
//   .connect(process.env.MONGO_URI) // Use URI from .env
//   .then(() => console.log("✅ Connected to MongoDB Atlas"))
//   .catch((err) =>
//     console.error("❌ MongoDB connection error:", err.message)
//   );

// // ----------------------
// // Customer Schema
// // ----------------------
// const customerSchema = new mongoose.Schema({
//   cloverId: { type: String, required: true, unique: true },
//   email: { type: String, required: true },
//   firstName: String,
//   lastName: String,
// });

// const Customer = mongoose.model("Customer", customerSchema);

// // ----------------------
// // Mailchimp API setup
// // ----------------------
// const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
// const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX; // e.g. us7
// const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_AUDIENCE_ID;

// async function syncContactToMailchimp(customer) {
//   try {
//     const data = {
//       email_address: customer.email,
//       status_if_new: "subscribed",
//       merge_fields: {
//         FNAME: customer.firstName || "",
//         LNAME: customer.lastName || "",
//       },
//     };

//     const subscriberHash = require("crypto")
//       .createHash("md5")
//       .update(customer.email.toLowerCase())
//       .digest("hex");

//     const response = await axios.put(
//       `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
//       data,
//       {
//         headers: {
//           Authorization: `apikey ${MAILCHIMP_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("✅ Synced to Mailchimp:", response.data.email_address);
//   } catch (err) {
//     console.error(
//       "❌ Mailchimp sync error:",
//       err.response?.data || err.message
//     );
//   }
// }

// // ----------------------
// // Clover Webhook endpoint
// // ----------------------
// // app.post("/webhook/clover", async (req, res) => {
// //   try {
// //     console.log("📩 Clover Webhook Received:", req.body);

// //     const { objectId, type, payload } = req.body;

// //     if (type === "customer") {
// //       const cloverCustomer = payload;

// //       if (!cloverCustomer || !cloverCustomer.emailAddresses) {
// //         console.log("⚠️ Skipping customer: no email address found.");
// //         return res.sendStatus(200);
// //       }

// //       const email = cloverCustomer.emailAddresses[0].emailAddress;
// //       const firstName = cloverCustomer.firstName || "";
// //       const lastName = cloverCustomer.lastName || "";

// //       // ✅ Upsert in MongoDB
// //       const updated = await Customer.findOneAndUpdate(
// //         { cloverId: cloverCustomer.id },
// //         { email, firstName, lastName },
// //         { upsert: true, new: true }
// //       );

// //       console.log("✅ Customer saved/updated:", updated);

// //       // ✅ Sync to Mailchimp
// //       await syncContactToMailchimp(updated);
// //     }

// //     res.sendStatus(200);
// //   } catch (error) {
// //     console.error("❌ Webhook error:", error.message);
// //     res.sendStatus(500);
// //   }
// // });

// // ----------------------
// // Clover Webhook endpoint
// // ----------------------
// app.post("/webhook/clover", async (req, res) => {
//   try {
//     console.log("📩 Clover Webhook Received:", req.body);

//     const { type, payload, merchants } = req.body;

//     // Case 1: Multiple customers from 'merchants'
//     if (merchants) {
//       for (const merchantId in merchants) {
//         const customers = merchants[merchantId];
//         for (const cloverCustomer of customers) {
//           if (!cloverCustomer.emailAddresses || cloverCustomer.emailAddresses.length === 0) {
//             console.log("⚠️ Skipping customer: no email address found.");
//             continue;
//           }

//           const email = cloverCustomer.emailAddresses[0].emailAddress;
//           const firstName = cloverCustomer.firstName || "";
//           const lastName = cloverCustomer.lastName || "";

//           const updated = await Customer.findOneAndUpdate(
//             { cloverId: cloverCustomer.id },
//             { email, firstName, lastName },
//             { upsert: true, new: true }
//           );

//           console.log("✅ Customer saved/updated:", updated);
//           await syncContactToMailchimp(updated);
//         }
//       }
//     }

//     // Case 2: Single customer from 'payload'
//     else if (type === "customer" && payload) {
//       const cloverCustomer = payload;
//       if (!cloverCustomer.emailAddresses || cloverCustomer.emailAddresses.length === 0) {
//         console.log("⚠️ Skipping customer: no email address found.");
//         return res.sendStatus(200);
//       }

//       const email = cloverCustomer.emailAddresses[0].emailAddress;
//       const firstName = cloverCustomer.firstName || "";
//       const lastName = cloverCustomer.lastName || "";

//       const updated = await Customer.findOneAndUpdate(
//         { cloverId: cloverCustomer.id },
//         { email, firstName, lastName },
//         { upsert: true, new: true }
//       );

//       console.log("✅ Customer saved/updated:", updated);
//       await syncContactToMailchimp(updated);
//     }

//     res.sendStatus(200);
//   } catch (error) {
//     console.error("❌ Webhook error:", error.message);
//     res.sendStatus(500);
//   }
// });



// // ----------------------
// // Start Server
// // ----------------------
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () =>
//   console.log(`🚀 Server running on http://localhost:${PORT}`)
// );













// require("dotenv").config();
// const express = require("express");
// const bodyParser = require("body-parser");
// const mongoose = require("mongoose");
// const axios = require("axios");
// const crypto = require("crypto");

// const app = express();
// app.use(bodyParser.json());

// // ----------------------
// // MongoDB Atlas Connection
// // ----------------------
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ Connected to MongoDB Atlas"))
//   .catch((err) =>
//     console.error("❌ MongoDB connection error:", err.message)
//   );

// // ----------------------
// // Customer Schema
// // ----------------------
// const customerSchema = new mongoose.Schema({
//   cloverId: { type: String, required: true, unique: true },
//   email: { type: String, required: true },
//   firstName: String,
//   lastName: String,
// });

// const Customer = mongoose.model("Customer", customerSchema);

// // ----------------------
// // Mailchimp API setup
// // ----------------------
// const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
// const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;
// const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_AUDIENCE_ID;

// async function syncContactToMailchimp(customer) {
//   try {
//     const data = {
//       email_address: customer.email,
//       status_if_new: "subscribed",
//       merge_fields: {
//         FNAME: customer.firstName || "",
//         LNAME: customer.lastName || "",
//       },
//     };

//     const subscriberHash = crypto
//       .createHash("md5")
//       .update(customer.email.toLowerCase())
//       .digest("hex");

//     const response = await axios.put(
//       `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
//       data,
//       {
//         headers: {
//           Authorization: `apikey ${MAILCHIMP_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("✅ Synced to Mailchimp:", response.data.email_address);
//   } catch (err) {
//     console.error(
//       "❌ Mailchimp sync error:",
//       err.response?.data || err.message
//     );
//   }
// }

// // ----------------------
// // Clover Webhook endpoint
// // ----------------------
// app.post("/webhook/clover", async (req, res) => {
//   try {
//     // Log full payload for debugging
//     console.log("📩 Full Clover Webhook Payload:", JSON.stringify(req.body, null, 2));

//     const { objectId, type, payload } = req.body;

//     if (type === "customer") {
//       const cloverCustomer = payload;

//       // Safe email fetching
//       let email = "dummy@example.com"; // default fallback
//       if (cloverCustomer.emailAddresses && cloverCustomer.emailAddresses.length > 0) {
//         email = cloverCustomer.emailAddresses[0].emailAddress || email;
//       }

//       const firstName = cloverCustomer.firstName || "";
//       const lastName = cloverCustomer.lastName || "";

//       if (!email || email === "dummy@example.com") {
//         console.warn("⚠️ Customer has missing or dummy email:", cloverCustomer);
//       }

//       // Upsert in MongoDB
//       const updated = await Customer.findOneAndUpdate(
//         { cloverId: cloverCustomer.id },
//         { email, firstName, lastName },
//         { upsert: true, new: true }
//       );

//       console.log("✅ Customer saved/updated:", updated);

//       // Sync to Mailchimp
//       await syncContactToMailchimp(updated);
//     }

//     res.sendStatus(200);
//   } catch (error) {
//     console.error("❌ Webhook error:", error.message);
//     res.sendStatus(500);
//   }
// });

// // ----------------------
// // Start Server
// // ----------------------
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));









// server.js
// require("dotenv").config();
// const express = require("express");
// const bodyParser = require("body-parser");
// const mongoose = require("mongoose");
// const axios = require("axios");
// const crypto = require("crypto");

// const app = express();
// app.use(bodyParser.json());

// // ----------------------
// // MongoDB Atlas Connection
// // ----------------------
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ Connected to MongoDB Atlas"))
//   .catch((err) =>
//     console.error("❌ MongoDB connection error:", err.message)
//   );

// // ----------------------
// // Customer Schema
// // ----------------------
// const customerSchema = new mongoose.Schema({
//   cloverId: { type: String, required: true, unique: true },
//   email: { type: String, required: true },
//   firstName: String,
//   lastName: String,
// });

// const Customer = mongoose.model("Customer", customerSchema);

// // ----------------------
// // Mailchimp API setup
// // ----------------------
// const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
// const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX; // e.g. us7
// const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_AUDIENCE_ID;

// // async function syncContactToMailchimp(customer) {
// //   try {
// //     const data = {
// //       email_address: customer.email,
// //       status_if_new: "subscribed",
// //       merge_fields: {
// //         FNAME: customer.firstName || "",
// //         LNAME: customer.lastName || "",
// //       },
// //     };

// //     const subscriberHash = crypto
// //       .createHash("md5")
// //       .update(customer.email.toLowerCase())
// //       .digest("hex");

// //     const response = await axios.put(
// //       `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
// //       data,
// //       {
// //         headers: {
// //           Authorization: `apikey ${MAILCHIMP_API_KEY}`,
// //           "Content-Type": "application/json",
// //         },
// //       }
// //     );

// //     console.log("✅ Synced to Mailchimp:", response.data.email_address);
// //   } catch (err) {
// //     console.error(
// //       "❌ Mailchimp sync error:",
// //       err.response?.data || err.message
// //     );
// //   }
// // }

// async function syncContactToMailchimp(customer) {
//   try {
//     // Construct merge fields
//     const mergeFields = {
//       FNAME: customer.firstName || "",
//       LNAME: customer.lastName || "",
//     };

//     // Add address if available in MongoDB (optional)
//     if (customer.address) {
//       mergeFields.ADDRESS = {
//         addr1: customer.address.address1 || "",
//         addr2: customer.address.address2 || "",
//         city: customer.address.city || "",
//         state: customer.address.state || "",
//         zip: customer.address.zip || "",
//         country: customer.address.country || "",
//       };
//     }

//     const data = {
//       email_address: customer.email,
//       status_if_new: "subscribed",
//       merge_fields: mergeFields,
//     };

//     const subscriberHash = require("crypto")
//       .createHash("md5")
//       .update(customer.email.toLowerCase())
//       .digest("hex");

//     const response = await axios.put(
//       `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
//       data,
//       {
//         headers: {
//           Authorization: `apikey ${MAILCHIMP_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("✅ Synced to Mailchimp:", response.data.email_address);
//   } catch (err) {
//     console.error(
//       "❌ Mailchimp sync error:",
//       err.response?.data || err.message
//     );
//   }
// }


// // ----------------------
// // Clover Webhook endpoint
// // ----------------------
// app.post("/webhook/clover", async (req, res) => {
//   try {
//     console.log("📩 Full Clover Webhook Payload:", JSON.stringify(req.body, null, 2));

//     const merchants = req.body.merchants;
//     if (!merchants) return res.sendStatus(200);

//     const merchantId = Object.keys(merchants)[0];
//     const events = merchants[merchantId];

//     for (const event of events) {
//       if (event.type === "CREATE" || event.type === "UPDATE") {
//         const cloverCustomer = event.object;

//         if (!cloverCustomer || !cloverCustomer.emailAddresses || cloverCustomer.emailAddresses.length === 0) {
//           console.log("⚠️ Skipping customer: no email address found.");
//           continue;
//         }

//         const email = cloverCustomer.emailAddresses[0].emailAddress;
//         const firstName = cloverCustomer.firstName || "";
//         const lastName = cloverCustomer.lastName || "";

//         // Upsert in MongoDB
//         const updated = await Customer.findOneAndUpdate(
//           { cloverId: cloverCustomer.id },
//           { email, firstName, lastName },
//           { upsert: true, new: true }
//         );

//         console.log("✅ Customer saved/updated in MongoDB:", updated);

//         // Sync to Mailchimp
//         await syncContactToMailchimp(updated);
//       }
//     }

//     res.sendStatus(200);
//   } catch (error) {
//     console.error("❌ Webhook error:", error.message);
//     res.sendStatus(500);
//   }
// });

// // ----------------------
// // Start Server
// // ----------------------
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () =>
//   console.log(`🚀 Server running on http://localhost:${PORT}`)
// );













// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(bodyParser.json());


app.use(express.static("public"));

// ----------------------
// MongoDB Atlas Connection
// ----------------------

app.get("/", (req, res) => {
  res.send("🚀 Clover + Mailchimp Server is Running!");
});



app.get("/", (req, res) => {
  res.send("🚀 Clover + Mailchimp Server is Running!");
});




mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) =>
    console.error("❌ MongoDB connection error:", err.message)
  );

// ----------------------
// Customer Schema
// ----------------------
const customerSchema = new mongoose.Schema({
  cloverId: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  smsOptIn: Boolean,
  address: Object,
  raw: Object,
  lastSyncedToMailchimp: Date,
});

const Customer = mongoose.model("Customer", customerSchema);

// ----------------------
// Mailchimp API setup
// ----------------------
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX; // e.g. us7
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_AUDIENCE_ID;

async function syncContactToMailchimp(customer) {
  try {
    // Construct merge fields
    const mergeFields = {
      FNAME: customer.firstName || "",
      LNAME: customer.lastName || "",
    };

    // Add address if available
    if (customer.address) {
      mergeFields.ADDRESS = {
        addr1: customer.address.address1 || "",
        addr2: customer.address.address2 || "",
        city: customer.address.city || "",
        state: customer.address.state || "",
        zip: customer.address.zip || "",
        country: customer.address.country || "",
      };
    }

    const data = {
      email_address: customer.email,
      status_if_new: "subscribed",
      merge_fields: mergeFields,
    };

    const subscriberHash = crypto
      .createHash("md5")
      .update(customer.email.toLowerCase())
      .digest("hex");

    const response = await axios.put(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
      data,
      {
        headers: {
          Authorization: `apikey ${MAILCHIMP_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Synced to Mailchimp:", response.data.email_address);

    // Update last synced timestamp
    customer.lastSyncedToMailchimp = new Date();
    await customer.save();
  } catch (err) {
    console.error(
      "❌ Mailchimp sync error:",
      err.response?.data || err.message
    );
  }
}

// ----------------------
// Clover Webhook endpoint
// ----------------------
app.post("/webhook/clover", async (req, res) => {
  try {
    console.log("📩 Full Clover Webhook Payload:", JSON.stringify(req.body, null, 2));

    const merchants = req.body.merchants;
    if (!merchants) return res.sendStatus(200);

    const merchantId = Object.keys(merchants)[0];
    const events = merchants[merchantId];

    for (const event of events) {
      if (event.type === "CREATE" || event.type === "UPDATE") {
        const cloverCustomer = event.object;

        if (!cloverCustomer || !cloverCustomer.emailAddresses || cloverCustomer.emailAddresses.length === 0) {
          console.log("⚠️ Skipping customer: no email address found.");
          continue;
        }

        const email = cloverCustomer.emailAddresses[0].emailAddress;
        const firstName = cloverCustomer.firstName || "";
        const lastName = cloverCustomer.lastName || "";

        // ✅ Upsert full customer in MongoDB
        const updated = await Customer.findOneAndUpdate(
          { cloverId: cloverCustomer.id },
          {
            firstName,
            lastName,
            email,
            phone: cloverCustomer.phoneNumbers?.[0]?.phoneNumber || "",
            smsOptIn: cloverCustomer.marketingAllowed || false,
            address: cloverCustomer.addresses?.[0] || {},
            raw: cloverCustomer,
          },
          { upsert: true, new: true }
        );

        console.log("✅ Customer saved/updated in MongoDB:", updated);

        // ✅ Sync to Mailchimp
        await syncContactToMailchimp(updated);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    res.sendStatus(500);
  }
});

// ----------------------
// Start Server
// ----------------------


app.get("/form", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Customer.html"));
});


// app.post("/add-customer", (req, res) => {
//   const { firstName, lastName, phone, consent } = req.body;

//   // For now, just return the data back to confirm
//   res.send({
//     message: "Customer received!",
//     data: { firstName, lastName, phone, consent },
//   });
// });



const PORT = process.env.PORT || 3000;
app.listen(3000, () =>
  console.log(`🚀 Server running on http://localhost:${3000}`)
);
