const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib');
const tokenLib = require('../libs/tokenLib');
const fs = require("fs");

/* Models */
const UserModel = mongoose.model('User');
const AuthModel = mongoose.model('Auth');
const IssueModel = mongoose.model('Issue');

const path = require('path');

let assignee



let getIssuesByAssignee = (req, res) => {
  console.log(req.params.assignee)
  // function to validate params.
  let validateParams = () => {
    return new Promise((resolve, reject) => {
      if (check.isEmpty(req.params.assignee)) {
        logger.info('parameters missing', 'getIssuesByAssignee handler', 9)
        let apiResponse = response.generate(true, 'parameters missing.', 403, null)
        reject(apiResponse)
      } else {
        resolve()
      }
    })
  } // end of the validateParams function.


  // function to get chats.
  let findIssues = () => {
    return new Promise((resolve, reject) => {
      console.log('\n\n\n\n');

      console.log(req.body)
      const limit = req.body.length;
      const skip = req.body.start;

      let orderColumn = req.body.order[0].column;
      const dir = req.body.order[0].dir;

      //0 for title
      if (orderColumn === 0)
        orderColumn = 'title';
      //1 for status
      if (orderColumn === 1)
        orderColumn = 'status';

      //2 for reporter
      if (orderColumn === 2)
        orderColumn = 'reporter';


      //3 for createdOn
      if (orderColumn === 3)
        orderColumn = 'createdOn';


      const sort = {
        [orderColumn]: dir
      };

      // creating find query.
      let findQuery = {};
      console.log('\n\n\n' + req.params.assignee)
      if (!check.isEmpty(req.body.search.value)) {
        findQuery = {
          $and: [
            { 'assigneeId': req.params.assignee }
          ],

          $or: [
            { 'title': { '$regex': req.body.search.value, '$options': 'i' } },
            { 'reporter': { '$regex': req.body.search.value, '$options': 'i' } },
            { 'status': { '$regex': req.body.search.value, '$options': 'i' } }
          ]
        }
      } else {
        findQuery = { 'assigneeId': req.params.assignee };
      }
      IssueModel.count(findQuery, (err, count) => {
        IssueModel.find(findQuery)
          .select('-_id -__v')
          .sort(sort)
          .limit(limit)
          .skip(skip)
          .lean()
          .exec((err, result) => {
            if (err) {
              console.log(err)
              logger.error(err.message, 'Issue Controller: findIssues', 10)
              let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
              reject(apiResponse)
            } else {

              const objToSend = {
                draw: req.body.draw,
                recordsTotal: count,
                recordsFiltered: count,
                data: result
              };
              resolve(objToSend);
            }
          })
      });

    })
  } // end of the findChats function.

  // making promise call.
  validateParams()
    .then(findIssues)
    .then((result) => {
      let apiResponse = response.generate(false, 'All Issues Listed', 200, result)
      console.log(apiResponse);
      res.send(apiResponse)
    })
    .catch((error) => {
      res.send(error)
    })


}


let createAIssue = (req, res) => {

  let validatingInputs = () => {
    return new Promise((resolve, reject) => {
      if (check.isEmpty(req.file)) {
        let apiResponse = response.generate(true, "Please upload an attachment", 400, null);
        reject(apiResponse);
      }
      else if (req.body.title && req.body.description && req.body.reporter && req.body.assigneeId) {
        resolve(req);
      } else {
        let apiResponse = response.generate(true, "Body parameter are missing", 400, null);
        reject(apiResponse);
      }
    });
  }; // end of validateInputs

  let validateAssignee = () => {
    return new Promise((resolve, reject) => {
      let query = {
        userId: req.body.assigneeId,
      }
      UserModel.findOne(query).exec((err, assigneeDetails) => {
        if (err) {
          logger.error(err.message, "issueController => createIssue()", 5);
          let apiResponse = response.generate(true, "Failed to create issue", 500, null);
          reject(apiResponse);

        }
        // user is not present in the DB 
        else if (check.isEmpty(assigneeDetails)) {
          let apiResponse = response.generate(true, "No such assignee found -> Tell the assignee to register first", 404, null);
          reject(apiResponse);

        }
        // user is present already in the DB
        else {
          assignee = assigneeDetails.fullName
          resolve(req);
        }

      });
    });

  };


  let createIssue = () => {
    return new Promise((resolve, reject) => {

      let newIssue = new IssueModel({
        issueId: shortid.generate(),
        title: req.body.title.toUpperCase(),
        description: req.body.description,
        reporter: req.body.reporter.toUpperCase(),
        reporterId: req.body.reporterId,
        assignee: assignee.toUpperCase(),
        assigneeId: req.body.assigneeId,
        attachment: req.file.filename,
        //status: req.body.status.toLowerCase(),
        createdOn: time.now()
      });

      newIssue.save((err, newIssueDetails) => {
        if (err) {
          logger.error(err.message, "issueController => createIssue()", 5);
          let apiResponse = response.generate(true, "Failed to create new issue", 500, null);
          reject(apiResponse);
        }
        else {
          let newIssueObj = newIssueDetails.toObject();
          resolve(newIssueObj);
        }
      });


    });
  }; // end of createUser

  validatingInputs(req, res)
    .then(validateAssignee)
    .then(createIssue)
    .then((newIssueDetails) => {
      delete newIssueDetails._id;
      delete newIssueDetails.__v;


      let apiResponse = response.generate(false, "New issue added successfully", 200, newIssueDetails);
      res.send(apiResponse);
    }).catch((err) => {
      if (!check.isEmpty(req.file)) {
        const dirName = path.join(__dirname, '../../uploads')
        const filePath = `${dirName}/${req.file.filename}`;
        fs.unlinkSync(filePath);
      }
      console.log(err);
      res.send(err);
    });

}



