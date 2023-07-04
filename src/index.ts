import express from "express";
import {
  agree,
  comment,
  createConversation,
  createOrFindRoom,
  createOrFindUser,
  deleteTables,
  disagree,
  findChat,
  findRoom,
  findRoomWithUsers,
  findUser,
  getAllRooms,
  getAllUsers,
  getComments,
  joinRoom,
  setChat,
  updateUserRooms,
} from "./helper";
import { Server } from "socket.io";
import { createServer } from "http";
import { Message, Room, User } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const cookieParser = require("cookie-parser");
const origin = process.env.ORIGIN || "http://127.0.0.1:5173";
const port = process.env.PORT ? process.env.PORT : 3000;
const allowedMethods = ["PUT", "POST", "GET"];
const app = express();
const httpServer = createServer(app);

const wsServer = new Server(httpServer, {
  cors: { origin, allowedHeaders: allowedMethods },
});
let rooms: Room[] = [];
wsServer.on("connection", (socket) => {
  socket.on("online", (me) => {
    socket.join(me);
  }).on("joinroom", async (roomId, joinerId) => {
    socket.join(`room${roomId}`);
    socket.in(`room${roomId}`).emit("joinedroom", joinerId);
  }).on("leftroom", (roomId, userId) => {
    socket.leave(`room${roomId}`);
    wsServer.in(`room${roomId}`).emit("goneoff", userId);
  })
  .on("receivedRoomMessage", (conversation) => {
    wsServer.in(`room${conversation.room.id}`).emit("message", conversation);
  }).on("commented", (comment, roomid) => {
    wsServer.in(`room${roomid}`).emit("comment", comment);
  }).on("agreed", (roomid, id, userid, data) => {
    wsServer.in(`room${roomid}`).emit("agree", id, userid, data);
  }).on("disagreed", (roomid, id, userid, data) => {
    wsServer.in(`room${roomid}`).emit("disagree", id, userid, data);
  })
  .on("offline", (me) => {
    socket.leave(me);
  }).on("isonline", async (users: User[]) => {
    let status = users.map(async (user, i) =>
      (await wsServer.in(user.name).fetchSockets()).length > 0 ? true : false
    );
    const stat = await Promise.all(status);
    socket.emit("status", stat);
  }).on("chat", async (receiver: User, message: Message) => {
    wsServer.in(receiver.name).emit("receiveChat", message);
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

app.put("/room/createroom", async (request, response) => {
  request.on("data", async (data) => {
    return response.json(await createOrFindRoom(JSON.parse(data)));
  });
});

app.put("/user/createuser", async (request, response) => {
  request.on("data", async (data) => {
    const user = await createOrFindUser(JSON.parse(data));
    return response
      .cookie("userid", user.id, { sameSite: "none", httpOnly: true, secure: true})
      .json(user);
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

app.get("/user/all", async (request, response) => {
  return response.json(await getAllUsers());
});

app.get("/room/:roomid", async (request, response) => {
  const { roomid } = request.params;
  return response.json(await findRoom(Number(roomid)));
});

app.post("/room/joinroom", (request, response) => {
  request.on("data", async (roomname) => {
    return response.json(
      await joinRoom(roomname, Number(request.cookies.userid))
    );
  });
});

app.put("/trends/create", (request, response) => {
  request.on("data", (data) => {});
});

app.get("/room/withusers/:id", async (request, response) => {
  const { id } = request.params;
  return response.json(await findRoomWithUsers(Number(id)));
});

app.get("/user/getuser", async (request, response) => {
  const userid = request.cookies.userid;
  return response.json(await findUser(Number(userid)));
});

app.get("/chat/:receiver", async (request, response) => {
  const { receiver } = request.params;
  return response.json(
    await findChat(Number(request.cookies.userid), Number(receiver))
  );
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

app.put("/conversation/create", (request, response) => {
  request.on("data", async (data) => {
    response.json(
      await createConversation(JSON.parse(data), Number(request.cookies.userid))
    );
  });
});

app.post("/conversation/:id/agree", (request, response) => {
  request.on("data", async (data) => {
    return response.json(await agree(Number(request.params.id), JSON.parse(data)))
  })
  
})

app.post("/conversation/:id/disagree", async (request, response) => {
  request.on("data", async (data) => {
    return response.json(await disagree(Number(request.params.id), JSON.parse(data)))
  })
})

app.post("/conversation/:id/comment", (request, response) => {
  const userId = Number(request.cookies.userid)
  request.on('data', async (data) => { 
    return response.json(await comment(Number(request.params.id), userId, JSON.parse(data)))
  })
})

app.get("/conversation/:id/getcomments", async (request, response) => {
  return response.json(await getComments(Number(request.params.id)))
})

app.post("/chat/setchat", (request, response) => {
  request.on("data", async (data) => {
    const { receiverId, message } = JSON.parse(data);
    await setChat(Number(request.cookies.userid), receiverId, message);
    response.send({ done: "done" });
  });
});

app.post("/logout", (request, response) => {
  response.clearCookie('userid')
  response.send('logout')
})

httpServer.listen(port, () => {
  console.log("server is up at " + port);
});
