import "dotenv/config";
import chokidar from "chokidar";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  type _Object as S3Object,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { config } from "./config/config";

const s3Client = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

const projectId: string | undefined = process.env.PROJECT_ID;
const bucketName: string = "buildable-bucket";
const localDirectory: string = "/workspace";

async function checkS3ForFiles(): Promise<S3Object[]> {
  console.log(`Checking S3 for existing files in project: ${projectId}`);
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: `${projectId}/`,
  });
  const listResponse = await s3Client.send(listCommand);
  return listResponse.Contents ?? [];
}

async function downloadFilesFromS3(s3Objects: S3Object[]): Promise<void> {
  console.log("Found existing files in S3. Syncing to local directory...");
  for (const file of s3Objects) {
    if (!file.Key || file.Key.endsWith("/")) continue;

    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: file.Key,
    });
    const getResponse = await s3Client.send(getCommand);

    const relativePath: string = file.Key.replace(`${projectId}/`, "");
    const localFilePath: string = path.join(localDirectory, relativePath);

    // Ensure the local directory structure exists
    fs.mkdirSync(path.dirname(localFilePath), { recursive: true });

    const writeStream = fs.createWriteStream(localFilePath);
    (getResponse.Body as NodeJS.ReadableStream).pipe(writeStream);

    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => resolve());
      writeStream.on("error", reject);
    });

    console.log(`Downloaded ${file.Key} to ${localFilePath}`);
  }
}

async function uploadFileToS3(filePath: string): Promise<void> {
  try {
    if (filePath.includes("node_modules") || filePath.includes(".env")) {
      return; // Skip syncing node_modules and .env files
    }

    const fileContent: Buffer = fs.readFileSync(filePath);
    const relativePath: string = path.relative(localDirectory, filePath);

    console.log(filePath);
    // Files will have the prefix of projectId
    const s3Key: string = `${projectId}/${relativePath}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
    });

    await s3Client.send(command);
    console.log(
      `Successfully synced ${filePath} to s3://${bucketName}/${s3Key}`,
    );
  } catch (err) {
    console.error(`Error syncing ${filePath} to S3:`, err);
  }
}

function startWatcher(hasFiles: boolean): void {
  console.log("Starting chokidar watch...");
  chokidar
    .watch(localDirectory, {
      ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        /node_modules/, // ignore node_modules completely
        /\.env/, // ignore .env files
      ],
      persistent: true,
      ignoreInitial: hasFiles, // if S3 is empty (hasFiles is false), upload all existing local files
    })
    .on("all", async (event: string, filePath: string) => {
      if (event === "add" || event === "change") {
        if (filePath.includes("node_modules") || filePath.includes(".env")) {
          return; // Skip syncing node_modules and .env files
        }
        await uploadFileToS3(filePath);
      }
    });
}

async function init(): Promise<void> {
  try {
    const s3Objects: S3Object[] = await checkS3ForFiles();
    const hasFiles: boolean = s3Objects.length > 0;

    if (hasFiles) {
      await downloadFilesFromS3(s3Objects);
    } else {
      console.log(
        "No files found in S3. Local files will be synced to S3 automatically.",
      );
    }

    startWatcher(hasFiles);
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}

init();
