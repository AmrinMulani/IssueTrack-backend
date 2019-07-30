'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

let userSchema = new Schema({
  userId: {
    type: String,
    default: '',
    index: true,
    unique: true
  },

  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  fullName: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: 'passskdajakdjkadsj'
  },
  email: {
    type: String,
    default: '',
    unique: true
  },
  mobileNumber: {
    type: Number,
    default: 0,
    unique: true
  },
  createdOn: {
    type: Date,
    default: Date.now()
  }


})


mongoose.model('User', userSchema);