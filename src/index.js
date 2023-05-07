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
const origin = process.env.ORIGIN || "http://127.0.0.1:5173";
const port = process.env.PORT ? process.env.PORT : 3000;
const allowedMethods = ["PUT", "POST", "GET"];
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const wsServer = new socket_io_1.Server(httpServer, {
    cors: { origin, allowedHeaders: allowedMethods },
});
let rooms = [];
wsServer.on("connection", (socket) => {
    socket.on("rooms", (myrooms, me) => {
        rooms = myrooms;
        socket.join(me);
        myrooms.forEach((room) => {
            socket.join(room.name);
            wsServer.in(room.name).emit("comeon", me);
        });
    });
    socket.on("joinroom", (name, joiner) => __awaiter(void 0, void 0, void 0, function* () {
        socket.in(name).emit("joinedroom", joiner, name);
    }));
    socket.on("receivedRoomMessage", (conversation) => {
        wsServer.in(`room${conversation.roomId}`).emit("message", conversation);
    });
    socket.on("offline", (me) => {
        socket.leave(me);
        rooms.forEach((room) => {
            socket.leave(room.name);
            wsServer.in(room.name).emit("goneoff", me);
        });
    });
    socket.on("isonline", (users) => __awaiter(void 0, void 0, void 0, function* () {
        let status = users.map((user, i) => __awaiter(void 0, void 0, void 0, function* () { return (yield wsServer.in(user.name).fetchSockets()).length > 0 ? true : false; }));
        const stat = yield Promise.all(status);
        socket.emit("status", stat);
    }));
    socket.on("chat", (partner, message) => __awaiter(void 0, void 0, void 0, function* () {
        wsServer.in(partner.name).emit("receiveChat", partner, message);
    }));
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
app.put("/room/createroom", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        return response.json(yield (0, helper_1.createOrFindRoom)(JSON.parse(data)));
    }));
}));
app.put("/user/createuser", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield (0, helper_1.createOrFindUser)(JSON.parse(data));
        return response
            .cookie("userid", user.id, { sameSite: "none", domain: '.onrender.com', httpOnly: true, secure: true })
            .json(user);
    }));
}));
app.get("/room/all/:pageno", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    return response.json(yield (0, helper_1.getAllRooms)(Number(request.params.pageno), Number(request.cookies.userid)));
}));
app.get("/user/all", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    return response.json(yield (0, helper_1.getAllUsers)());
}));
app.get("/room/:roomname", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomname } = request.params;
    return response.json(yield (0, helper_1.findRoom)(roomname));
}));
app.post("/room/joinroom", (request, response) => {
    request.on("data", (roomname) => __awaiter(void 0, void 0, void 0, function* () {
        return response.json(yield (0, helper_1.joinRoom)(roomname, Number(request.cookies.userid)));
    }));
});
app.put("/trends/create", (request, response) => {
    request.on("data", (data) => { });
});
app.get("/room/withusers/:roomname", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomname } = request.params;
    return response.json(yield (0, helper_1.findRoomWithUsers)(roomname));
}));
app.get("/user/getuser", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const userid = request.cookies.userid;
    return response.json(yield (0, helper_1.findUser)(Number(userid)));
}));
app.get("/chat/:receiver", (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { receiver } = request.params;
    return response.json(yield (0, helper_1.findChat)(Number(request.cookies.userid), Number(receiver)));
}));
app.post("/user/updateuser", (request, response) => {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const updated = yield (0, helper_1.updateUserRooms)(Number(request.cookies.userid), JSON.parse(data));
        return response.json(updated);
    }));
});
app.put("/conversation/create", (request, response) => {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        response.json(yield (0, helper_1.createConversation)(JSON.parse(data), Number(request.cookies.userid)));
    }));
});
app.post("/chat/setchat", (request, response) => {
    request.on("data", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { receiverId, message } = JSON.parse(data);
        yield (0, helper_1.setChat)(Number(request.cookies.userid), receiverId, message);
        response.send({ done: "done" });
    }));
});
app.post("/logout", (request, response) => {
    response.clearCookie('userid');
    response.send('logout');
});
httpServer.listen(port, () => {
    console.log("server is up at " + port);
});
