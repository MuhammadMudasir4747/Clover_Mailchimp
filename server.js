



// require("dotenv").config();
// const express = require("express");
// const bodyParser = require("body-parser");
// const mongoose = require("mongoose");
// const crypto = require("crypto");
// const axios = require("axios");
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

// // Load marketing permissions
// async function loadPermissions() {
//   try {
//     const members = await mailchimp.lists.getListMembersInfo(listId, { count: 1 });
//     if (!members.members.length) {
//       console.warn(" No members in this audience yet, SMS permission ID not cached.");
//       return;
//     }

//     const exampleMember = members.members[0];
//     if (exampleMember.marketing_permissions) {
//       const smsPerm = exampleMember.marketing_permissions.find((p) =>
//         p.text.toLowerCase().includes("sms")
//       );
//       if (smsPerm) {
//         smsPermissionId = smsPerm.marketing_permission_id;
//         console.log(" Cached SMS Permission ID:", smsPermissionId);
//       } else {
//         console.warn(" No SMS permission found in member's marketing permissions.");
//       }
//     }
//   } catch (err) {
//     console.error(" Could not load permissions:", err.response?.data || err.message);
//   }
// }

// // Serve form
// app.get("/form", (req, res) => {
//   res.sendFile(__dirname + "/customer.html"); // your HTML form
// });

// // Subscribe route
// app.post("/subscribe", async (req, res) => {
//   const { email, fname, lname, phone, birthday, company, smsPhone, consent } = req.body;

//   if (!email) return res.status(400).send("Email is required");

//   try {
//     // Save in MongoDB
//     const newUser = new User({
//       email,
//       fname,
//       lname,
//       phone_sms: phone,
//       birthday,
//       company,
//     });
//     await newUser.save();

//     // Subscriber hash
//     const subscriberHash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");

//     // Build payload
//     // const payload = {
//     //   email_address: email,
//     //   status_if_new: "subscribed",
//     //   merge_fields: {
//     //     FNAME: fname || "",
//     //     LNAME: lname || "",
//     //     PHONE: phone || "",
//     //     BIRTHDAY: birthday || "",
//     //     COMPANY: company || "",
//     //     SMSPHONE: smsPhone || "",
//     //   },
//     // };

//     // // Add SMS consent if provided
//     // if (consent === "true" && smsPermissionId) {
//     //   payload.marketing_permissions = [
//     //     { marketing_permission_id: smsPermissionId, enabled: true },
//     //   ];
//     // }

//     // Build payload
// // const payload = {
// //   email_address: email,
// //   status_if_new: "subscribed",
// //   merge_fields: {
// //     FNAME: fname || "",
// //     LNAME: lname || "",
// //     PHONE: phone || "",
// //     BIRTHDAY: birthday || "",
// //     COMPANY: company || "",
// //   },
// //   // 👇 Add SMS at top-level
// //   sms_phone_number: smsPhone || "",
// //   sms_subscription_status: consent === "true" ? "subscribed" : "unsubscribed",
// // };

// // // Add SMS consent if provided
// const payload = {
//   email_address: email,
//   status_if_new: "subscribed",
//   merge_fields: {
//     FNAME: fname || "",
//     LNAME: lname || "",
//     PHONE: phone || "",
//     BIRTHDAY: birthday || "",
//     COMPANY: company || ""
//   },
//   sms_phone_number: smsPhone || "",        // top-level field
//   // do *not* include sms_subscription_status (not supported in some accounts via API)
//   marketing_permissions: smsPermissionId && consent === "true"
//   ? [
//     { marketing_permission_id: smsPermissionId, enabled: true }
//   ]
//   : undefined
// };
// // if (consent === "true" && smsPermissionId) {
// //   payload.marketing_permissions = [
// //     { marketing_permission_id: smsPermissionId, enabled: true },
// //   ];
// // }


//     console.log(" Final payload:", JSON.stringify(payload, null, 2));

//     // Push to Mailchimp
//     const response = await axios.put(
//       `https://${process.env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`,
//       payload,
//       {
//         headers: {
//           Authorization: `apikey ${process.env.MAILCHIMP_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log(" Mailchimp response:", response.data);
//     res.json({ success: true, data: response.data });
//   } catch (err) {
//     if (err.response) {
//       console.error(" Mailchimp API error:", err.response.data);
//       res.status(err.response.status).json(err.response.data);
//     } else {
//       console.error(" Unknown error:", err.message);
//       res.status(500).json({ error: err.message });
//     }
//   }
// });

// // Connect DB and start server
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("✅ Connected to MongoDB");
//     app.listen(5000, async () => {
//       console.log(" Server running at http://localhost:5000");
//       await loadPermissions(); // load SMS permission ID at startup
//     });
//   })
//   .catch((err) => console.error(" MongoDB connection error:", err));






// require("dotenv").config();
// const express = require("express");
// const bodyParser = require("body-parser");
// const mongoose = require("mongoose");

// const app = express();
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Mongo schema
// const mongooseSchema = new mongoose.Schema({
//   email: String,
//   fname: String,
//   lname: String,
//   address: String,
//   phone_alt: String,
//   phone_sms: String,
//   birthday: String,
//   company: String,
//   consentSms: Boolean,
//   createdAt: { type: Date, default: Date.now },
// });
// const User = mongoose.model("User", mongooseSchema);

// // Serve the HTML form
// app.get("/form", (req, res) => {
//   res.sendFile(__dirname + "/customer.html");
// });

// // Save-only endpoint
// app.post("/save", async (req, res) => {
//   try {
//     console.log("📥 Incoming form submission:", req.body); // <-- log request

//     const payload = {
//       email: req.body.email,
//       fname: req.body.fname,
//       lname: req.body.lname,
//       address: req.body.address,
//       phone_alt: req.body.phone_alt,
//       phone_sms: req.body.smsPhone || req.body.phone || "",
//       birthday: req.body.birthday,
//       company: req.body.company,
//       consentSms: req.body.consent === "true" || req.body.consent === true,
//     };

//     console.log("📝 Final payload to save:", payload); // <-- log payload

//     const savedUser = await User.create(payload);
//     console.log("✅ Saved to MongoDB:", savedUser);

//     return res.json({ success: true, user: savedUser });
//   } catch (err) {
//     console.error("❌ Mongo save error:", err);
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// const PORT = process.env.PORT || 5000;
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log("✅ Connected to MongoDB");
//       console.log(`🚀 Server running at http://localhost:${PORT}`);
//     });
//   })
//   .catch(err => {
//     console.error("❌ MongoDB connection error:", err);
//     process.exit(1);
//   });



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
