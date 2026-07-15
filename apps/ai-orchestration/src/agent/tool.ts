import axios from "axios";
import { tool } from "ai";
import { z } from "zod";

// Custom per-run data declared via each tool's `contextSchema`, passed in
// via `toolsContext` on generateText/streamText, and read back out inside
// each tool's `execute(input, { context })`.
const sandboxContextSchema = z.object({
  projectId: z.string(),
});

type SandboxContext = z.infer<typeof sandboxContextSchema>;

/**
 * Resolves the sandbox service base URL for the current run and fails fast
 * with a clear error if projectId wasn't provided via toolsContext.
 */
function getSandboxBaseUrl(context: SandboxContext | undefined): string {
  const projectId = context?.projectId;
  if (!projectId) {
    throw new Error(
      "Missing required context: `projectId`. Pass it via `toolsContext: { <toolName>: { projectId } }` on generateText/streamText.",
    );
  }
  return `http://sandbox-service-${projectId}:3000`;
}

function errorMessage(err: unknown): string {
  const anyErr = err as any;
  return anyErr?.response?.data?.message ?? anyErr?.message ?? String(err);
}

export const list_files = tool({
  description:
    "List all the files in the project directory. This is useful for understanding what files are available to work with.",
  inputSchema: z.object({}),
  contextSchema: sandboxContextSchema,
  execute: async (_input, { context }) => {
    console.log("[list_files] listing files...");
    try {
      const baseUrl = getSandboxBaseUrl(context);
      const response = await axios.get(`${baseUrl}/list-files`, {
        timeout: 10_000,
      });

      const files: string[] = response.data?.files ?? [];
      console.log(`[list_files] found ${files.length}: ${files.join(", ")}`);
      return { files };
    } catch (err) {
      const message = errorMessage(err);
      console.error(`[list_files] failed: ${message}`);
      return { error: `Failed to list files: ${message}` };
    }
  },
});

export const read_files = tool({
  description:
    "Read the contents of specified files. This is useful for understanding the content of files that are relevant to the task at hand.",
  inputSchema: z.object({
    files: z
      .array(z.string())
      .describe(
        "The list of absolute file paths to read. These should be files that were listed using the list_files tool or created later.",
      ),
  }),
  contextSchema: sandboxContextSchema,
  execute: async ({ files }, { context }) => {
    console.log(`[read_files] reading: ${files.join(", ")}`);
    try {
      const baseUrl = getSandboxBaseUrl(context);
      // Pass files as a params object so axios handles encoding —
      // avoids breaking on commas, spaces, or other special characters.
      const response = await axios.get(`${baseUrl}/read-files`, {
        params: { files },
        timeout: 10_000,
      });

      console.log("[read_files] done");
      return response.data;
    } catch (err) {
      const message = errorMessage(err);
      console.error(`[read_files] failed: ${message}`);
      return { error: `Failed to read files: ${message}` };
    }
  },
});

export const update_files = tool({
  description:
    "Create or overwrite specified files with new content. To create a new file, pass a file path that doesn't exist yet along with the content to add.",
  inputSchema: z.object({
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
  contextSchema: sandboxContextSchema,
  execute: async ({ files }, { context }) => {
    console.log(
      `[update_files] updating: ${files.map((f) => f.file).join(", ")}`,
    );
    try {
      const baseUrl = getSandboxBaseUrl(context);
      const response = await axios.patch(
        `${baseUrl}/update-files`,
        { updates: files },
        { timeout: 15_000 },
      );

      console.log("[update_files] done");
      return response.data?.results ?? response.data;
    } catch (err) {
      const message = errorMessage(err);
      console.error(`[update_files] failed: ${message}`);
      return { error: `Failed to update files: ${message}` };
    }
  },
});
