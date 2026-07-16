import amqplib from "amqplib";
import dotenv from "dotenv";
dotenv.config();

const QUEUE = "auth_notification_queue";

const connection = await amqplib.connect(process.env.RABBITMQ_URL!);

const channel = await connection.createChannel();

await channel.assertQueue(QUEUE, { durable: true });

export async function sendAuthNotification(message: any) {
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
}
