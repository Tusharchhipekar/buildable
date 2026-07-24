import { Router } from "express";
import { createPod, deletePod } from "../kubernetes/pod.js";
import { createService, deleteService } from "../kubernetes/service.js";
import { createSandboxKey } from "../config/redis";
import { authMiddleware } from "../middleware/auth.middleware";
import { projectModel } from "@repo/mongodb";
import type { Request, Response } from "express";

const router = Router();

router.post("/project", authMiddleware, async (req: Request, res: Response) => {
  const { title } = req.body;

  const newProject = new projectModel({
    user: (req as any).user.id,
    title,
  });

  await newProject.save();

  return res.status(201).json({
    message: "Project created successfully",
    project: newProject,
  });
});

router.post("/start", authMiddleware, async (req, res) => {
  const projectId = req.body.projectId;

  const project = await projectModel.findOne({
    _id: projectId,
    user: (req as any).user.id,
  });

  if (!project) {
    return res
      .status(404)
      .json({ message: "Project not found or access denied" });
  }

  const sandboxId = projectId;

  try {
    await Promise.all([
      createPod(sandboxId, projectId),
      createService(sandboxId),
      createSandboxKey(sandboxId),
    ]);
  } catch (err) {
    console.error("Failed to create sandbox, rolling back:", err);
    await Promise.allSettled([deletePod(sandboxId), deleteService(sandboxId)]);
    return res
      .status(500)
      .json({ message: "Failed to create sandbox environment" });
  }

  return res.status(201).json({
    message: "Sandbox environment created successfully",
    sandboxId,
    previewUrl: `http://${sandboxId}.preview.localhost`,
  });
});

router.get("/project", authMiddleware, async (req, res) => {
  const projects = await projectModel.find({ user: (req as any).user.id });

  return res.status(200).json({
    message: "Projects retrieved successfully",
    projects,
  });
});

export default router;
