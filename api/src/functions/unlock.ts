import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { handleUnlock } from "../lib/unlock";

app.http("unlock", {
  route: "unlock",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    const body = await request.json().catch(() => ({}));
    const result = handleUnlock(body as Record<string, unknown>);
    return { status: result.status, jsonBody: result.body };
  },
});
