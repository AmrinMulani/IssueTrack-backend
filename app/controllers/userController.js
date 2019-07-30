const mongoose = require("mongoose");
const shortid = require("shortid");
const time = require("../libs/timeLib");
const response = require("../libs/responseLib");
const logger = require("../libs/loggerLib");
const validateInput = require("../libs/paramsValidationLib");
const check = require("../libs/checkLib");
const passwordLib = require("../libs/passwordLib");
const tokenLib = require("../libs/tokenLib");



/* Models */
const UserModel = mongoose.model("User");
const AuthModel = mongoose.model("Auth");

// start user signup function

let signUpFunction = (req, res) => {
    let validatingInputs = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email && req.body.password && req.body.firstName && req.body.lastName && req.body.mobileNumber) {
                if (!validateInput.Email(req.body.email)) {
                    let apiResponse = response.generate(true, "InValid Email", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(req);
                }
            } else {
                let apiResponse = response.generate(true, "Body parameter are missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validateInputs

    let createUser = () => {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ email: req.body.email.toLowerCase() }).exec(
                (err, userDetails) => {
                    if (err) {
                        logger.error(err.message, "userController => createUser()", 5);
                        let apiResponse = response.generate(true, "Failed to create user", 500, null);
                        reject(apiResponse);
                    }
                    // user is not present in the DB
                    else if (check.isEmpty(userDetails)) {

                        let newUser = new UserModel({
                            userId: shortid.generate(),
                            firstName: req.body.firstName.toUpperCase(),
                            lastName: req.body.lastName.toUpperCase(),
                            fullName: req.body.firstName.toUpperCase() + " " + req.body.lastName.toUpperCase(),
                            password: passwordLib.hashpassword(req.body.password),
                            email: req.body.email.toLowerCase(),
                            mobileNumber: req.body.mobileNumber,

                        });

                        newUser.save((err, newUserDetails) => {
                            if (err) {
                                logger.error(err.message, "userController => createUser()", 5);
                                let apiResponse = response.generate(true, "User email or mobile number already exist", 500, null);
                                reject(apiResponse);
                            } else {
                                let newUserObj = newUserDetails.toObject();
                                resolve(newUserObj);
                            }
                        });
                    }
                    // user is present already in the DB
                    else {
                        let apiResponse = response.generate(true, "User email already exist", 403, null);
                        reject(apiResponse);
                    }
                }
            );
        });
    }; // end of createUser

    validatingInputs(req, res)
        .then(createUser)
        .then(newUserDetails => {
            delete newUserDetails.password;
            delete newUserDetails._id;
            delete newUserDetails.__v;
            let apiResponse = response.generate(false, "Signed up successfully", 200, newUserDetails);
            res.send(apiResponse);
        })
        .catch(err => {
            console.log(err);
            res.send(err);
        });
}; // end user signup function

