export default {
  providers: [
    {
      domain: process.env.WORKOS_ISSUER_URL ?? "https://api.workos.com/",
      applicationID: "convex",
    },
  ],
};
