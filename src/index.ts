import express from "express";
import {
  agree,
  comment,
  createConversation,
  createOrFindUser,
  createRoom,
  deleteTables,
  disagree,
  findChat,
  findRoom,
  findRoomUsers,
  findRoomWithConversations,
  findUser,
  getAllRooms,
  getAllUsers,
  getComments,
  getJoinedRooms,
  getMyRooms,
  getTopics,
  joinRoom,
  leaveRoom,
  setChat,
  updateUserRooms,
} from "./helper";
import { Server } from "socket.io";
import { createServer } from "http";
import { Message, Room, User } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const cookieParser = require("cookie-parser");
const origin = process.env.ORIGIN as string;
const port = process.env.PORT ? process.env.PORT : 3000;
const allowedMethods = ["PUT", "POST", "GET"];
const app = express();
const httpServer = createServer(app);

const wsServer = new Server(httpServer, {
  cors: { origin, allowedHeaders: allowedMethods },
});

wsServer.on("connection", (socket) => {
  socket
    .on("online", (me, myRooms: number[], joinedRooms: number[]) => {
      socket.join(me);
      myRooms.forEach((roomid) => socket.join(`room${roomid}`));
      joinedRooms.forEach((roomid) => socket.join(`room${roomid}`));
    })
    .on("inroom", (roomId, username) => {
      socket.join(`${username}${roomId}`);
      socket.join(`room${roomId}`);
      wsServer.in(`${username}${roomId}`).emit("inroomm", username);
    })
    .on("isOnline", async (members: string[]) => {
      const sockets = await wsServer.fetchSockets();
      const onlineStatus = sockets.map((socket, i) =>
        members.map((member) => {
          return socket.rooms.has(member);
        })
      );
      socket.emit("onlineStatus", onlineStatus);
    })
    .on("joinroom", async (roomId, roomname, joiner) => {
      wsServer
        .in(`${joiner}${roomId}`)
        .emit("joinedroom", `${joiner} joined ${roomname}`, joiner);
      wsServer
        .in(`room${roomId}`)
        .emit("joinedroom", `${joiner} joined ${roomname}`, joiner);
      socket.join(`room${roomId}`);
    })
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
    .on("offline", (me, myRooms: number[]) => {
      socket.leave(me);
      myRooms.forEach((roomId) => socket.leave(`room${roomId}`));
    })
    .on("newchat", async (sender: User, receiver: string, message: Message) => {
      wsServer.in(receiver).emit("receiveChat", message, sender);
    })
    .on("goinglive", (roomId: number, sender: string) =>
      wsServer.in(`room${roomId}`).emit("setupLive", sender)
    )
    .on(
      "live",
      (sdp: RTCSessionDescription, roomId: number, sender: string) => {
        wsServer.in(`room${roomId}`).emit("incomingLive", sdp, sender);
      }
    )
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
  request.on("data", async (tablenames) => {
    let names: string | string[] = tablenames;
    if (tablenames.indexOf(",") !== -1) {
      names = tablenames.split(",");
    }
    const rows = await deleteTables(names);
    return response.send(`${rows} have been deleted`);
  });
});

app.put("/user/createuser", async (request, response) => {
  request.on("data", async (data) => {
    const user = await createOrFindUser(JSON.parse(data));
    return response
      .cookie("userid", user.id, {
        sameSite: "none",
        httpOnly: true,
        secure: true,
      })
      .json(user);
  });
});

app.get("/user/getuser", async (request, response) => {
  const userid = request.cookies.userid;
  return response.json(await findUser(Number(userid)));
});

app.get("/user/getmyrooms/:count", async (request, response) => {
  const userId = Number(request.cookies.userid);
  const count = Number(request.params.count);
  const take = 10;
  return response.send((await getMyRooms(userId, count, take))?.myrooms);
});

app.get("/user/getjoinedrooms/:count", async (request, response) => {
  const userId = Number(request.cookies.userid);
  const count = Number(request.params.count);
  const take = 10;
  return response.send(
    (await getJoinedRooms(userId, count, take))?.joinedrooms
  );
});

app.get("/user/all", async (request, response) => {
  return response.json(await getAllUsers());
});

app.post("/user/updateuser", (request, response) => {
  request.on("data", async (data) => {
    const updated = await updateUserRooms(
      Number(request.cookies.userid),
      JSON.parse(data)
    );
    return response.json(updated);
  });
});

app.put("/room/createroom", async (request, response) => {
  request.on("data", async (data) => {
    const room = JSON.parse(data);
    return response.json(
      await createRoom(room.topic.name, room.name, room.creatorId)
    );
  });
});

app.get("/room/all/:pageno", async (request, response) => {
  return response.json(
    await getAllRooms(
      Number(request.params.pageno),
      Number(request.cookies.userid)
    )
  );
});

app.get("/room/:roomid", async (request, response) => {
  const { roomid } = request.params;
  return response.json(await findRoom(Number(roomid)));
});

app.post("/room/joinroom", (request, response) => {
  request.on("data", async (roomId) => {
    return response.json(
      await joinRoom(Number(roomId), Number(request.cookies.userid))
    );
  });
});

app.post("/room/leaveroom", (request, response) => {
  request.on("data", async (roomId) => {
    return response.json(
      await leaveRoom(Number(roomId), Number(request.cookies.userid))
    );
  });
});

app.get("/room/:id/withconversations", async (request, response) => {
  const { id } = request.params;
  return response.json(
    await findRoomWithConversations(Number(id), Number(request.cookies.userid))
  );
});

app.get("/room/:id/getmembers/:pageno", async (request, response) => {
  const { id, pageno } = request.params;
  return response.json(await findRoomUsers(Number(id), Number(pageno), 20));
});

app.post("/chat/setchat", (request, response) => {
  request.on("data", async (data) => {
    const { receiverId, message } = JSON.parse(data);
    await setChat(Number(request.cookies.userid), receiverId, message);
    response.send({ done: "done" });
  });
});

app.get("/chat/:receiver", async (request, response) => {
  const { receiver } = request.params;
  return response.json(
    await findChat(Number(request.cookies.userid), Number(receiver))
  );
});

app.put("/trends/create", (request, response) => {
  request.on("data", (data) => {});
});

app.put("/conversation/create", (request, response) => {
  request.on("data", async (data) => {
    const conversation = JSON.parse(data);
    response.json(
      await createConversation(
        Number(request.cookies.userid),
        conversation.roomId,
        conversation.convo,
        conversation.media
      )
    );
  });
});

app.post("/conversation/:id/agree", (request, response) => {
  request.on("data", async (data) => {
    await agree(Number(request.params.id), Number(data));
    response.send();
  });
});

app.post("/conversation/:id/disagree", async (request, response) => {
  request.on("data", async (data) => {
    await disagree(Number(request.params.id), Number(data));
    response.send();
  });
});

app.post("/conversation/:id/comment", (request, response) => {
  const userId = Number(request.cookies.userid);
  request.on("data", async (data) => {
    const coment = JSON.parse(data);
    return response.json(
      await comment(
        Number(request.params.id),
        userId,
        coment.comment,
        coment.roomId,
        coment.media
      )
    );
  });
});

app.get("/conversation/:id/getcomments", async (request, response) => {
  return response.json(await getComments(Number(request.params.id)));
});

app.get("/topics", async (request, response) => {
  response.send(await getTopics());
});

app.post("/logout", (request, response) => {
  response.clearCookie("userid");
  response.send("logout");
});

httpServer.listen(port, () => {
  console.log("server is up at " + port);
});
