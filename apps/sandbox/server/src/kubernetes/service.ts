import { k8sCoreV1Api } from "./config.js";

export async function createService(sandboxId: string) {
  const serviceManifest = {
    metadata: {
      name: `sandbox-service-${sandboxId}`,
      labels: {
        app: "sandbox",
        sandboxId: sandboxId,
      },
    },
    spec: {
      selector: {
        app: "sandbox",
        sandboxId: sandboxId,
      },
      ports: [
        {
          name: "http",
          port: 80,
          targetPort: 5173,
          protocol: "TCP",
        },
        {
          name: "agent-http",
          port: 3000,
          targetPort: 3000,
          protocol: "TCP",
        },
      ],
      type: "ClusterIP",
    },
  };

  try {
    const response = await k8sCoreV1Api.createNamespacedService({
      namespace: "default",
      body: serviceManifest,
    });
    console.log("Service created successfully:", response);
    return response;
  } catch (err) {
    console.error("Error creating service:", err);
    throw err;
  }
}
