'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let watcherSchema = new Schema({
    watcherId: {
        type: String,
    },

    issueId: {
        type: String,
        default: '',

    },
    watcherName: {
        type: String
    },

    createdOn: {
        type: Date,
        default: ""
    }


})


mongoose.model('Watcher', watcherSchema);