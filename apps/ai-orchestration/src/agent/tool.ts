import axios from "axios";
import { tool, type ToolRuntime } from "@langchain/core/tools";
import { z } from "zod";
export const sandboxContextSchema = z.object({
  projectId: z.string(),
});

type SandboxContext = z.infer<typeof sandboxContextSchema>;

function getSandboxBaseUrl(
  context: Partial<SandboxContext> | undefined,
): string {
  const projectId = context?.projectId;
  if (!projectId) {
    throw new Error(
      "Missing required context: `projectId`. Pass it via `context: { projectId }` on agent.invoke().",
    );
  }
  return `http://sandbox-service-${projectId}:3000`;
}

function errorMessage(err: unknown): string {
  const anyErr = err as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? String(err);
}

export const list_files = tool(
  async (_input, runtime: ToolRuntime<unknown, SandboxContext>) => {
    console.log("[list_files] listing files...");
    try {
      const baseUrl = getSandboxBaseUrl(runtime.context);
      const response = await axios.get(`${baseUrl}/list-files`, {
        timeout: 10_000,
      });

      const files: string[] = response.data?.files ?? [];
      console.log(`[list_files] found ${files.length}: ${files.join(", ")}`);
      return JSON.stringify({ files });
    } catch (err) {
      const message = errorMessage(err);
      console.error(`[list_files] failed: ${message}`);
      return JSON.stringify({ error: `Failed to list files: ${message}` });
    }
  },
  {
    name: "list_files",
    description:
      "List all the files in the project directory. This is useful for understanding what files are available to work with.",
    schema: z.object({}),
  },
);

export const read_files = tool(
  async (
    { files }: { files: string[] },
    runtime: ToolRuntime<unknown, SandboxContext>,
  ) => {
    console.log(`[read_files] reading: ${files.join(", ")}`);
    try {
      const baseUrl = getSandboxBaseUrl(runtime.context);
      const response = await axios.get(`${baseUrl}/read-files`, {
        params: { files: files.join(",") },
        timeout: 10_000,
      });

      console.log("[read_files] done");
      return JSON.stringify(response.data);
    } catch (err) {
      const message = errorMessage(err);
      console.error(`[read_files] failed: ${message}`);
      return JSON.stringify({ error: `Failed to read files: ${message}` });
    }
  },
  {
    name: "read_files",
    description:
      "Read the contents of specified files. This is useful for understanding the content of files that are relevant to the task at hand.",
    schema: z.object({
      files: z
        .array(z.string())
        .describe(
          "The list of absolute file paths to read. These should be files that were listed using the list_files tool or created later.",
        ),
    }),
  },
);

export const update_files = tool(
  async (
    { files }: { files: { file: string; content: string }[] },
    runtime: ToolRuntime<unknown, SandboxContext>,
  ) => {
    console.log(
      `[update_files] updating: ${files.map((f) => f.file).join(", ")}`,
    );
    try {
      const baseUrl = getSandboxBaseUrl(runtime.context);
      const response = await axios.patch(
        `${baseUrl}/update-files`,
        { updates: files },
        { timeout: 15_000 },
      );

      console.log("[update_files] done");
      return JSON.stringify(response.data?.results ?? response.data);
    } catch (err) {
      const message = errorMessage(err);
      console.error(`[update_files] failed: ${message}`);
      return JSON.stringify({ error: `Failed to update files: ${message}` });
    }
  },
  {
    name: "update_files",
    description:
      "Create or overwrite specified files with new content. To create a new file, pass a file path that doesn't exist yet along with the content to add.",
    schema: z.object({
      files: z
        .array(
          z.object({
            file: z
              .string()
              .describe("The absolute path of the file to create or update"),
            content: z
              .string()
              .describe("The full new content for the file, as a string."),
          }),
        )
        .describe(
          "The list of files to create or update, with their new contents",
        ),
    }),
  },
);
