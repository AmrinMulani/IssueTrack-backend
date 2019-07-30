const express = require('express');
const router = express.Router();
const commentController = require("./../../app/controllers/commentController");
const appConfig = require("./../../config/appConfig")
const auth = require("../middlewares/auth");


module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/comment`;

    app.post(`${baseUrl}/addcomment`, auth.isAuthorize, commentController.createAComment);
    app.get(`${baseUrl}/getcomment/:issueId/:skip`, auth.isAuthorize, commentController.getCommentByIssueId);
    app.post(`${baseUrl}/addwatcher`, auth.isAuthorize, commentController.addWatcher);
    app.get(`${baseUrl}/getwatchlist/:issueId`, auth.isAuthorize, commentController.getWatchByIssueId);
    app.post(`${baseUrl}/addnotify`, auth.isAuthorize, commentController.addNotification);
    app.get(`${baseUrl}/getnotify/:userId`, auth.isAuthorize, commentController.getNotification);














}