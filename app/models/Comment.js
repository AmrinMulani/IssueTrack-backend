'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let commentSchema = new Schema({
    commentId: {
        type: String,
        default: '',
        index: true,
        unique: true
    },

    issueId: {
        type: String,
        default: '',

    },
    comment: {
        type: String,
        default: ''
    },

    commenterName: {
        type: String,
        default: '',

    },

    createdOn: {
        type: Date,
        default: ""
    }


})


mongoose.model('Comment', commentSchema);