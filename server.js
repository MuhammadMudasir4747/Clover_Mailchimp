

// require("dotenv").config();
// const express = require("express");
// const bodyParser = require("body-parser");
// const mongoose = require("mongoose");
// const crypto = require("crypto");
// const mailchimp = require("@mailchimp/mailchimp_marketing");

// const app = express();

// // Middleware
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // MongoDB schema
// const userSchema = new mongoose.Schema({
//   email: String,
//   fname: String,
//   lname: String,
//   address: String,
//   phone_alt: String,
//   phone_sms: String,
//   birthday: String,
//   company: String,
// });
// const User = mongoose.model("User", userSchema);

// // Mailchimp setup
// mailchimp.setConfig({
//   apiKey: process.env.MAILCHIMP_API_KEY,
//   server: process.env.MAILCHIMP_SERVER_PREFIX, // e.g. "us3"
// });
// const listId = process.env.MAILCHIMP_AUDIENCE_ID;

// // Cache SMS permission ID
// let smsPermissionId = null;

// // Function to auto-load marketing permissions
// async function loadPermissions() {
//   try {
//     const members = await mailchimp.lists.getListMembersInfo(listId, { count: 1 });
//     if (!members.members.length) {
//       console.warn("⚠️ No members in this audience yet, SMS permission ID not cached.");
//       return;
//     }

//     const exampleMember = members.members[0];
//     if (exampleMember.marketing_permissions) {
//       const smsPerm = exampleMember.marketing_permissions.find(p =>
//         p.text.toLowerCase().includes("sms")
//       );
//       if (smsPerm) {
//         smsPermissionId = smsPerm.marketing_permission_id;
//         console.log("✅ Cached SMS Permission ID:", smsPermissionId);
//       } else {
//         console.warn("⚠️ No SMS permission found in member's marketing permissions.");
//       }
//     }
//   } catch (err) {
//     console.error("❌ Could not load permissions:", err.response?.data || err.message);
//   }
// }

// // Simple form
// app.get("/form", (req, res) => {
//   res.sendFile(__dirname + "/customer.html"); // your HTML form
// });

// // Subscribe / fill fields route
// app.post("/subscribe", async (req, res) => {
//   const { email, phone, fname, lname, address, birthday, company, phone_alt, consent } = req.body;

//   if (!email) return res.status(400).send("Email is required");

//   try {
//     // Save in MongoDB
//     const newUser = new User({
//       email,
//       fname,
//       lname,
//       address,
//       phone_alt,
//       phone_sms: phone,
//       birthday,
//       company
//     });
//     await newUser.save();

//     // Mailchimp subscriber hash
//     const subscriberHash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");

//     // Payload to fill all fields
//     // Payload to fill all fields
// const payload = {
//   email_address: email,
//   status_if_new: "subscribed",
//   merge_fields: {
//     FNAME: fname || "",
//     LNAME: lname || "",
//     PHONE: phone_alt || "",
//     BIRTHDAY: birthday || "",
//     COMPANY: company || "",
//     SMSPHONE: phone.startsWith("+") ? phone : (phone ? `+${phone}` : ""),
//   },
// };

// // Add SMS marketing permission if consent checked
// if (consent === "true" && smsPermissionId) {
//   payload.marketing_permissions = [
//     { marketing_permission_id: smsPermissionId, enabled: true }
//   ];
// }

// console.log("➡️ Final payload:", JSON.stringify(payload, null, 2));


//     // Add SMS marketing permission if consent was given
//     if (consent === "true" && smsPermissionId) {
//       payload.marketing_permissions = [
//         { marketing_permission_id: smsPermissionId, enabled: true }
//       ];
//     }

//     console.log("➡️ Final payload:", JSON.stringify(payload, null, 2));

//     // Update Mailchimp fields
//     const response = await mailchimp.lists.setListMember(listId, subscriberHash, payload);

//     res.send(`<p>✅ User saved in MongoDB and all Mailchimp fields updated for ${response.email_address}</p>`);
//   } catch (err) {
//     console.error("❌ Error filling Mailchimp fields:", err.response?.data || err.message);
//     res.status(500).send(`<p>❌ Error: ${err.response?.data?.detail || err.message}</p>`);
//   }
// });


// // Connect DB and start server
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("✅ Connected to MongoDB");
//     app.listen(5000, async () => {
//       console.log("🚀 Server running at http://localhost:5000");
//       await loadPermissions(); // load SMS permission ID at startup
//     });
//   })
//   .catch(err => console.error("❌ MongoDB connection error:", err));



