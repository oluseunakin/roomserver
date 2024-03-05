import { Message, Prisma, Room, User } from "@prisma/client";
import { prisma } from "./db.server";

/* const chatWithMessages = Prisma.validator<Prisma.ChatArgs>()({
  include: { messages: true },
});

type ChatWithMessages = Prisma.ChatGetPayload<typeof chatWithMessages>; */

export const createRoom = async (
  topic: string,
  name: string,
  creatorId: number
) => {
  return await prisma.room.create({
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
};

export const createOrFindUser = async (user: User) => {
  const id = computeId(user.name, user.password);
  let foundOrCreated;
  user.id = id;
  try {
    foundOrCreated = await prisma.user.findUniqueOrThrow({
      where: { id },
      select: { name: true, id: true },
    });
  } catch (e) {
    foundOrCreated = await prisma.user.create({
      data: user,
      select: { name: true, id: true },
    });
  }
  return foundOrCreated;
};

export const createConversation = async (
  talkerId: number,
  roomId: number,
  convo: string,
  media?: string[]
) => {
  return prisma.conversation.create({
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
};

export const agree = async (id: number, agreer: number) => {
  await prisma.conversation.update({
    where: { id },
    data: { agree: { connect: { id: agreer } } },
  });
};

export const disagree = async (id: number, disagreer: number) => {
  await prisma.conversation.update({
    where: { id },
    data: { disagree: { connect: { id: disagreer } } },
  });
};

export const getComments = async (id: number) => {
  return await prisma.conversation.findUnique({
    where: { id },
    select: {
      comments: {
        include: {
          talker: { select: { name: true, id: true } },
        },
      },
    },
  });
};

export const comment = async (
  conversationId: number,
  commentor: number,
  comment: string,
  roomId: number,
  media?: string[]
) => {
  return await prisma.conversation.update({
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
};

export const updateUserRooms = async (id: number, rooms: Room[]) => {
  await prisma.user.update({
    data: { myrooms: { connect: [...rooms] } },
    where: { id },
  });
  return "done";
};

export const findUser = async (id: number) => {
  try {
    return await prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        name: true,
        id: true,
      },
    });
  } catch (e) {
    return { error: "User not found" };
  }
};

export const getMyRooms = async (id: number, count: number, take: number) => {
  const skip = count * take;
  return await prisma.user.findUnique({
    where: { id },
    select: {
      myrooms: {
        take,
        skip,
        orderBy: { id: "desc" },
      },
    },
  });
};

export const getJoinedRooms = async (
  id: number,
  count: number,
  take: number
) => {
  const skip = count * take;
  return await prisma.user.findUnique({
    where: { id },
    select: {
      joinedrooms: {
        take,
        skip,
        orderBy: { id: "desc" },
      },
    },
  });
};

export const computeId = (name1: string, name2: string) => {
  let key1 = 0,
    key2 = 0;
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
  return await prisma.chat.findUnique({
    where: { id },
    include: { messages: true },
  });
};

export const setChat = async (
  senderId: number,
  receiverId: number,
  messages: Message[]
) => {
  const id = senderId + receiverId;
  const chat = await prisma.chat.findUnique({
    where: { id },
    select: { messages: true },
  });
  messages.forEach(async (message, i) => {
    if (chat)
      await prisma.chat.update({
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
      await prisma.chat.create({
        data: {
          id,
          messages: {
            create: {
              text: message.text,
            },
          },
        },
      });
  });
};

export const findRoom = async (id: number) => {
  try {
    return await prisma.room.findUniqueOrThrow({
      where: { id },
      include: { topic: true },
    });
  } catch (e) {
    return { error: "Room not found" };
  }
};

export const findRoomWithConversations = async (id: number, userId: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { joinedrooms: { where: { id } } },
    });
    const isMember = user!.joinedrooms.length > 0;
    const room = await prisma.room.findUniqueOrThrow({
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
  } catch (e) {
    return { error: "Room not found" };
  }
};

export const findRoomUsers = async (
  roomId: number,
  count: number,
  take: number
) => {
  const skip = count * take;
  return await prisma.room.findUnique({
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
};

export const joinRoom = async (roomId: number, userId: number) => {
  await prisma.room.update({
    where: { id: roomId },
    data: { members: { connect: { id: userId } } },
  });
};

export const leaveRoom = async (roomId: number, userId: number) => {
  await prisma.room.update({
    where: { id: roomId },
    data: { members: { disconnect: { id: userId } } },
  });
};

export const getTopics = async () => {
  return await prisma.topic.findMany();
};

export const getAllUsers = async () => {
  return await prisma.user.findMany();
};

export const getAllRooms = async (pageno: number, userid: number) => {
  const take = 20;
  const skip = take * pageno;
  const allrooms = await prisma.room.count();
  if (skip >= allrooms) return [];
  else {
    const rooms = await prisma.room.findMany({
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
};

export const deleteTables = async (names: string | string[]) => {
  let rowsAffected = 0;
  if (Array.isArray(names)) {
    names.forEach(async (name) => {
      rowsAffected += await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
    });
  } else
    rowsAffected += await prisma.$executeRawUnsafe(`DELETE FROM "${names}"`);
  return rowsAffected;
};

// Exclude keys from user
function exclude<T, Key extends keyof T>(object: T, keys: Key[]): Omit<T, Key> {
  for (let key of keys) {
    delete object[key];
  }
  return object;
}
