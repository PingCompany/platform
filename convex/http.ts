import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/webhooks/workos",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const eventType = body.event;

    switch (eventType) {
      case "user.created":
      case "user.updated": {
        const {
          id,
          email,
          first_name,
          last_name,
          profile_picture_url,
        } = body.data;

        const result = await ctx.runMutation(api.users.createOrUpdate, {
          workosUserId: id,
          email: email ?? "",
          name: [first_name, last_name].filter(Boolean).join(" ") || "User",
          avatarUrl: profile_picture_url ?? undefined,
        });

        if (result.isNew) {
          await ctx.runAction(internal.workos.createOrganization, {
            workspaceId: result.workspaceId,
            name: result.workspaceName,
          });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Gmail Push Notifications (Pub/Sub webhook)
// Google sends POST with { message: { data: base64({ emailAddress, historyId }) } }
http.route({
  path: "/webhooks/gmail-push",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      // Google Pub/Sub wraps the payload in message.data (base64-encoded)
      const messageData = body?.message?.data;
      if (!messageData) {
        return new Response(JSON.stringify({ error: "Missing message data" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const decoded = JSON.parse(atob(messageData));
      const emailAddress: string | undefined = decoded.emailAddress;

      if (!emailAddress) {
        return new Response(JSON.stringify({ error: "Missing emailAddress" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Look up the email account and trigger a sync
      const account = await ctx.runQuery(
        internal.emailSync.getAccountByEmail,
        { emailAddress },
      );

      if (account && account.isActive) {
        if (account.provider === "gmail") {
          await ctx.runAction(api.emailSync.syncGmailAccount, {
            accountId: account._id,
          });
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Always return 200 to acknowledge to Google Pub/Sub (avoid retries)
      return new Response(JSON.stringify({ received: true, error: "Processing failed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
