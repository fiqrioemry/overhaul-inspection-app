import { Hono } from "hono";
import { swaggerConfig } from "@/lib/swagger";
import { authSchemas, authPaths } from "@/modules/auth/auth.swagger";
import { postPaths, postSchemas } from "@/modules/posts/posts.swagger";
import { userPaths, userSchemas } from "@/modules/users/user.swagger";
import { notificationPaths, notificationSchemas } from "@/modules/notifications/notification.swagger";
import { commentPaths, commentSchemas } from "@/modules/comments/comment.swagger";
import { chatPaths, chatSchemas } from "@/modules/chats/chat.swagger";

const docs = new Hono();

// merge all module schemas and paths into one OpenAPI spec
const spec = {
  ...swaggerConfig,
  components: {
    ...swaggerConfig.components,
    schemas: {
      ...swaggerConfig.components.schemas,
      ...authSchemas,
      ...postSchemas,
      ...userSchemas,
      ...commentSchemas,
      ...chatSchemas,
      ...notificationSchemas,
    },
  },
  paths: {
    ...authPaths,
    ...postPaths, // create export postPaths in posts.swagger.ts which contains paths for all post endpoints
    ...userPaths,
    ...commentPaths,
    ...chatPaths,
    ...notificationPaths,
    // add other modules here: ...userPaths, ...postPaths
  },
};

// Serve raw OpenAPI JSON spec
docs.get("/openapi.json", (c) => c.json(spec));

// Serve Swagger UI (via CDN, tanpa install package tambahan)
docs.get("/", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${swaggerConfig.info.title} — Docs</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.js"></script>
    <script>
      SwaggerUIBundle({
        url: "/docs/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        tryItOutEnabled: true,
      });
    </script>
  </body>
</html>`);
});

export default docs;