// server.js (CommonJS style)

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const axios = require("axios");
const mailchimp = require("@mailchimp/mailchimp_marketing");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB schema
const userSchema = new mongoose.Schema({
  email: String,
  fname: String,
  lname: String,
  address: String,
  phone_alt: String,
  phone_sms: String,
  birthday: String,
  company: String,
});
const User = mongoose.model("User", userSchema);

// Mailchimp setup
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX, // e.g. "us3"
});
const listId = process.env.MAILCHIMP_AUDIENCE_ID;

// Cache SMS permission ID
let smsPermissionId = null;

// Load marketing permissions
async function loadPermissions() {
  try {
    const members = await mailchimp.lists.getListMembersInfo(listId, { count: 1 });
    if (!members.members.length) {
      console.warn(" No members in this audience yet, SMS permission ID not cached.");
      return;
    }

    const exampleMember = members.members[0];
    if (exampleMember.marketing_permissions) {
      const smsPerm = exampleMember.marketing_permissions.find((p) =>
        p.text.toLowerCase().includes("sms")
      );
      if (smsPerm) {
        smsPermissionId = smsPerm.marketing_permission_id;
        console.log(" Cached SMS Permission ID:", smsPermissionId);
      } else {
        console.warn(" No SMS permission found in member's marketing permissions.");
      }
    }
  } catch (err) {
    console.error(" Could not load permissions:", err.response?.data || err.message);
  }
}

// Serve form
app.get("/form", (req, res) => {
  res.sendFile(__dirname + "/customer.html"); // your HTML form
});

// Subscribe route
app.post("/subscribe", async (req, res) => {
  const { email, fname, lname, phone, birthday, company, smsPhone, consent } = req.body;

  if (!email) return res.status(400).send("Email is required");

  try {
    // Save in MongoDB
    const newUser = new User({
      email,
      fname,
      lname,
      phone_sms: phone,
      birthday,
      company,
    });
    await newUser.save();

    // Subscriber hash
    const subscriberHash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");

    // Build payload
    // const payload = {
    //   email_address: email,
    //   status_if_new: "subscribed",
    //   merge_fields: {
    //     FNAME: fname || "",
    //     LNAME: lname || "",
    //     PHONE: phone || "",
    //     BIRTHDAY: birthday || "",
    //     COMPANY: company || "",
    //     SMSPHONE: smsPhone || "",
    //   },
    // };

    // // Add SMS consent if provided
    // if (consent === "true" && smsPermissionId) {
    //   payload.marketing_permissions = [
    //     { marketing_permission_id: smsPermissionId, enabled: true },
    //   ];
    // }

    // Build payload
// const payload = {
//   email_address: email,
//   status_if_new: "subscribed",
//   merge_fields: {
//     FNAME: fname || "",
//     LNAME: lname || "",
//     PHONE: phone || "",
//     BIRTHDAY: birthday || "",
//     COMPANY: company || "",
//   },
//   // 👇 Add SMS at top-level
//   sms_phone_number: smsPhone || "",
//   sms_subscription_status: consent === "true" ? "subscribed" : "unsubscribed",
// };

// // Add SMS consent if provided
const payload = {
  email_address: email,
  status_if_new: "subscribed",
  merge_fields: {
    FNAME: fname || "",
    LNAME: lname || "",
    PHONE: phone || "",
    BIRTHDAY: birthday || "",
    COMPANY: company || ""
  },
  sms_phone_number: smsPhone || "",        // top-level field
  // do *not* include sms_subscription_status (not supported in some accounts via API)
  marketing_permissions: smsPermissionId && consent === "true"
  ? [
    { marketing_permission_id: smsPermissionId, enabled: true }
  ]
  : undefined
};
// if (consent === "true" && smsPermissionId) {
//   payload.marketing_permissions = [
//     { marketing_permission_id: smsPermissionId, enabled: true },
//   ];
// }


    console.log(" Final payload:", JSON.stringify(payload, null, 2));

    // Push to Mailchimp
    const response = await axios.put(
      `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`,
      payload,
      {
        headers: {
          Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(" Mailchimp response:", response.data);
    res.json({ success: true, data: response.data });
  } catch (err) {
    if (err.response) {
      console.error(" Mailchimp API error:", err.response.data);
      res.status(err.response.status).json(err.response.data);
    } else {
      console.error(" Unknown error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
});

// Connect DB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(5000, async () => {
      console.log(" Server running at http://localhost:5000");
      await loadPermissions(); // load SMS permission ID at startup
    });
  })
  .catch((err) => console.error(" MongoDB connection error:", err));
