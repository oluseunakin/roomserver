import {
  Message,
  Prisma,
  PrismaClient,
  Room,
  User,
} from "@prisma/client";

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
    const foundRoom = await prismaClient.room.findUniqueOrThrow({
      where: { name: room.name },
    });
    return foundRoom;
  } catch (e) {
    return await prismaClient.room.create({ data: room });
  }
};

export const createOrFindUser = async (user: User) => {
  try {
    return await prismaClient.user.findUniqueOrThrow({
      where: { name: user.name },
    });
  } catch (e) {
    console.log(e)
    return await prismaClient.user.create({ data: user });
  }
};

export const createConversation = async (
  newConversation: ConversationWithMessage
) => {
  const { message, talkerName, roomName } = newConversation;
  return await prismaClient.conversation.create({
    data: {
      message: { create: { ...message } },
      room: { connect: { name: roomName } },
      talker: { connect: { name: talkerName } },
    },
  });
};

export const updateUserRooms = async (name: string, rooms: Room[]) => {
  await prismaClient.user.update({
    data: { myrooms: { connect: [...rooms] } },
    where: { name },
  });
  return "done";
};

export const findUser = async (username: string) => {
  try {
    return await prismaClient.user.findUniqueOrThrow({
      where: {
        name: username,
      },
      include: { myrooms: { select: { name: true } } },
    });
  } catch (e) {
    return { error: "User not found" };
  }
};

const computeId = (name1: string, name2: string) => {
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

export const findChat = async (sender: string, receiver: string) => {
  const id = computeId(sender, receiver);
  return await prismaClient.chat.findUnique({
    where: { id },
    include: { messages: true },
  });
};

export const setChat = async (chat: {
  message: Message;
  senderName: string;
  receiverName: string;
}) => {
  const { message, senderName, receiverName } = chat;
  const id = computeId(senderName, receiverName);
  await prismaClient.chat.upsert({
    where: { id },
    update: {
      messages: {create: [{...message}]},
    },
    create: {
      messages: {
        create: [{...message}],
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
        users: true,
        conversations: { include: { message: true } },
      },
    });
  } catch (e) {
    return { error: "Room not found" };
  }
};

export const joinRoom = async (name: string, joiner: string) => {
  await prismaClient.user.update({
    where: {
      name: joiner
    }, data: {
      myrooms: {
        connect: [{
          name
        }]
      }
    }
  })
}

export const getAllUsers = async () => {
  return await prismaClient.user.findMany();
};

export const getAllRooms = async () => {
  return await prismaClient.room.findMany();
};
