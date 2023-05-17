import { Message, Prisma, PrismaClient, Room, User } from "@prisma/client";

const prismaClient = new PrismaClient();

const conversationWithMessage = Prisma.validator<Prisma.ConversationArgs>()({
  include: { message: true },
});

export type ConversationWithMessage = Prisma.ConversationGetPayload<
  typeof conversationWithMessage
>;

/* const chatWithMessages = Prisma.validator<Prisma.ChatArgs>()({
  include: { messages: true },
});

type ChatWithMessages = Prisma.ChatGetPayload<typeof chatWithMessages>; */

export const createOrFindRoom = async (room: Room) => {
  try {
    return await prismaClient.room.findUniqueOrThrow({
      where: { name: room.name },
    });
  } catch (e) {
    return await prismaClient.room.create({ data: room });
  }
};

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
  newConversation: any,
  talkerId: number
) => {
  const { message, room } = newConversation;
  const createdConversation = prismaClient.conversation.create({
    data: {
      message: {
        create: {
          text: message.text,
          createdAt: message.createdAt,
          sender: {
            connect: {
              id: message.senderId,
            },
          },
        },
      },
      talker: { connect: { id: talkerId } },
      room: { connect: { id: room.id } },
    },
    include: {
      message: true,
      talker: { select: { name: true, id: true } },
      room: { select: { name: true, id: true } },
    },
  });
  prismaClient.room.update({
    where: { id: room.id },
    data: {
      conversations: {
        connect: [{ id: (await createdConversation).id }],
      },
    },
  });
  return createdConversation;
};

export const agree = async (id: number, newValue: number[]) => {
  return await prismaClient.conversation.update({
    where: { id },
    data: { agree: newValue },
    select: { agree: true },
  });
};

export const disagree = async (id: number, newValue: number[]) => {
  return await prismaClient.conversation.update({
    where: { id },
    data: { disagree: newValue },
    select: { disagree: true },
  });
};

export const getComments = async (id: number) => {
  return await prismaClient.conversation.findUnique({
    where: { id },
    select: {
      comments: {
        include: {
          message: true,
          talker: {select: {name: true, id: true}}
        },
      },
    },
  });
};

export const comment = async (
  conversationId: number,
  userId: number,
  comment: any
) => {
  const { message } = comment;
  const createdComment = prismaClient.conversation.create({
    data: {
      message: {
        create: {
          text: message.text,
          createdAt: message.createdAt,
          sender: {
            connect: {
              id: message.senderId,
            },
          },
        },
      },
      talker: { connect: { id: userId } },
      conversation: { connect: { id: conversationId } },
    },
    include: { message: true, talker: {select: {id: true, name: true}} },
  });
  const up = await prismaClient.conversation.update({
    where: { id: conversationId },
    include: { message: true },
    data: {
      comments: {
        connect: [
          {
            id: (await createdComment).id,
          },
        ],
      },
      commentsCount: {
        increment: 1
      },
    },
  });
  return createdComment;
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
        myrooms: { select: { name: true, id: true } },
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
      messages: {
        create: [
          {
            text: message.text,
            createdAt: message.createdAt,
            sender: { connect: { id: senderId } },
          },
        ],
      },
    },
    create: {
      messages: {
        create: [
          {
            text: message.text,
            createdAt: message.createdAt,
            sender: { connect: { id: senderId } },
          },
        ],
      },
      id,
    },
  });
};

export const findRoom = async (id: number) => {
  try {
    return await prismaClient.room.findUniqueOrThrow({
      where: { id },
    });
  } catch (e) {
    return { error: "Room not found" };
  }
};

export const findRoomWithUsers = async (id: number) => {
  try {
    return await prismaClient.room.findUniqueOrThrow({
      where: {id},
      include: {
        users: {
          select: {
            name: true,
            id: true,
          },
        },
        conversations: {
          include: {
            message: true,
            talker: {
              select: { id: true, name: true },
            },
            room: {
              select: { id: true, name: true },
            },
            comments: {}
          },
          orderBy: { id: "desc" },
        },
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
  return await prismaClient.room.update({
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
  const take = 10;
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
              id: userid,
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
