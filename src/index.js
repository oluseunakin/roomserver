"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helper_1 = require("./helper");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const cookieParser = require("cookie-parser");
const origin = process.env.ORIGIN;
const port = process.env.PORT ? process.env.PORT : 3000;
const allowedMethods = ["PUT", "POST", "GET"];
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const wsServer = new socket_io_1.Server(httpServer, {
    cors: { origin, allowedHeaders: allowedMethods },
});
wsServer.on("connection", (socket) => {
    socket
        .on("online", (me, myRooms, joinedRooms) => {
        socket.join(me);
        myRooms.forEach((roomid) => socket.join(`room${roomid}`));
        joinedRooms.forEach((roomid) => socket.join(`room${roomid}`));
    })
        .on("inroom", (roomId, username) => {
        socket.join(`${username}${roomId}`);
        socket.join(`room${roomId}`);
        wsServer.in(`${username}${roomId}`).emit("inroomm", username);
    })
        .on("isOnline", (members) => __awaiter(void 0, void 0, void 0, function* () {
        const sockets = yield wsServer.fetchSockets();
        const onlineStatus = sockets.map((socket, i) => members.map((member) => {
            return socket.rooms.has(member);
        }));
        socket.emit("onlineStatus", onlineStatus);
    }))
        .on("joinroom", (roomId, roomname, joiner) => __awaiter(void 0, void 0, void 0, function* () {
        wsServer
            .in(`${joiner}${roomId}`)
            .emit("joinedroom", `${joiner} joined ${roomname}`, joiner);
        wsServer
            .in(`room${roomId}`)
            .emit("joinedroom", `${joiner} joined ${roomname}`, joiner);
        socket.join(`room${roomId}`);
    }))
        .on("leaveroom", (roomId, roomname, lefter) => {
        wsServer
            .in(`${lefter}${roomId}`)
            .emit("leftroom", `${lefter} left ${roomname}`, lefter);
        wsServer
            .in(`room${roomId}`)
            .emit("leftroom", `${lefter} left ${roomname}`, lefter);
        socket.leave(`room${roomId}`);
    })
        .on("newconversation", (conversation) => {
        wsServer.in(`room${conversation.room.id}`).emit("nc", conversation);
    })
        .on("commented", (comment, roomid) => {
        wsServer.in(`inroom${roomid}`).emit("comment", comment);
        [];
    })
        .on("agreed", (roomid, id, userid, data) => {
        wsServer.in(`inroom${roomid}`).emit("agree", id, userid, data);
    })
        .on("disagreed", (roomid, id, userid, data) => {
        wsServer.in(`inroom${roomid}`).emit("disagree", id, userid, data);
    })
        .on("offline", (me, myRooms) => {
        socket.leave(me);
        myRooms.forEach((roomId) => socket.leave(`room${roomId}`));
    })
        .on("newchat", (sender, receiver, message) => __awaiter(void 0, void 0, void 0, function* () {
        wsServer.in(receiver).emit("receiveChat", message, sender);
    }))
        .on("goinglive", (roomId, sender) => wsServer.in(`room${roomId}`).emit("setupLive", sender))
        .on("live", (sdp, roomId, sender) => {
        wsServer.in(`room${roomId}`).emit("incomingLive", sdp, sender);
    })
        .on("sendingICE", (candidate, roomId, sender) => {
        wsServer.in(`room${roomId}`).emit("receivingICE", candidate, sender);
    });
});
app.use(cookieParser());
app.use((request, response, next) => {
    request.setEncoding("utf8");
    response
        .setHeader("Access-Control-Allow-Origin", origin)
        .setHeader("Access-Control-Allow-Methods", allowedMethods)
        .setHeader("Access-Control-Allow-Headers", "content-type")
        .setHeader("Access-Control-Allow-Credentials", "true");
    next();
});
app.get("/", (request, response) => {
    response.end("welcome");
});
app.post("/deletetables", (request, response) => {
    request.on("data", (tablenames) => __awaiter(void 0, void 0, void 0, function* () {
        let names = tablenames;
        if (tablenames.indexOf(",") !== -1) {
            names = tablenames.split(",");
        }
        const rows = yield (0, helper_1.deleteTables)(names);
        return response.send(`${rows} have been deleted`);
    }));
});
app.put("/user/createuser", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, helper_1.createOrFindUser)(JSON.parse(data));
        return response
            .cookie("userid", user.id, {
            sameSite: "none",
            httpOnly: true,
            secure: true,
        })
            .json(user);
    }));
}));
app.get("/user/getuser", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const userid = request.cookies.userid;
    return response.json(yield (0, helper_1.findUser)(Number(userid)));
}));
app.get("/user/getmyrooms/:count", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = Number(request.cookies.userid);
    const count = Number(request.params.count);
    const take = 10;
    return response.send((_a = (yield (0, helper_1.getMyRooms)(userId, count, take))) === null || _a === void 0 ? void 0 : _a.myrooms);
}));
app.get("/user/getjoinedrooms/:count", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = Number(request.cookies.userid);
    const count = Number(request.params.count);
    const take = 10;
    return response.send((_b = (yield (0, helper_1.getJoinedRooms)(userId, count, take))) === null || _b === void 0 ? void 0 : _b.joinedrooms);
}));
app.get("/user/all", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    return response.json(yield (0, helper_1.getAllUsers)());
}));
app.post("/user/updateuser", (request, response) => {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const updated = yield (0, helper_1.updateUserRooms)(Number(request.cookies.userid), JSON.parse(data));
        return response.json(updated);
    }));
});
app.put("/room/createroom", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const room = JSON.parse(data);
        return response.json(yield (0, helper_1.createRoom)(room.topic.name, room.name, room.creatorId));
    }));
}));
app.get("/room/all/:pageno", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    return response.json(yield (0, helper_1.getAllRooms)(Number(request.params.pageno), Number(request.cookies.userid)));
}));
app.get("/room/:roomid", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomid } = request.params;
    return response.json(yield (0, helper_1.findRoom)(Number(roomid)));
}));
app.post("/room/joinroom", (request, response) => {
    request.on("data", (roomId) => __awaiter(void 0, void 0, void 0, function* () {
        return response.json(yield (0, helper_1.joinRoom)(Number(roomId), Number(request.cookies.userid)));
    }));
});
app.post("/room/leaveroom", (request, response) => {
    request.on("data", (roomId) => __awaiter(void 0, void 0, void 0, function* () {
        return response.json(yield (0, helper_1.leaveRoom)(Number(roomId), Number(request.cookies.userid)));
    }));
});
app.get("/room/:id/withconversations", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = request.params;
    return response.json(yield (0, helper_1.findRoomWithConversations)(Number(id), Number(request.cookies.userid)));
}));
app.get("/room/:id/getmembers/:pageno", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, pageno } = request.params;
    return response.json(yield (0, helper_1.findRoomUsers)(Number(id), Number(pageno), 20));
}));
app.post("/chat/setchat", (request, response) => {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { receiverId, message } = JSON.parse(data);
        yield (0, helper_1.setChat)(Number(request.cookies.userid), receiverId, message);
        response.send({ done: "done" });
    }));
});
app.get("/chat/:receiver", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { receiver } = request.params;
    return response.json(yield (0, helper_1.findChat)(Number(request.cookies.userid), Number(receiver)));
}));
app.put("/trends/create", (request, response) => {
    request.on("data", (data) => { });
});
app.put("/conversation/create", (request, response) => {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const conversation = JSON.parse(data);
        response.json(yield (0, helper_1.createConversation)(Number(request.cookies.userid), conversation.roomId, conversation.convo, conversation.media));
    }));
});
app.post("/conversation/:id/agree", (request, response) => {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, helper_1.agree)(Number(request.params.id), Number(data));
        response.send();
    }));
});
app.post("/conversation/:id/disagree", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, helper_1.disagree)(Number(request.params.id), Number(data));
        response.send();
    }));
}));
app.post("/conversation/:id/comment", (request, response) => {
    const userId = Number(request.cookies.userid);
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const coment = JSON.parse(data);
        return response.json(yield (0, helper_1.comment)(Number(request.params.id), userId, coment.comment, coment.roomId, coment.media));
    }));
});
app.get("/conversation/:id/getcomments", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    return response.json(yield (0, helper_1.getComments)(Number(request.params.id)));
}));
app.get("/topics", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    response.send(yield (0, helper_1.getTopics)());
}));
app.post("/logout", (request, response) => {
    response.clearCookie("userid");
    response.send("logout");
});
httpServer.listen(port, () => {
    console.log("server is up at " + port);
});
