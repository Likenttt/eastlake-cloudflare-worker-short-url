// @ts-expect-error OpenNext generates this module during `npm run build`.
import nextWorker from "./.open-next/worker.js";
import { consumeClickEvents } from "@/lib/queue";
import type { ClickEvent } from "@/lib/types";

const handler = nextWorker as ExportedHandler<CloudflareEnv>;

export default {
  fetch(request, env, ctx) {
    if (!handler.fetch) {
      return new Response("OpenNext handler is missing fetch()", { status: 500 });
    }

    return handler.fetch(request, env, ctx);
  },

  queue(batch, env) {
    return consumeClickEvents(batch as MessageBatch<ClickEvent>, env);
  },
} satisfies ExportedHandler<CloudflareEnv>;
