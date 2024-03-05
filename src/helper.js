"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTables = exports.getAllRooms = exports.getAllUsers = exports.getTopics = exports.leaveRoom = exports.joinRoom = exports.findRoomUsers = exports.findRoomWithConversations = exports.findRoom = exports.setChat = exports.findChat = exports.computeId = exports.getJoinedRooms = exports.getMyRooms = exports.findUser = exports.updateUserRooms = exports.comment = exports.getComments = exports.disagree = exports.agree = exports.createConversation = exports.createOrFindUser = exports.createRoom = void 0;
const db_server_1 = require("./db.server");
/* const chatWithMessages = Prisma.validator<Prisma.ChatArgs>()({
  include: { messages: true },
});

type ChatWithMessages = Prisma.ChatGetPayload<typeof chatWithMessages>; */
const createRoom = (topic, name, creatorId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_server_1.prisma.room.create({
        data: {
            name,
            creator: { connect: { id: creatorId } },
            topic: {
                connectOrCreate: { where: { name: topic }, create: { name: topic } },
            },
            members: { connect: { id: creatorId } },
        },
        include: { topic: true },
    });
});
exports.createRoom = createRoom;
const createOrFindUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const id = (0, exports.computeId)(user.name, user.password);
    let foundOrCreated;
    user.id = id;
    try {
        foundOrCreated = yield db_server_1.prisma.user.findUniqueOrThrow({
            where: { id },
            select: { name: true, id: true },
        });
    }
    catch (e) {
        foundOrCreated = yield db_server_1.prisma.user.create({
            data: user,
            select: { name: true, id: true },
        });
    }
    return foundOrCreated;
});
exports.createOrFindUser = createOrFindUser;
const createConversation = (talkerId, roomId, convo, media) => __awaiter(void 0, void 0, void 0, function* () {
    return db_server_1.prisma.conversation.create({
        data: {
            talker: { connect: { id: talkerId } },
            room: { connect: { id: roomId } },
            convo,
            media,
        },
        include: {
            talker: { select: { name: true, id: true } },
            room: { select: { name: true, id: true } },
            _count: { select: { comments: true } },
        },
    });
});
exports.createConversation = createConversation;
const agree = (id, agreer) => __awaiter(void 0, void 0, void 0, function* () {
    yield db_server_1.prisma.conversation.update({
        where: { id },
        data: { agree: { connect: { id: agreer } } },
    });
});
exports.agree = agree;
const disagree = (id, disagreer) => __awaiter(void 0, void 0, void 0, function* () {
    yield db_server_1.prisma.conversation.update({
        where: { id },
        data: { disagree: { connect: { id: disagreer } } },
    });
});
exports.disagree = disagree;
const getComments = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_server_1.prisma.conversation.findUnique({
        where: { id },
        select: {
            comments: {
                include: {
                    talker: { select: { name: true, id: true } },
                },
            },
        },
    });
});
exports.getComments = getComments;
const comment = (conversationId, commentor, comment, roomId, media) => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_server_1.prisma.conversation.update({
        where: { id: conversationId },
        data: {
            comments: {
                create: {
                    convo: comment,
                    media,
                    talker: { connect: { id: commentor } },
                    room: { connect: { id: roomId } },
                },
            },
        },
    });
});
exports.comment = comment;
const updateUserRooms = (id, rooms) => __awaiter(void 0, void 0, void 0, function* () {
    yield db_server_1.prisma.user.update({
        data: { myrooms: { connect: [...rooms] } },
        where: { id },
    });
    return "done";
});
exports.updateUserRooms = updateUserRooms;
const findUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield db_server_1.prisma.user.findUniqueOrThrow({
            where: { id },
            select: {
                name: true,
                id: true,
            },
        });
    }
    catch (e) {
        return { error: "User not found" };
    }
});
exports.findUser = findUser;
const getMyRooms = (id, count, take) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = count * take;
    return yield db_server_1.prisma.user.findUnique({
        where: { id },
        select: {
            myrooms: {
                take,
                skip,
                orderBy: { id: "desc" },
            },
        },
    });
});
exports.getMyRooms = getMyRooms;
const getJoinedRooms = (id, count, take) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = count * take;
    return yield db_server_1.prisma.user.findUnique({
        where: { id },
        select: {
            joinedrooms: {
                take,
                skip,
                orderBy: { id: "desc" },
            },
        },
    });
});
exports.getJoinedRooms = getJoinedRooms;
const computeId = (name1, name2) => {
    let key1 = 0, key2 = 0;
    for (let i = 0; i < name1.length; i++) {
        key1 += name1.charCodeAt(i);
    }
    for (let i = 0; i < name2.length; i++) {
        key2 += name2.charCodeAt(i);
    }
    return key1 + key2;
};
exports.computeId = computeId;
const findChat = (sender, receiver) => __awaiter(void 0, void 0, void 0, function* () {
    const id = sender + receiver;
    return yield db_server_1.prisma.chat.findUnique({
        where: { id },
        include: { messages: true },
    });
});
exports.findChat = findChat;
const setChat = (senderId, receiverId, messages) => __awaiter(void 0, void 0, void 0, function* () {
    const id = senderId + receiverId;
    const chat = yield db_server_1.prisma.chat.findUnique({
        where: { id },
        select: { messages: true },
    });
    messages.forEach((message, i) => __awaiter(void 0, void 0, void 0, function* () {
        if (chat)
            yield db_server_1.prisma.chat.update({
                where: { id },
                data: {
                    messages: {
                        create: {
                            text: message.text,
                        },
                    },
                },
            });
        else
            yield db_server_1.prisma.chat.create({
                data: {
                    id,
                    messages: {
                        create: {
                            text: message.text,
                        },
                    },
                },
            });
    }));
});
exports.setChat = setChat;
const findRoom = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield db_server_1.prisma.room.findUniqueOrThrow({
            where: { id },
            include: { topic: true },
        });
    }
    catch (e) {
        return { error: "Room not found" };
    }
});
exports.findRoom = findRoom;
const findRoomWithConversations = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield db_server_1.prisma.user.findUnique({
            where: { id: userId },
            include: { joinedrooms: { where: { id } } },
        });
        const isMember = user.joinedrooms.length > 0;
        const room = yield db_server_1.prisma.room.findUniqueOrThrow({
            where: { id },
            include: {
                conversations: {
                    include: {
                        talker: {
                            select: { id: true, name: true },
                        },
                        room: {
                            select: { id: true, name: true },
                        },
                        _count: {
                            select: { comments: true },
                        },
                        agree: true,
                        disagree: true,
                    },
                    orderBy: { id: "desc" },
                },
                topic: true,
            },
        });
        return { room, isMember };
    }
    catch (e) {
        return { error: "Room not found" };
    }
});
exports.findRoomWithConversations = findRoomWithConversations;
const findRoomUsers = (roomId, count, take) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = count * take;
    return yield db_server_1.prisma.room.findUnique({
        where: { id: roomId },
        select: {
            members: {
                select: { id: true, name: true },
                skip,
                take,
                orderBy: { id: "asc" },
            },
        },
    });
});
exports.findRoomUsers = findRoomUsers;
const joinRoom = (roomId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield db_server_1.prisma.room.update({
        where: { id: roomId },
        data: { members: { connect: { id: userId } } },
    });
});
exports.joinRoom = joinRoom;
const leaveRoom = (roomId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield db_server_1.prisma.room.update({
        where: { id: roomId },
        data: { members: { disconnect: { id: userId } } },
    });
});
exports.leaveRoom = leaveRoom;
const getTopics = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_server_1.prisma.topic.findMany();
});
exports.getTopics = getTopics;
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield db_server_1.prisma.user.findMany();
});
exports.getAllUsers = getAllUsers;
const getAllRooms = (pageno, userid) => __awaiter(void 0, void 0, void 0, function* () {
    const take = 20;
    const skip = take * pageno;
    const allrooms = yield db_server_1.prisma.room.count();
    if (skip >= allrooms)
        return [];
    else {
        const rooms = yield db_server_1.prisma.room.findMany({
            take: take,
            skip: skip,
            where: {
                NOT: {
                    members: {
                        some: {
                            id: userid,
                        },
                    },
                },
            },
            select: {
                name: true,
                id: true,
            },
        });
        return rooms;
    }
});
exports.getAllRooms = getAllRooms;
const deleteTables = (names) => __awaiter(void 0, void 0, void 0, function* () {
    let rowsAffected = 0;
    if (Array.isArray(names)) {
        names.forEach((name) => __awaiter(void 0, void 0, void 0, function* () {
            rowsAffected += yield db_server_1.prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
        }));
    }
    else
        rowsAffected += yield db_server_1.prisma.$executeRawUnsafe(`DELETE FROM "${names}"`);
    return rowsAffected;
});
exports.deleteTables = deleteTables;
// Exclude keys from user
function exclude(object, keys) {
    for (let key of keys) {
        delete object[key];
    }
    return object;
}
