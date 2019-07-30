'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let issueSchema = new Schema({
    issueId: {
        type: String,
        default: '',
        index: true,
        unique: true
    },

    title: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: 'inProgress'
    },
    reporter: {
        type: String,
        default: ''

    },
    reporterId: {
        type: String,
        default: ""
    },

    assignee: {
        type: String,
        default: ''
    },
    assigneeId: {
        type: String,
        default: ''
    },
    createdOn: {
        type: Date,
        default: ""
    },
    attachment: {
        type: String,
        default: ''
    },


})



mongoose.model('Issue', issueSchema); 