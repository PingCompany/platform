import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/webhooks/workos",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    const body = await request.json();
    const eventType = body.event;

    // TODO: Verify webhook signature with WorkOS secret
    // TODO: Wire up internal mutations once convex codegen is available

    switch (eventType) {
      case "user.created":
      case "user.updated": {
        const { email, first_name, last_name, profile_picture_url } = body.data;
        console.log("WorkOS user event", {
          eventType,
          email,
          name: `${first_name} ${last_name}`,
          avatarUrl: profile_picture_url,
        });
        break;
      }
      case "dsync.user.created":
      case "dsync.user.deleted":
        console.log("WorkOS directory sync event", { eventType });
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
