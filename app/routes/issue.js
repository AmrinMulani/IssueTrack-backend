const express = require('express');
const router = express.Router();
const issueController = require("./../../app/controllers/issueController");
const auth = require("../middlewares/auth");



const appConfig = require("./../../config/appConfig")
const multer = require('multer');
const fs = require('fs');
/* destination: (req, file, cb) => {
        if (!fs.existsSync('./uploads/')) {
            fs.mkdirSync('./uploads/');
        }
        cb(null, './uploads/'); */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync('./uploads/')) {
            fs.mkdirSync('./uploads/');
        }
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/issue`;

    app.post(`${baseUrl}/createissue`, upload.single('file'), issueController.createAIssue);
    app.post(`${baseUrl}/getissuebyassignee/:assignee`, auth.isAuthorize, issueController.getIssuesByAssignee);
    app.post(`${baseUrl}/getissuebyreporter/:reporterId`, auth.isAuthorize, issueController.getIssuesByReporter);

    app.post(`${baseUrl}/getallissue`, auth.isAuthorize, issueController.getAllIssue);
    app.get(`${baseUrl}/getissuebyid/:issueId`, auth.isAuthorize, issueController.getIssueById);
    app.put(`${baseUrl}/updateissuebyid/:issueId`, auth.isAuthorize, issueController.editIssue);









}
