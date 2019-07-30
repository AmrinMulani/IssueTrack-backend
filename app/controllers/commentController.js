const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib');


/* Models */

const CommentModel = mongoose.model('Comment');
const WatcherModel = mongoose.model('Watcher')
const NotificationModel = mongoose.model('Notification')
const UserModel = mongoose.model('User');



let createAComment = (req, res) => {

    let validatingInputs = () => {
        return new Promise((resolve, reject) => {
            if (req.body.issueId && req.body.commenterName && req.body.comment) {
                resolve(req);
            }
            else {
                let apiResponse = response.generate(true, "Body parameter are missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validateInputs

    let createComment = () => {
        return new Promise((resolve, reject) => {

            let newComment = new CommentModel({
                commentId: shortid.generate(),
                issueId: req.body.issueId,
                commenterName: req.body.commenterName,
                comment: req.body.comment,
                createdOn: Date.now()
            });

            newComment.save((err, newCommentDetails) => {
                if (err) {
                    logger.error(err.message, "commentController => createComment()", 5);
                    let apiResponse = response.generate(true, "Failed to create new comment", 500, null);
                    reject(apiResponse);
                }
                else {
                    let newCommentObj = newCommentDetails.toObject();
                    resolve(newCommentObj);
                }
            });




        });
    }; // end of createUser

    validatingInputs(req, res).then(createComment).then((newCommentDetails) => {
        delete newCommentDetails._id;
        delete newCommentDetails.__v;

        let apiResponse = response.generate(false, "New comment added successfully", 200, newCommentDetails);
        res.send(apiResponse);
    }).catch((err) => {
        console.log(err);
        res.send(err);
    });

}


let getCommentByIssueId = (req, res) => {

    console.log("/n/n/n/n/n/")
    console.log("getcomment")
    // function to validate params.
    let validateParams = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.params.issueId)) {
                logger.info('parameters missing', 'issueId handler', 9)
                let apiResponse = response.generate(true, 'parameters missing.', 403, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    } // end of the validateParams function.

    // function to get comments.
    let findComments = () => {

        return new Promise((resolve, reject) => {
            // creating find query.
            let findQuery = {
                issueId: req.params.issueId
            }

            CommentModel.find(findQuery)
                .select('-_id -__v')
                .sort('-createdOn')
                .skip(parseInt(req.params.skip) || 0)
                .limit(5)
                .lean()
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'Controller: findIssues', 10)
                        let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        logger.info('No Comments Found', 'CommentController: findComment')
                        let apiResponse = response.generate(true, 'No Comments Found', 404, null)
                        reject(apiResponse)
                    } else {
                        console.log('Comments found and listed.')
                        const data = result.reverse();
                        resolve(data)

                    }
                })
        })
    } // end of the findChats function.

    // making promise call.
    validateParams()
        .then(findComments)
        .then((result) => {
            let apiResponse = response.generate(false, 'Comments Found And Listed', 200, result)
            res.send(apiResponse)
        })
        .catch((error) => {
            res.send(error)
        })


}

