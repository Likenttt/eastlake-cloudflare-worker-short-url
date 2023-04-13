import { KVNamespace } from "@cloudflare/workers-types";
const linksKV = LINKS_PRE as unknown as KVNamespace;

declare const LINKS_PRE: KVNamespace;

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.split("/")[1];

  if (path === "shorten") {
    // Shorten the URL and save the mapping
    // Add your code to handle shortening and saving the URL

    // Return an appropriate response after handling the URL shortening
    // For example, a success message or the shortened URL itself
    return new Response("Short URL created successfully", { status: 200 });
  } else {
    // Redirect the user to the full URL
    const fullURL = await linksKV.get(path);
    if (fullURL) {
      // Update click history
      // Add your code to update the click history

      return Response.redirect(fullURL, 302);
    } else {
      return new Response("URL not found", { status: 404 });
    }
  }

  // Add a default return statement to cover any other cases
  return new Response("Invalid request", { status: 400 });
}