// edit issue
let editIssue = (req, res) => {


  const options = {
    description: req.body.description,
    status: req.body.status,
    assignee: req.body.assigneeName,
    assigneeId: req.body.assigneeId
  }
  IssueModel.findOneAndUpdate({ 'issueId': req.params.issueId }, { "$set": options })
    .select('-_id -__v')
    .exec((err, result) => {
      if (err) {
        logger.error(err.message, 'Issue Controller->editIssue', 10)
        let apiResponse = response.generate(true, 'Error occured', 500, null);
        res.send(apiResponse);
      }
      else if (check.isEmpty(result)) {
        logger.info('No Issue found!', 'Issue Controller->editIssue');
        let apiResponse = response.generate(true, 'No Issue found!', 400, null);
        res.send(apiResponse);
      }
      else {
        logger.info('Issue edited successfully', 'Issue Controller->editIssue', 5);
        let apiResponse = response.generate(false, 'Issue edited successfully', 200, result);
        res.send(apiResponse);
      }
    })
}

let getAllIssue = (req, res) => {


  // function to get chats.
  let findIssues = () => {
    return new Promise((resolve, reject) => {
      console.log('\n\n\n\n');

      console.log(req.body)


      const limit = req.body.length;
      const skip = req.body.start;


      let orderColumn = req.body.order[0].column;
      const dir = req.body.order[0].dir;

      /*
   
      0 title
         1.reporter
         2.Status  
         3.Assignee
         4.createom
      */

      //0 for title
      if (orderColumn === 0)
        orderColumn = 'title';
      //1 for status
      if (orderColumn === 1)
        orderColumn = 'reporter';

      //2 for reporter
      if (orderColumn === 2)
        orderColumn = 'status';

      if (orderColumn === 3)
        orderColumn = 'assignee';


      //3 for createdOn
      if (orderColumn === 4)
        orderColumn = 'createdOn';


      const sort = {
        [orderColumn]: dir
      };

      // creating find query.
      let findQuery = {};
      if (!check.isEmpty(req.body.search.value)) {
        findQuery = {
          $or: [
            { 'title': { '$regex': req.body.search.value, '$options': 'i' } },
            { 'reporter': { '$regex': req.body.search.value, '$options': 'i' } },
            { 'assignee': { '$regex': req.body.search.value, '$options': 'i' } },
            { 'status': { '$regex': req.body.search.value, '$options': 'i' } }
          ]
        }
      }
      IssueModel.count(findQuery, (err, count) => {
        IssueModel.find(findQuery)
          .select('-_id -__v')
          .sort(sort)
          .limit(limit)
          .skip(skip)
          .lean()
          .exec((err, result) => {
            if (err) {
              console.log(err)
              logger.error(err.message, 'Issue Controller: findIssues', 10)
              let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
              reject(apiResponse)
            } else {

              const objToSend = {
                draw: req.body.draw,
                recordsTotal: count,
                recordsFiltered: count,
                data: result
              };
              resolve(objToSend);
            }
          })
      });

    })
  } // end of the findChats function.

  // making promise call.
  findIssues()
    .then((result) => {
      let apiResponse = response.generate(false, 'Issue Found And Listed', 200, result)
      res.send(apiResponse)
    })
    .catch((error) => {
      res.send(error)
    })


}