let addWatcher = (req, res) => {

    let validatingInputs = () => {
        return new Promise((resolve, reject) => {
            if (req.body.issueId && req.body.watcherName && req.body.watcherId) {
                resolve(req);
            }
            else {
                let apiResponse = response.generate(true, "Body parameter are missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validateInputs

    let addWatch = () => {
        return new Promise((resolve, reject) => {

            let newWatcher = new WatcherModel({

                issueId: req.body.issueId,
                watcherName: req.body.watcherName,
                watcherId: req.body.watcherId,
                createdOn: Date.now()
            });

            newWatcher.save((err, addDetails) => {
                if (err) {
                    logger.error(err.message, "commentController => Add Comment", 5);
                    let apiResponse = response.generate(true, "Failed to Add Watcher", 500, null);
                    reject(apiResponse);
                }
                else {
                    let newWatchObj = addDetails.toObject();
                    resolve(newWatchObj);
                }
            });
        });
    }; // end of atcher

    validatingInputs(req, res).then(addWatch).then((addDetails) => {
        delete addDetails._id;
        delete addDetails.__v;

        let apiResponse = response.generate(false, "Watcher added successfully", 200, addDetails);
        res.send(apiResponse);
    }).catch((err) => {
        console.log(err);
        res.send(err);
    });

}
let getWatchByIssueId = (req, res) => {
    // function to validate params.
    let validateParams = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.params.issueId)) {
                logger.info('parameters missing', ' getWatchByIssueId handler', 9)
                let apiResponse = response.generate(true, 'parameters missing.', 403, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    } // end of the validateParams function.

    // function to get comments.
    let findWatcher = () => {
        return new Promise((resolve, reject) => {
            // creating find query.
            let findQuery = {
                issueId: req.params.issueId
            }

            WatcherModel.find(findQuery)
                .select('-_id -__v')
                .sort('-createdOn')
                .lean()
                .exec((err, result) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'comment Controller: findWatcher', 10)
                        let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        logger.info('No watcher Found', 'comment Controller: findwatcher')
                        let apiResponse = response.generate(true, 'No watcher Found', 404, null)
                        reject(apiResponse)
                    } else {
                        console.log('Watcher found and listed.')
                        resolve(result)
                    }
                })
        })
    } // end of the findChats function.

    // making promise call.
    validateParams()
        .then(findWatcher)
        .then((result) => {
            let apiResponse = response.generate(false, 'Watcher Listed', 200, result)
            res.send(apiResponse)
        })
        .catch((error) => {
            res.send(error)
        })
}

let addNotification = (req, res) => {
    console.log("Notification")
    let validatingInputs = () => {
        return new Promise((resolve, reject) => {
            if (req.body.issueId && req.body.notifyDescription) {
                resolve(req);
            }
            else {
                let apiResponse = response.generate(true, "Body parameter are missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validateInputs

    let addnotify = () => {
        // //   req.body.watchersId = JSON.parse(req.body.watchersId)
        // let watcherArr = []
        // watcherArr = req.body.watchersId.split(",")
        // console.log("Array")
        // console.log(watcherArr)
        // for (let i = 0; i < watcherArr.length; i++) {
        //     console.log(watcherArr[i])
        // }
        return new Promise((resolve, reject) => {


            const ssssss = JSON.parse(req.body.watchersId)
            console.log(ssssss)
            let newNotify = new NotificationModel({
                notificationId: shortid.generate(),
                issueId: req.body.issueId,
                notifyDescription: req.body.notifyDescription,
                reporterId: req.body.reporterId,
                assigneeId: req.body.assigneeId,
                watchersId: ssssss,
                createdOn: Date.now()
            });

            newNotify.save((err, addDetails) => {
                console.log("\n\n\n\n")
                console.log("ADD")

                console.log(addDetails)


                if (err) {
                    logger.error(err.message, "issueController => createComment()", 5);
                    let apiResponse = response.generate(true, "Failed to Add Notification", 500, null);
                    reject(apiResponse);
                }
                else {
                    let newWatchObj = addDetails.toObject();
                    resolve(newWatchObj);
                }
            });
        });

    }; // end of atcher

    validatingInputs(req, res).then(addnotify).then((addDetails) => {
        delete addDetails._id;
        delete addDetails.__v;

        let apiResponse = response.generate(false, "Notification is  added successfully", 200, addDetails);
        res.send(apiResponse);
    }).catch((err) => {
        console.log(err);
        res.send(err);
    });
}

//
let getNotification = (req, res) => {
    // function to validate params.

    console.log("get Notification")

    let validateParams = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.params.userId)) {
                logger.info('parameters missing', 'getNotification handler', 9)
                let apiResponse = response.generate(true, 'parameters missing.', 403, null)
                reject(apiResponse)
            } else {
                resolve()
            }
        })
    } // end of the validateParams function.

    // function to get comments.
    let findNotify = () => {
        return new Promise((resolve, reject) => {
            // creating find query.
            let findQuery = {
                $or: [
                    { 'assigneeId': req.params.userId },
                    { 'reporterId': req.params.userId },
                    { 'watchersId': req.params.userId }
                ]
            }

            NotificationModel.find(findQuery)
                .select('-_id -__v')
                .sort('-createdOn')
                .limit(10)
                .lean()
                .exec((err, result) => {

                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'comment Controller: findIssues', 10)
                        let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(result)) {
                        logger.info('No Notification Found', 'comment Controller: findNotification')
                        let apiResponse = response.generate(true, 'No Comments Found', 404, null)
                        reject(apiResponse)
                    } else {
                        console.log('Notification found and listed.')
                        resolve(result)
                    }
                })
        })
    } // end of the findChats function.

    // making promise call.
    validateParams()
        .then(findNotify)
        .then((result) => {
            let apiResponse = response.generate(false, 'Notification Listed', 200, result)
            res.send(apiResponse)
        })
        .catch((error) => {
            res.send(error)
        })
}


module.exports = {
    createAComment: createAComment,
    getCommentByIssueId: getCommentByIssueId,
    addWatcher: addWatcher,
    getWatchByIssueId: getWatchByIssueId,
    addNotification: addNotification,
    getNotification: getNotification
};