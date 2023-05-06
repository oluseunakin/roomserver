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
exports.deleteTables = exports.getAllRooms = exports.getAllUsers = exports.joinRoom = exports.findRoomWithUsers = exports.findRoom = exports.setChat = exports.findChat = exports.findUser = exports.updateUserRooms = exports.createConversation = exports.createOrFindUser = exports.createOrFindRoom = void 0;
const client_1 = require("@prisma/client");
const prismaClient = new client_1.PrismaClient();
const conversationWithMessage = client_1.Prisma.validator()({
    include: { message: true },
});
const chatWithMessages = client_1.Prisma.validator()({
    include: { messages: true },
});
const createOrFindRoom = (room) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield prismaClient.room.findUniqueOrThrow({
            where: { name: room.name },
        });
    }
    catch (e) {
        return yield prismaClient.room.create({ data: room });
    }
});
exports.createOrFindRoom = createOrFindRoom;
const createOrFindUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const id = computeId(user.name, user.password);
    let foundOrCreated;
    user.id = id;
    try {
        foundOrCreated = yield prismaClient.user.findUniqueOrThrow({
            where: { id },
            select: { name: true, id: true },
        });
    }
    catch (e) {
        foundOrCreated = yield prismaClient.user.create({
            data: user,
            select: { name: true, id: true },
        });
    }
    return foundOrCreated;
});
exports.createOrFindUser = createOrFindUser;
const createConversation = (newConversation, talkerId) => __awaiter(void 0, void 0, void 0, function* () {
    const { message, roomId } = newConversation;
    return yield prismaClient.conversation.create({
        data: {
            message: { create: Object.assign({}, message) },
            room: { connect: { id: roomId } },
            talker: { connect: { id: talkerId } },
        },
    });
});
exports.createConversation = createConversation;
const updateUserRooms = (id, rooms) => __awaiter(void 0, void 0, void 0, function* () {
    yield prismaClient.user.update({
        data: { myrooms: { connect: [...rooms] } },
        where: { id },
    });
    return "done";
});
exports.updateUserRooms = updateUserRooms;
const findUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prismaClient.user.findUniqueOrThrow({
            where: { id },
            select: {
                name: true,
                id: true,
                myrooms: { select: { name: true } },
            },
        });
        return user;
    }
    catch (e) {
        return { error: "User not found" };
    }
});
exports.findUser = findUser;
const computeId = (name1, name2) => {
    let key1 = 0, key2 = 0;
    //const hash1 = crypto.createHash('md5').update(name1).digest('hex')
    //const hash2 = crypto.createHash('md5').update(name2).digest('hex')
    for (let i = 0; i < name1.length; i++) {
        key1 += name1.charCodeAt(i);
    }
    for (let i = 0; i < name2.length; i++) {
        key2 += name2.charCodeAt(i);
    }
    return key1 + key2;
};
const findChat = (sender, receiver) => __awaiter(void 0, void 0, void 0, function* () {
    const id = sender + receiver;
    return yield prismaClient.chat.findUnique({
        where: { id },
        include: { messages: true },
    });
});
exports.findChat = findChat;
const setChat = (senderId, receiverId, message) => __awaiter(void 0, void 0, void 0, function* () {
    const id = senderId + receiverId;
    yield prismaClient.chat.upsert({
        where: { id },
        update: {
            messages: { create: [Object.assign({}, message)] },
        },
        create: {
            messages: {
                create: [Object.assign({}, message)],
            },
            id,
        },
    });
});
exports.setChat = setChat;
const findRoom = (roomname) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield prismaClient.room.findUniqueOrThrow({
            where: {
                name: roomname,
            },
        });
    }
    catch (e) {
        return { error: "Room not found" };
    }
});
exports.findRoom = findRoom;
const findRoomWithUsers = (roomname) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield prismaClient.room.findUniqueOrThrow({
            where: {
                name: roomname,
            },
            include: {
                users: {
                    select: {
                        name: true, id: true
                    }
                },
                conversations: { include: { message: true } },
            },
        });
    }
    catch (e) {
        return { error: "Room not found" };
    }
});
exports.findRoomWithUsers = findRoomWithUsers;
const joinRoom = (name, id) => __awaiter(void 0, void 0, void 0, function* () {
    yield prismaClient.user.update({
        where: { id },
        data: {
            myrooms: {
                connect: [
                    {
                        name,
                    },
                ],
            },
        },
    });
    yield prismaClient.room.update({
        where: {
            name,
        },
        data: {
            users: { connect: [{ id }] },
            usercount: {
                increment: 1,
            },
        },
    });
});
exports.joinRoom = joinRoom;
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield prismaClient.user.findMany();
});
exports.getAllUsers = getAllUsers;
const getAllRooms = (pageno, userid) => __awaiter(void 0, void 0, void 0, function* () {
    const take = 2;
    const skip = take * pageno;
    const allrooms = yield prismaClient.room.count();
    if (skip >= allrooms)
        return { status: "end of data" };
    else {
        const toprooms = yield prismaClient.room.findMany({
            orderBy: {
                usercount: "desc",
            },
            take: take,
            skip: skip,
            where: {
                NOT: {
                    users: {
                        some: {
                            id: userid,
                        },
                    },
                },
            },
        });
        const others = yield prismaClient.room.findMany({
            take: take,
            skip: skip,
            orderBy: { usercount: "asc" },
            where: {
                NOT: {
                    users: {
                        some: {
                            name: "Oluseun",
                        },
                    },
                },
            },
        });
        return { toprooms, others };
    }
});
exports.getAllRooms = getAllRooms;
const deleteTables = (names) => __awaiter(void 0, void 0, void 0, function* () {
    let rowsAffected = 0;
    if (Array.isArray(names)) {
        names.forEach((name) => __awaiter(void 0, void 0, void 0, function* () {
            rowsAffected += yield prismaClient.$executeRawUnsafe(`DELETE FROM "${name}"`);
        }));
    }
    else
        rowsAffected += yield prismaClient.$executeRawUnsafe(`DELETE FROM "${names}"`);
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
