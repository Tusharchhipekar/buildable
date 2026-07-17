import { k8sCoreV1Api } from "./config.js";

export async function createService(sandboxId: string) {
  const serviceManifest = {
    metadata: {
      name: `sandbox-service-${sandboxId}`,
      labels: {
        sandboxId: sandboxId,
      },
    },
    spec: {
      selector: {
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

export async function deleteService(sandboxId: string) {
  try {
    const response = await k8sCoreV1Api.deleteNamespacedService({
      name: `sandbox-service-${sandboxId}`,
      namespace: "default",
    });
    console.log("Service deleted successfully:", response);
  } catch (error) {
    console.log("Error deleting service:", error);
    throw error;
  }
}
