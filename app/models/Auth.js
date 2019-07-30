// when user logins we are going to store these details in Auth
// one more layer of security

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const time = require("../libs/timeLib");

const authSchema = new Schema({
    userId: {
        type: String
    },
    authToken: {
        type: String
    },

    tokenSecret: {
        type: String
    },
    tokenGenerationTime: {
        type: Date,
        default: time.now()
    }
});


module.exports = mongoose.model("Auth", authSchema);