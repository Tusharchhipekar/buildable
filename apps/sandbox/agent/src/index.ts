import express from "express";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { config } from "./config/config";
const WORKSPACE_DIR = "/workspace";
export const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    message: "Hello from sandbox agent",
    status: "ok",
  });
});

/**
 * @route GET /list-files
 * @description Lists all files in the working directory and its subdirectories. Returns a JSON object with the file paths relative to the working directory. exclude directories like node_modules, .git,dist, etc.
 * - eg. {
 *     "files": [
 *         "file1.txt",
 *         "src/file2.txt",
 *         "src/subdir/file3.txt"
 *     ]
 * }
 */

app.get("/list-files", async (req, res) => {
  const elements = await fs.promises.readdir(WORKSPACE_DIR);

  res.status(200).json({
    message: "Elements of working directory",
    elements,
  });
});

/**
 * @route GET /read-files
 * @description Reads the content of all files requested in the query parameter 'files' and returns their content as a JSON object.
 * - eg. /read-files?files=file1.txt,/src/file2.txt
 */

app.get("/read-files", async (req, res) => {
  const files = req.query.files;

  if (!files) {
    return res.status(400).json({
      message: "No files specified in query parameter",
      status: "error",
    });
  }

  const fileList = (files as string).split(",");

  const results = await Promise.all(
    fileList.map(async (file) => {
      const filePath = path.join(WORKSPACE_DIR, file);
      try {
        const content = await fs.promises.readFile(filePath, "utf-8");
        return {
          [filePath.replace(WORKSPACE_DIR, "")]: content,
        };
      } catch (err: any) {
        return {
          [filePath.replace(WORKSPACE_DIR, "")]:
            `Error reading file: ${err.message}`,
        };
      }
    }),
  );

  res.status(200).json({
    message: "File contents",
    files: results,
  });
});

/**
 * @route PATCH /update-files
 * @description Updates the content of files specified in the request body. The request body should container a property 'updates' with a JSON Array of object, each object should have a 'file' property specifying the file path (relative to the working directory) and a 'content' property specifying the new content for the file.
 */
app.patch("/update-files", async (req, res) => {
  const updates = req.body.updates;

  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({
      message:
        'Invalid request body. Expected a JSON object with an "updates" property containing an array of file updates.',
      status: "error",
    });
  }

  const results = await Promise.all(
    updates.map(async (update) => {
      const { file, content } = update;
      const filePath = path.join(WORKSPACE_DIR, file);
      try {
        console.log(path.dirname(filePath), filePath);

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, content, "utf-8");
        return {
          [filePath]: "File updated successfully",
        };
      } catch (err: any) {
        return {
          [filePath]: `Error updating file: ${err.message}`,
        };
      }
    }),
  );

  res.status(200).json({
    message: "File update results",
    results,
  });
});

/**
 * @route POST /create-files
 * @description Creates new files with the content specified in the request body. The request body should contain a property 'files' with a JSON Array of objects, each object should have a 'file' property specifying the file path (relative to the working directory) and a 'content' property specifying the content for the new file.
 */
app.post("/create-files", async (req, res) => {
  const files = req.body.files;

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({
      message:
        'Invalid request body. Expected a JSON object with a "files" property containing an array of file objects.',
      status: "error",
    });
  }

  const results = await Promise.all(
    files.map(async (fileObj) => {
      const { file, content } = fileObj;
      const filePath = path.join(WORKSPACE_DIR, file);
      try {
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, content, "utf-8");
        return {
          [filePath]: "File created successfully",
        };
      } catch (err: any) {
        return {
          [filePath]: `Error creating file: ${err.message}`,
        };
      }
    }),
  );

  res.status(200).json({
    message: "File creation results",
    results,
  });
});

app.listen(config.AGENT_PORT, () => {
  console.log(`Agent is running on port http://localhost:${config.AGENT_PORT}`);
});
