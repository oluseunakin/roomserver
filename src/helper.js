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
exports.getAllRooms = exports.getAllUsers = exports.joinRoom = exports.findRoomWithUsers = exports.findRoom = exports.setChat = exports.findChat = exports.findUser = exports.updateUserRooms = exports.createConversation = exports.createOrFindUser = exports.createOrFindRoom = void 0;
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
        const foundRoom = yield prismaClient.room.findUniqueOrThrow({
            where: { name: room.name },
        });
        return foundRoom;
    }
    catch (e) {
        return yield prismaClient.room.create({ data: room });
    }
});
exports.createOrFindRoom = createOrFindRoom;
const createOrFindUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield prismaClient.user.findUniqueOrThrow({
            where: { name: user.name },
        });
    }
    catch (e) {
        return yield prismaClient.user.create({ data: user });
    }
});
exports.createOrFindUser = createOrFindUser;
const createConversation = (newConversation) => __awaiter(void 0, void 0, void 0, function* () {
    const { message, talkerName, roomName } = newConversation;
    return yield prismaClient.conversation.create({
        data: {
            message: { create: Object.assign({}, message) },
            room: { connect: { name: roomName } },
            talker: { connect: { name: talkerName } },
        },
    });
});
exports.createConversation = createConversation;
const updateUserRooms = (name, rooms) => __awaiter(void 0, void 0, void 0, function* () {
    yield prismaClient.user.update({
        data: { myrooms: { connect: [...rooms] } },
        where: { name },
    });
    return "done";
});
exports.updateUserRooms = updateUserRooms;
const findUser = (username) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prismaClient.user.findUniqueOrThrow({
            where: {
                name: username,
            },
            include: { myrooms: { select: { name: true } } },
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
    for (let i = 0; i < name1.length; i++) {
        key1 += name1.charCodeAt(i);
    }
    for (let i = 0; i < name2.length; i++) {
        key2 += name2.charCodeAt(i);
    }
    return key1 + key2;
};
const findChat = (sender, receiver) => __awaiter(void 0, void 0, void 0, function* () {
    const id = computeId(sender, receiver);
    return yield prismaClient.chat.findUnique({
        where: { id },
        include: { messages: true },
    });
});
exports.findChat = findChat;
const setChat = (chat) => __awaiter(void 0, void 0, void 0, function* () {
    const { message, senderName, receiverName } = chat;
    const id = computeId(senderName, receiverName);
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
                users: true,
                conversations: { include: { message: true } },
            },
        });
    }
    catch (e) {
        return { error: "Room not found" };
    }
});
exports.findRoomWithUsers = findRoomWithUsers;
const joinRoom = (name, joiner) => __awaiter(void 0, void 0, void 0, function* () {
    yield prismaClient.user.update({
        where: {
            name: joiner,
        },
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
        data: { users: { connect: [{ name: joiner }] } },
    });
});
exports.joinRoom = joinRoom;
const getAllUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield prismaClient.user.findMany();
});
exports.getAllUsers = getAllUsers;
const getAllRooms = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield prismaClient.room.findMany();
});
exports.getAllRooms = getAllRooms;