// start of login function
let loginFunction = (req, res) => {
    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.email && req.body.password) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "Email address or Password missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let findUser = () => {
        console.log("findUser");
        return new Promise((resolve, reject) => {
            UserModel.findOne({ email: req.body.email.toLowerCase() }).exec((err, userDetails) => {
                if (err) {
                    logger.error("Failed to retrieve user data", "userController => findUser()", 5);
                    let apiResponse = response.generate(true, "Failed to retrieve user data", 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(userDetails)) {
                    logger.error("User not registered", "userController => findUser()", 5);
                    let apiResponse = response.generate(true, "User not registered", 500, null);
                    reject(apiResponse);
                } else {
                    logger.info("User found", "userController => findUser()", 10);
                    resolve(userDetails);
                }
            });
        });
    }; // end of findUser

    let validatingPassword = retrieveUserDetails => {
        console.log("validatingPassword");
        return new Promise((resolve, reject) => {
            passwordLib.comparePassword(req.body.password, retrieveUserDetails.password, (err, isMatch) => {
                if (err) {
                    logger.error("Login failed", "userController => validatingPassword()", 5);
                    let apiResponse = response.generate(true, "Login failed", 500, null);
                    reject(apiResponse);
                } else if (isMatch) {
                    let retrieveUserDetailsObj = retrieveUserDetails.toObject();
                    delete retrieveUserDetailsObj.password;
                    delete retrieveUserDetailsObj._id;
                    delete retrieveUserDetailsObj.__v;
                    delete retrieveUserDetailsObj.createdOn;
                    delete retrieveUserDetailsObj.modifiedOn;
                    resolve(retrieveUserDetailsObj);
                } else {
                    logger.error("Invalid password", "userController => validatingPassword()", 10);
                    let apiResponse = response.generate(true, "Invalid password", 400, null);
                    reject(apiResponse);
                }
            }
            );
        });
    }; // end of validatingPassword

    let generateToken = userDetails => {
        console.log("generateToken");
        return new Promise((resolve, reject) => {
            tokenLib.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    logger.error("Failed to generate token", "userController => generateToken()", 10);
                    let apiResponse = response.generate(true, "Failed to generate token", 500, null);
                    reject(apiResponse);
                } else {
                    tokenDetails.userId = userDetails.userId;
                    tokenDetails.userDetails = userDetails;
                    resolve(tokenDetails);
                }
            });
        });
    }; // end of generateToken

    let saveToken = tokenDetails => {
        console.log("saveToken");
        return new Promise((resolve, reject) => {
            AuthModel.findOne({ userId: tokenDetails.userId }).exec(
                (err, retrieveTokenDetails) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Failed to save token", 500, null);
                        reject(apiResponse);
                    }
                    // user is logging for the first time
                    else if (check.isEmpty(retrieveTokenDetails)) {
                        let newAuthToken = new AuthModel({
                            userId: tokenDetails.userId,
                            authToken: tokenDetails.token,
                            // we are storing this is due to we might change this from 15 days
                            tokenSecret: tokenDetails.tokenSecret,
                            tokenGenerationTime: time.now()
                        });

                        newAuthToken.save((err, newTokenDetails) => {
                            if (err) {
                                let apiResponse = response.generate(true, "Failed to save token", 500, null);
                                reject(apiResponse);
                            } else {
                                let responseBody = {
                                    authToken: newTokenDetails.authToken,
                                    userDetails: tokenDetails.userDetails
                                };
                                resolve(responseBody);
                            }
                        });
                    }
                    // user has already logged in need to update the token
                    else {
                        retrieveTokenDetails.authToken = tokenDetails.token;
                        retrieveTokenDetails.tokenSecret = tokenDetails.tokenSecret;
                        retrieveTokenDetails.tokenGenerationTime = time.now();
                        retrieveTokenDetails.save((err, newTokenDetails) => {
                            if (err) {
                                let apiResponse = response.generate(true, "Failed to save token", 500, null);
                                reject(apiResponse);
                            } else {
                                let responseBody = {
                                    authToken: newTokenDetails.authToken,
                                    userDetails: tokenDetails.userDetails
                                };
                                resolve(responseBody);
                            }
                        });
                    }
                }
            );
        });
    }; // end of saveToken

    validatingInputs(req, res)
        .then(findUser)
        .then(validatingPassword)
        .then(generateToken)
        .then(saveToken)
        .then(resolve => {
            let apiResponse = response.generate(false, "Login successful!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch(err => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
}; // end of the login function
let logoutFunction = (req, res) => {

    AuthModel.remove({ userId: req.params.userId }, (err, result) => {
        if (err) {
            logger.error(err.message, "userController=>logout", 10);
            let apiResponse = response.generate(true, `Error occured: ${err.message}`, 500, null);
            res.send(apiResponse);
        } else if (check.isEmpty(result)) {
            logger.error("User already logged out or Invalid userId", "userController=>logout", 5);
            let apiResponse = response.generate(true, "User already logged out or Invalid userId", 404, null);
            res.send(apiResponse);
        } else {
            logger.info("Logged out successfully", "userController=>logout", 5);
            let apiResponse = response.generate(false, "Logged out successfully", 200, null);
            res.send(apiResponse);
        }
    });
}; // end of the logout function.

let resetPasswordFunction = (req, res) => {
    let options = {
        email: req.body.email,
        password: passwordLib.hashpassword(req.body.password)
    }
    UserModel.updateOne({ email: req.body.email }, options)
        .exec((err, result) => {
            if (err) {
                logger.error(err.message, "controller:updatePassword", 10)
                let apiResponse = response.generate(true, "Error reseting password", 400, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                let apiResponse = response.generate(true, "Email id not valid", 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, "User Password Changed Success", 200, result)
                res.send(apiResponse)
            }
        })
} //end updatepassword
let getAllUser = (req, res) => {
    UserModel.find()
        .select()
        .lean()
        .exec((err, result) => {
            if (err) {
                logger.error(err.message, 'userController: getAllRequestSent', 10)
                let apiResponse = response.generate(true, 'Failed To User ', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No Sent Request Found', 'Friend Controller=> getAllRequestSent')
                let apiResponse = response.generate(true, 'No user Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'All list  Found', 200, result)
                res.send(apiResponse)
                console.log("list of user")
                console.log(apiResponse)
            }
        })


}

//social login
let socialSignIn = (req, res) => {


    let createUser = () => {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ email: req.body.email })
                .exec((err, retrievedUserDetails) => {
                    if (err) {
                        logger.error(err.message, 'userController: createUser', 10)
                        let apiResponse = response.generate(true, 'Failed To Create User', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(retrievedUserDetails)) {
                        console.log(req.body)
                        let newUser = new UserModel({
                            userId: shortid.generate(),
                            firstName: req.body.firstName.toUpperCase(),
                            lastName: req.body.lastName.toUpperCase(),
                            fullName: req.body.firstName.toUpperCase() + " " + req.body.lastName.toUpperCase(),
                            email: req.body.email.toLowerCase(),
                            createdOn: time.now()
                        })

                        newUser.save((err, newUser) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'userController: createUser', 10)
                                let apiResponse = response.generate(true, 'Failed to create new User', 500, null)
                                reject(apiResponse)
                            } else {
                                let newUserObj = newUser.toObject();
                                resolve(newUserObj)
                            }
                        })
                    } else {
                        logger.error('User Cannot Be Created.User Already Present', 'userController: createUser', 4)
                        let apiResponse = response.generate(true, 'User Already Present With this Email', 403, null)
                        reject(apiResponse)
                    }
                })
        })
    }// end create user function

    let generateToken = (userDetails) => {
        console.log("generate token");
        return new Promise((resolve, reject) => {
            tokenLib.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    console.log(err)
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                } else {
                    tokenDetails.userId = userDetails.userId
                    tokenDetails.userDetails = userDetails
                    resolve(tokenDetails)
                }
            })
        })
    }
    let saveToken = (tokenDetails) => {
        console.log("save token");
        return new Promise((resolve, reject) => {
            AuthModel.findOne({ userId: tokenDetails.userId }, (err, retrievedTokenDetails) => {
                if (err) {
                    console.log(err.message, 'userController: saveToken', 10)
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                } else if (check.isEmpty(retrievedTokenDetails)) {
                    let newAuthToken = new AuthModel({
                        userId: tokenDetails.userId,
                        authToken: tokenDetails.token,
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    })
                    newAuthToken.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userController: saveToken', 10)
                            let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                } else {
                    retrievedTokenDetails.authToken = tokenDetails.token
                    retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret
                    retrievedTokenDetails.tokenGenerationTime = time.now()
                    retrievedTokenDetails.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userController: saveToken', 10)
                            let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                }
            })
        })
    }
    UserModel.findOne({ email: req.body.email })
        .exec((err, retrievedUserDetails) => {
            if (err) {
                logger.error(err.message, 'userController: createUser', 10)
                let apiResponse = response.generate(true, 'Failed To create User', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(retrievedUserDetails)) {
                console.log("Already loginerdsfsd")
                createUser(req, res)
                    .then(generateToken)
                    .then(saveToken)
                    .then((resolve) => {
                        delete resolve.password
                        let apiResponse = response.generate(false, 'User created', 200, resolve)
                        res.send(apiResponse)
                    })
                    .catch((err) => {
                        console.log(err);
                        res.send(err);
                    })


            } else {
                console.log("Already login")
                generateToken(retrievedUserDetails)
                    .then(saveToken)
                    .then((resolve) => {
                        delete resolve.password
                        let apiResponse = response.generate(false, 'User Login', 200, resolve)
                        res.send(apiResponse)
                    })
                    .catch((err) => {
                        console.log(err);
                        res.send(err);
                    })
            }
        })



}// end of Social signup function 

module.exports = {
    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    logoutFunction: logoutFunction,
    resetPassword: resetPasswordFunction,
    getAllUser: getAllUser,
    socialSignIn: socialSignIn
}; // end exports