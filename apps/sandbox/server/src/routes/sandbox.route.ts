import { Router } from "express";
import { createPod } from "../kubernetes/pod.js";
import { createService } from "../kubernetes/service.js";
import { createSandboxKey } from "../config/redis";
import { v7 as uuid } from "uuid";
import { authMiddleware } from "../middleware/auth.middleware";
import { projectModel } from "@repo/mongodb";
import type { Request, Response } from "express";
import ts from "typescript";

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

  // Verify that the project belongs to the authenticated user
  const project = await projectModel.findOne({
    _id: projectId,
    user: (req as any).user.id,
  });

  if (!project) {
    return res
      .status(404)
      .json({ message: "Project not found or access denied" });
  }

  const sandboxId = uuid();

  await Promise.all([
    // @ts-ignore
    createPod(sandboxId, projectId),
    createService(sandboxId),
    createSandboxKey(sandboxId),
  ]);

  return res.status(201).json({
    message: "Sandbox environment created successfully",
    sandboxId,
    previewUrl: `https://${sandboxId}.preview.cryboy.in`,
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
