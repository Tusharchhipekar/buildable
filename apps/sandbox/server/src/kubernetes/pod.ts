import { k8sCoreV1Api } from "./config.js";

export async function createPod(sandboxId: string) {
  const podManifest = {
    metadata: {
      name: `sandbox-pod-${sandboxId}`,
      labels: {
        app: "sandbox",
        sandboxId: sandboxId,
      },
    },
    spec: {
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
