import type { FastifyInstance, FastifyPluginOptions } from "fastify";

interface Message {
  _id?: string;
  conversationId: string; // trialId-patientDid
  trialId: string;
  trialName: string;
  patientDid: string;
  senderId: string; // pharma DID or patient DID
  senderType: "pharma" | "patient";
  message: string;
  timestamp: Date;
  read: boolean;
}

interface MessagesRoutesOptions extends FastifyPluginOptions {
  useDatabase?: boolean;
}

export async function messagesRoutes(fastify: FastifyInstance, opts: MessagesRoutesOptions) {
  const useDatabase = !!opts.useDatabase;

  if (!useDatabase) {
    fastify.log.warn("Messages routes disabled - database not configured");
    return;
  }

  const { getDatabase } = await import("../services/database");

  // Send a message
  fastify.post<{
    Body: {
      trialId: string;
      trialName: string;
      patientDid: string;
      senderId: string;
      senderType: "pharma" | "patient";
      message: string;
    };
  }>(
    "/messages/send",
    {
      schema: {
        body: {
          type: "object",
          required: ["trialId", "trialName", "patientDid", "senderId", "senderType", "message"],
          properties: {
            trialId: { type: "string" },
            trialName: { type: "string" },
            patientDid: { type: "string" },
            senderId: { type: "string" },
            senderType: { type: "string", enum: ["pharma", "patient"] },
            message: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { trialId, trialName, patientDid, senderId, senderType, message } = request.body;

      const conversationId = `${trialId}-${patientDid}`;

      const db = getDatabase();
      const messagesCollection = db.collection<Message>("messages");

      const newMessage: Message = {
        conversationId,
        trialId,
        trialName,
        patientDid,
        senderId,
        senderType,
        message,
        timestamp: new Date(),
        read: false,
      };

      await messagesCollection.insertOne(newMessage);

      return {
        success: true,
        message: newMessage,
      };
    },
  );

  // Get messages for a conversation
  fastify.get<{
    Querystring: {
      trialId: string;
      patientDid: string;
    };
  }>(
    "/messages/conversation",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["trialId", "patientDid"],
          properties: {
            trialId: { type: "string" },
            patientDid: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { trialId, patientDid } = request.query;
      const conversationId = `${trialId}-${patientDid}`;

      const db = getDatabase();
      const messagesCollection = db.collection<Message>("messages");

      const messages = await messagesCollection
        .find({ conversationId })
        .sort({ timestamp: 1 })
        .toArray();

      return {
        conversationId,
        trialId,
        patientDid,
        messages,
      };
    },
  );

  // Get all conversations for pharma (grouped by patient)
  fastify.get<{
    Querystring: {
      trialId: string;
    };
  }>(
    "/messages/pharma/conversations",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["trialId"],
          properties: {
            trialId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { trialId } = request.query;

      const db = getDatabase();
      const messagesCollection = db.collection<Message>("messages");

      // Get all unique conversations for this trial
      const conversations = await messagesCollection
        .aggregate([
          { $match: { trialId } },
          {
            $group: {
              _id: "$patientDid",
              trialId: { $first: "$trialId" },
              trialName: { $first: "$trialName" },
              patientDid: { $first: "$patientDid" },
              lastMessage: { $last: "$message" },
              lastMessageTime: { $last: "$timestamp" },
              lastSenderType: { $last: "$senderType" },
              unreadCount: {
                $sum: {
                  $cond: [{ $and: [{ $eq: ["$read", false] }, { $eq: ["$senderType", "patient"] }] }, 1, 0],
                },
              },
            },
          },
          { $sort: { lastMessageTime: -1 } },
        ])
        .toArray();

      return {
        trialId,
        conversations,
      };
    },
  );

  // Get all conversations for patient
  fastify.get<{
    Querystring: {
      patientDid: string;
    };
  }>(
    "/messages/patient/conversations",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["patientDid"],
          properties: {
            patientDid: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { patientDid } = request.query;

      const db = getDatabase();
      const messagesCollection = db.collection<Message>("messages");

      // Get all unique conversations for this patient
      const conversations = await messagesCollection
        .aggregate([
          { $match: { patientDid } },
          {
            $group: {
              _id: "$trialId",
              trialId: { $first: "$trialId" },
              trialName: { $first: "$trialName" },
              patientDid: { $first: "$patientDid" },
              lastMessage: { $last: "$message" },
              lastMessageTime: { $last: "$timestamp" },
              lastSenderType: { $last: "$senderType" },
              unreadCount: {
                $sum: {
                  $cond: [{ $and: [{ $eq: ["$read", false] }, { $eq: ["$senderType", "pharma"] }] }, 1, 0],
                },
              },
            },
          },
          { $sort: { lastMessageTime: -1 } },
        ])
        .toArray();

      return {
        patientDid,
        conversations,
      };
    },
  );

  // Mark messages as read
  fastify.post<{
    Body: {
      trialId: string;
      patientDid: string;
      readerType: "pharma" | "patient";
    };
  }>(
    "/messages/mark-read",
    {
      schema: {
        body: {
          type: "object",
          required: ["trialId", "patientDid", "readerType"],
          properties: {
            trialId: { type: "string" },
            patientDid: { type: "string" },
            readerType: { type: "string", enum: ["pharma", "patient"] },
          },
        },
      },
    },
    async (request, reply) => {
      const { trialId, patientDid, readerType } = request.body;
      const conversationId = `${trialId}-${patientDid}`;

      const db = getDatabase();
      const messagesCollection = db.collection<Message>("messages");

      // Mark all messages from the OTHER party as read
      const senderType = readerType === "pharma" ? "patient" : "pharma";

      await messagesCollection.updateMany(
        {
          conversationId,
          senderType,
          read: false,
        },
        {
          $set: { read: true },
        },
      );

      return { success: true };
    },
  );

  // Get unread count for pharma
  fastify.get<{
    Querystring: {
      trialId?: string;
    };
  }>("/messages/pharma/unread-count", async (request, reply) => {
    const { trialId } = request.query;

    const db = getDatabase();
    const messagesCollection = db.collection<Message>("messages");

    const query: any = {
      senderType: "patient",
      read: false,
    };

    if (trialId) {
      query.trialId = trialId;
    }

    const count = await messagesCollection.countDocuments(query);

    return { unreadCount: count };
  });

  // Get unread count for patient
  fastify.get<{
    Querystring: {
      patientDid: string;
    };
  }>(
    "/messages/patient/unread-count",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["patientDid"],
          properties: {
            patientDid: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { patientDid } = request.query;

      const db = getDatabase();
      const messagesCollection = db.collection<Message>("messages");

      const count = await messagesCollection.countDocuments({
        patientDid,
        senderType: "pharma",
        read: false,
      });

      return { unreadCount: count };
    },
  );
}
