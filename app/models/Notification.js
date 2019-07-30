'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let notificationSchema = new Schema({
    notificationId: {
        type: String,
        default: '',
        index: true,
        unique: true
    },

    issueId: {
        type: String,
        default: '',

    },
    notifyDescription: {
        type: String,
        default: ''
    },
    assigneeId: {
        type: String,
        default: ''
    },
    reporterId: {
        type: String,
        default: ''
    },
    watchersId: [
        {
            type: String

        }
    ],


    createdOn: {
        type: Date,
        default: ""
    }


})


mongoose.model('Notification', notificationSchema);