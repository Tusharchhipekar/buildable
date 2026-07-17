import { k8sCoreV1Api } from "./config.js";
import { V1Volume } from "@kubernetes/client-node";

export async function createPod(sandboxId: string, projectId: any) {
  const podManifest = {
    metadata: {
      name: `sandbox-pod-${sandboxId}`,
      labels: {
        sandboxId: sandboxId,
      },
    },
    spec: {
      volumes: [
        {
          name: "workspace-volume",
          emptyDir: {},
        },
      ],
      initContainers: [
        {
          name: "init-container",
          image: "template",
          imagePullPolicy: "IfNotPresent",
          command: ["sh", "-c", "cp -r /workspace/. /seed/"],
          volumeMounts: [
            {
              name: "workspace-volume",
              mountPath: "/seed",
            },
          ],
        },
      ],
      containers: [
        {
          image: "template",
          imagePullPolicy: "IfNotPresent",
          name: "sandbox-container",
          ports: [
            {
              containerPort: 5173,
              name: "http",
            },
          ],
          resources: {
            limits: {
              cpu: "500m",
              memory: "1Gi",
            },
            requests: {
              cpu: "250m",
              memory: "500Mi",
            },
          },
          volumeMounts: [
            {
              name: "workspace-volume",
              mountPath: "/workspace",
            },
          ],
        },
        {
          image: "agent",
          imagePullPolicy: "IfNotPresent",
          name: "agent-container",
          ports: [
            {
              containerPort: 5000,
              name: "http",
            },
          ],
          resources: {
            limits: {
              cpu: "500m",
              memory: "1Gi",
            },
            requests: {
              cpu: "250m",
              memory: "500Mi",
            },
          },
          volumeMounts: [
            {
              name: "workspace-volume",
              mountPath: "/workspace",
            },
          ],
        },
        {
          image: "sync-agent",
          imagePullPolicy: "IfNotPresent",
          name: "sync-agent-container",
          resources: {
            limits: {
              cpu: "500m",
              memory: "1Gi",
            },
            requests: {
              cpu: "250m",
              memory: "500Mi",
            },
          },
          volumeMounts: [
            {
              name: "workspace-volume",
              mountPath: "/workspace",
            },
          ],
          env: [
            {
              name: "PROJECT_ID",
              value: projectId,
            },
            {
              name: "AWS_ACCESS_KEY_ID",
              valueFrom: {
                secretKeyRef: {
                  name: "aws",
                  key: "AWS_ACCESS_KEY_ID",
                },
              },
            },
            {
              name: "AWS_SECRET_ACCESS_KEY",
              valueFrom: {
                secretKeyRef: {
                  name: "aws",
                  key: "AWS_SECRET_ACCESS_KEY",
                },
              },
            },
            {
              name: "AWS_REGION",
              valueFrom: {
                secretKeyRef: {
                  name: "aws",
                  key: "AWS_REGION",
                },
              },
            },
          ],
        },
      ],
    },
  };

  try {
    const response = await k8sCoreV1Api.createNamespacedPod({
      namespace: "default",
      body: podManifest,
    });
    console.log("Pod created successfully:", response);
    return response;
  } catch (err) {
    console.error("Error creating pod:", err);
    throw err;
  }
}

export async function deletePod(sandboxId: string) {
  try {
    const response = await k8sCoreV1Api.deleteNamespacedPod({
      name: `sandbox-pod-${sandboxId}`,
      namespace: "default",
      body: {
        gracePeriodSeconds: 0,
      },
    });
    console.log("Pod deleted successfully:", response);
  } catch (error) {
    console.log("Error deleting pod:", error);
    throw error;
  }
}
