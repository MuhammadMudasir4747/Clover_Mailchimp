const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    
    cloverId : {type: String, unique: true, required: true},
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    smsOptIn:{type: Boolean, default: false},
    lastSyncedToMailChimp: Date,
    raw: Object //in raw will be storring orgnl webhook json
},
{   timestamps: true }
)

module.exports = mongoose.model('Customer', customerSchema);