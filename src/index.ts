import express from "express";
import {
  ConversationWithMessage,
  createConversation,
  createOrFindRoom,
  createOrFindUser,
  findChat,
  findRoom,
  findRoomWithUsers,
  findUser,
  getAllRooms,
  getAllUsers,
  joinRoom,
  setChat,
  updateUserRooms,
} from "./helper";
import { Server } from "socket.io";
import { createServer } from "http";
import { Message, Room, User } from "@prisma/client";
import * as dotenv from 'dotenv'
dotenv.config()

const origin = process.env.ORIGIN || 'https://127.0.0.1:5173';
const allowedMethods = ["PUT", "POST", "GET"];
const app = express();
const httpServer = createServer(app);

const wsServer = new Server(httpServer, {
  cors: { origin, allowedHeaders: allowedMethods },
});
let rooms: Room[] = [];
wsServer.on("connection", (socket) => {
  socket.on("rooms", (myrooms: Room[], me) => {
    rooms = myrooms;
    socket.join(me);
    myrooms.forEach((room) => {
      socket.join(room.name);
      wsServer.in(room.name).emit("comeon", me);
    });
  });

  socket.on('joinroom', async (name: string, joiner: string) => {
    socket.in(name).emit('joinedroom', joiner, name)
    await joinRoom(name, joiner)
  })

  socket.on("receivedRoomMessage", (conversation: ConversationWithMessage) => {
    wsServer.in(conversation.roomName).emit("message", conversation);
    createConversation(conversation);
  });

  socket.on("offline", (me) => {
    socket.leave(me);
    rooms.forEach((room) => {
      socket.leave(room.name);
      wsServer.in(room.name).emit("goneoff", me);
    });
  });

  socket.on("isonline", async (users: User[]) => {
    let status = users.map(async (user, i) =>
      (await wsServer.in(user.name).fetchSockets()).length > 0 ? true : false
    );
    const stat = await Promise.all(status);
    socket.emit("status", stat);
  });

  socket.on("chat", async (partner: string, message: Message) => {
    wsServer.in(partner).emit("receiveChat", message);
    setChat({
      senderName: message.sender,
      receiverName: partner,
      message,
    });
  });
});

app.use((request, response, next) => {
  request.setEncoding("utf8");
  response
    .setHeader("access-control-allow-origin", origin)
    .setHeader("access-control-allow-methods", allowedMethods)
    .setHeader("Access-Control-Allow-Headers", "content-type");
  next();
});

app.get("/", (request, response) => {
  response.end("welcome");
});

app.put("/room/createroom", async (request, response) => {
  request.on("data", async (data) => {
    return response.json(await createOrFindRoom(JSON.parse(data)));
  });
});

app.put("/user/createuser", async (request, response) => {
  request.on("data", async (data) => {
    return response.json(await createOrFindUser(JSON.parse(data)));
  });
});

app.get("/room/all", async (request, response) => {
  return response.json(await getAllRooms());
});

app.get("/user/all", async (request, response) => {
  return response.json(await getAllUsers());
});

app.get("/room/:roomname", async (request, response) => {
  const { roomname } = request.params;
  return response.json(await findRoom(roomname));
});

app.get("/room/withusers/:roomname", async (request, response) => {
  const { roomname } = request.params;
  return response.json(await findRoomWithUsers(roomname));
});

app.get("/user/:username", async (request, response) => {
  const { username } = request.params;
  return response.json(await findUser(username));
});

app.get("/chat/:sender/:receiver", async (request, response) => {
  const { sender, receiver } = request.params;
  return response.json(await findChat(sender, receiver));
});

app.post("/user/update/:username", (request, response) => {
  const { username } = request.params;
  request.on("data", async (data) => {
    const updated = await updateUserRooms(username, JSON.parse(data));
    return response.json(updated);
  });
});

app.put("/conversation/create", (request, response) => {
  request.on("data", async (data) => {
    response.json(await createConversation(JSON.parse(data)));
  });
});

app.post("/chat/setchat", (request, response) => {
  request.on("data", (data) => {
    setChat(JSON.parse(data));
    response.send("done");
  });
});
httpServer.listen(10000,"0.0.0.0", () => {
  console.log("server is up");
});
