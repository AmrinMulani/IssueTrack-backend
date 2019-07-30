const socketio = require('socket.io')
const tokenLib = require('./tokenLib')
const check = require('./checkLib')
const mongoose = require('mongoose');
const IssueModel = mongoose.model('Issue');
const WatcherModel = mongoose.model('Watcher');
//here server is http server initialized in app.js
let setServer = (server) => {

    //socket initialization
    let io = socketio.listen(server)
    let myIo = io.of('') //no namespace

    //main event handler,inside this series of events can be handled
    myIo.on('connection', (socket) => {
        socket.emit("verifyUser", "verifying user details"); //event emit=>listening on frontend

        socket.on('set-user', (authToken) => {
            console.log("set-user called")
            if (check.isEmpty(authToken)) {
                console.log('Empty authToken')
            } else {
                tokenLib.verifyClaims(authToken, (err, user) => {
                    if (err) {
                        socket.emit('auth-error', {
                            status: 500,
                            error: 'Please provide correct auth token'
                        })
                    } else {

                        console.log("user is verified..setting details");
                        let currentUser = user.data;
                        console.log(currentUser)
                        // setting socket user id 
                        socket.userId = currentUser.userId
                        let fullName = `${currentUser.firstName} ${currentUser.lastName}`
                        let key = currentUser.userId
                        let value = fullName

                    }
                })
            }
        })
        socket.on('create-issue', (data) => {
            console.log(data);
            const obj = {
                message: data.notifyDescription,
                issueId: data.issueId
            }
            myIo.emit(data.assigneeId, obj);
        }) //end socket listening with event(friend-info)

        socket.on('update-issue', (data) => {
            console.log(data);
            let userArray = [];
            WatcherModel.find({ 'issueId': data.issueId })
                .select()
                .lean().exec((err, watchers) => {
                    watchers.forEach(element => {
                        userArray.push(element.watcherId)
                    });
                    userArray.push(data.assigneeId);
                    userArray.push(data.reporterId);

                    setTimeout(() => {
                        let uniqueUserArray = Array.from(new Set(userArray));

                        const obj = {
                            message: data.notifyDescription,
                            issueId: data.issueId
                        }
                        uniqueUserArray.forEach((element) => {
                            if (data.currentUserId !== element) {
                                myIo.emit(element, obj);
                            }
                        })
                    }, 0);
                })
        }) //end socket listening with event(friend-info)

        socket.on('logout', (userId) => {
            socket.disconnect();
        })
        socket.on('disconnect', () => {
            console.log('user is disconnected');
            console.log(socket.userId);
        }) //end of on disconnect

    }) //end main socket 'connection
} //end setServer


module.exports = {
    setServer: setServer
}