let getIssueById = (req, res) => {
  // function to validate params.
  let validateParams = () => {
    return new Promise((resolve, reject) => {
      if (check.isEmpty(req.params.issueId)) {
        logger.info('parameters missing', 'getIssueById handler', 9)
        let apiResponse = response.generate(true, 'parameters missing.', 403, null)
        reject(apiResponse)
      } else {
        resolve()
      }
    })
  } // end of the validateParams function.

  // function to get chats.
  let findIssues = () => {
    return new Promise((resolve, reject) => {
      // creating find query.
      let findQuery = {
        issueId: req.params.issueId
      }

      IssueModel.findOne(findQuery)
        .select('-_id -__v')
        .lean()
        .exec((err, result) => {
          if (err) {
            console.log(err)
            logger.error(err.message, 'Issue Controller: findIssues', 10)
            let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
            reject(apiResponse)
          } else if (check.isEmpty(result)) {
            logger.info('No Issues Found', 'Issue Controller: findIssues')
            let apiResponse = response.generate(true, 'No Issue Found', 404, null)
            reject(apiResponse)
          } else {
            console.log('Issue found and listed.')
            resolve(result)
          }
        })
    })
  } // end of the findChats function.

  // making promise call.
  validateParams()
    .then(findIssues)
    .then((result) => {
      let apiResponse = response.generate(false, 'Issue Found And Listed', 200, result)
      res.send(apiResponse)
    })
    .catch((error) => {
      res.send(error)
    })

}


let getIssuesByReporter = (req, res) => {
  console.log(req.params.reporter)
  // function to validate params.
  let validateParams = () => {
    return new Promise((resolve, reject) => {
      if (check.isEmpty(req.params.reporterId)) {
        logger.info('parameters missing', 'getIssuesByReporter handler', 9)
        let apiResponse = response.generate(true, 'parameters missing.', 403, null)
        reject(apiResponse)
      } else {
        resolve()
      }
    })
  } // end of the validateParams function.


  // function to get chats.
  let findIssues = () => {
    return new Promise((resolve, reject) => {
      console.log('\n\n\n\n');

      console.log(req.body)


      const limit = req.body.length;
      const skip = req.body.start;


      let orderColumn = req.body.order[0].column;
      const dir = req.body.order[0].dir;

      //0 for title
      if (orderColumn === 0)
        orderColumn = 'title';
      //1 for status
      if (orderColumn === 1)
        orderColumn = 'status';

      //2 for reporter
      if (orderColumn === 2)
        orderColumn = 'assignee';


      //3 for createdOn
      if (orderColumn === 3)
        orderColumn = 'createdOn';


      const sort = {
        [orderColumn]: dir
      };

      // creating find query.
      let findQuery = {};
      console.log('\n\n\n' + req.params.reporterId)
      if (!check.isEmpty(req.body.search.value)) {
        findQuery = {
          $and: [
            { 'reporterId': req.params.reporterId }
          ],

          $or: [
            { 'title': { '$regex': req.body.search.value, '$options': 'i' } },
            { 'assignee': { '$regex': req.body.search.value, '$options': 'i' } },
            { 'status': { '$regex': req.body.search.value, '$options': 'i' } }
          ]
        }
      } else {
        findQuery = { 'reporterId': req.params.reporterId };
      }
      IssueModel.count(findQuery, (err, count) => {
        IssueModel.find(findQuery)
          .select('-_id -__v')
          .sort(sort)
          .limit(limit)
          .skip(skip)
          .lean()
          .exec((err, result) => {
            if (err) {
              console.log(err)
              logger.error(err.message, 'Issue Controller: findIssues', 10)
              let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
              reject(apiResponse)
            } else {

              const objToSend = {
                draw: req.body.draw,
                recordsTotal: count,
                recordsFiltered: count,
                data: result
              };
              resolve(objToSend);
            }
          })
      });

    })
  } // end of the findChats function.

  // making promise call.
  validateParams()
    .then(findIssues)
    .then((result) => {
      let apiResponse = response.generate(false, 'All Issues Listed', 200, result)
      console.log(apiResponse);
      res.send(apiResponse)
    })
    .catch((error) => {
      res.send(error)
    })
}


module.exports = {

  getIssuesByAssignee: getIssuesByAssignee,
  createAIssue: createAIssue,
  editIssue: editIssue,
  getAllIssue: getAllIssue,
  getIssueById: getIssueById,
  getIssuesByReporter: getIssuesByReporter


}// end exports