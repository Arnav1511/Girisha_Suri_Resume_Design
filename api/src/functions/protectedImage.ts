import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { handleProtectedImage } from "../lib/protectedImage";

app.http("protectedImage", {
  route: "protected-image/{projectId}/{assetId}",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    const projectId = request.params.projectId ?? "";
    const assetId = request.params.assetId ?? "";
    const token = request.query.get("token");
    const result = await handleProtectedImage(projectId, assetId, token);
    return {
      status: result.status,
      headers: { "Content-Type": result.contentType, "Cache-Control": "no-store" },
      body: result.body,
    };
  },
});
