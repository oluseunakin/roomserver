import { Message, Prisma, PrismaClient, Room, User } from "@prisma/client";
import { response } from "express";

const prismaClient = new PrismaClient();

const conversationWithMessage = Prisma.validator<Prisma.ConversationArgs>()({
  include: { message: true },
});

export type ConversationWithMessage = Prisma.ConversationGetPayload<
  typeof conversationWithMessage
>;

const chatWithMessages = Prisma.validator<Prisma.ChatArgs>()({
  include: { messages: true },
});

type ChatWithMessages = Prisma.ChatGetPayload<typeof chatWithMessages>;

export const createOrFindRoom = async (room: Room) => {
  try {
    return await prismaClient.room.findUniqueOrThrow({
      where: { name: room.name },
    });
  } catch (e) {
    return await prismaClient.room.create({ data: room });
  }
};

import crypto from "crypto";

export const createOrFindUser = async (user: User) => {
  const id = computeId(user.name, user.password);
  let foundOrCreated;
  user.id = id;
  try {
    foundOrCreated = await prismaClient.user.findUniqueOrThrow({
      where: { id },
      select: { name: true, id: true },
    });
  } catch (e) {
    foundOrCreated = await prismaClient.user.create({
      data: user,
      select: { name: true, id: true },
    });
  }
  return foundOrCreated;
};

export const createConversation = async (
  newConversation: ConversationWithMessage,
  talkerId: number
) => {
  const { message, roomId } = newConversation;
  return await prismaClient.conversation.create({
    data: {
      message: { create: { ...message } },
      room: { connect: { id: roomId } },
      talker: { connect: { id: talkerId } },
    },
  });
};

export const updateUserRooms = async (id: number, rooms: Room[]) => {
  await prismaClient.user.update({
    data: { myrooms: { connect: [...rooms] } },
    where: { id },
  });
  return "done";
};

export const findUser = async (id: number) => {
  try {
    const user = await prismaClient.user.findUniqueOrThrow({
      where: { id },
      select: {
        name: true,
        id: true,
        myrooms: { select: { name: true } },
      },
    });
    return user;
  } catch (e) {
    return { error: "User not found" };
  }
};

const computeId = (name1: string, name2: string) => {
  let key1 = 0,
    key2 = 0;
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

export const findChat = async (sender: number, receiver: number) => {
  const id = sender + receiver;
  return await prismaClient.chat.findUnique({
    where: { id },
    include: { messages: true },
  });
};

export const setChat = async (
  senderId: number,
  receiverId: number,
  message: Message
) => {
  const id = senderId + receiverId;
  await prismaClient.chat.upsert({
    where: { id },
    update: {
      messages: { create: [{ ...message }] },
    },
    create: {
      messages: {
        create: [{ ...message }],
      },
      id,
    },
  });
};

export const findRoom = async (roomname: string) => {
  try {
    return await prismaClient.room.findUniqueOrThrow({
      where: {
        name: roomname,
      },
    });
  } catch (e) {
    return { error: "Room not found" };
  }
};

export const findRoomWithUsers = async (roomname: string) => {
  try {
    return await prismaClient.room.findUniqueOrThrow({
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
  } catch (e) {
    return { error: "Room not found" };
  }
};

export const joinRoom = async (name: string, id: number) => {
  await prismaClient.user.update({
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
  await prismaClient.room.update({
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
};

export const getAllUsers = async () => {
  return await prismaClient.user.findMany();
};

export const getAllRooms = async (pageno: number, userid: number) => {
  const take = 2;
  const skip = take * pageno;
  const allrooms = await prismaClient.room.count();
  if (skip >= allrooms) return { status: "end of data" };
  else {
    const toprooms = await prismaClient.room.findMany({
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
    const others = await prismaClient.room.findMany({
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
};

export const deleteTables = async (names: string | string[]) => {
  let rowsAffected = 0;
  if (Array.isArray(names)) {
    names.forEach(async (name) => {
      rowsAffected += await prismaClient.$executeRawUnsafe(
        `DELETE FROM "${name}"`
      );
    });
  } else
    rowsAffected += await prismaClient.$executeRawUnsafe(
      `DELETE FROM "${names}"`
    );
  return rowsAffected;
};

// Exclude keys from user
function exclude<T, Key extends keyof T>(object: T, keys: Key[]): Omit<T, Key> {
  for (let key of keys) {
    delete object[key];
  }
  return object;
}
