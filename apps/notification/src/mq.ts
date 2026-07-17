import amqplib from "amqplib";
import dotenv from "dotenv";
import { config } from "./config/config";
dotenv.config();

const QUEUE = "auth_notification_queue";

const connection = await amqplib.connect(config.RABBITMQ_URL);

const channel = await connection.createChannel();

await channel.assertQueue(QUEUE, { durable: true });

export default channel;
