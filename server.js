/////////////////////////////////
///// Service Static Files /////
///////////////////////////////

var Express = require("express")

Express().use(Express.static("public")).listen(3000)
console.log("Listening on http://127.0.0.1:3000")

///////////////////////////
///// Managing State /////
/////////////////////////

var state = new Object({
    estimates: {},
    toString: function() {
        return JSON.stringify(this)
    }
})

//////////////////////////////
///// Broadcasting Data /////
////////////////////////////

var WebSocket = require("ws")

var wss = new WebSocket.Server({port: 8080})

wss.broadcast = function(data) {
    wss.clients.forEach(function(client) {
        client.send(data)
    })
}

wss.on("connection", function(ws) {
    ws.on("message", function(message) {
        message = JSON.parse(message)
        if(message.type == "connect") {
            ws.id = message.data.id
            state.estimates[ws.id] = {}
            wss.broadcast(state.toString())
        } else if(message.type == "update") {
            var index = message.data.estimates.index
            var value = message.data.estimates.value
            if(value != null) {
                state.estimates[ws.id][index] = value
            } else {
                delete state.estimates[ws.id][index]
            }
            wss.broadcast(state.toString())
        } else if(message.type == "clear") {
            for(var id in state.estimates) {
                state.estimates[id] = {}
            }
            wss.broadcast(state.toString())
        }
    })
    ws.on("close", () => {
        delete state.estimates[ws.id]
        wss.broadcast(state.toString())
    })
})
