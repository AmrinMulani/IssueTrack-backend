const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require("fs");

/*var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
}) */


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('./uploads/')) {
            fs.mkdirSync('./uploads/');
        }
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {


        cb(null, Date.now().toISOString() + "_" + file.originalname);
    }
});


const fileFilter = (req, file, cb) => {

    checkFileType(file, cb);
};


// Check File Type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {

        cb('Error: Images Only!');
    }
}

const upload = multer({
    storage: storage,

});

module.exports = {
    upload: upload
}