import { KVNamespace } from "@cloudflare/workers-types";
const linksKV = LINKS_PRE as unknown as KVNamespace;

declare const LINKS_PRE: KVNamespace;

async function handleLogin(request: Request): Promise<Response> {
  const { username, password } = (await request.json()) as {
    username: string;
    password: string;
  };

  // Implement your authentication logic here, for example:
  if (username === process.env.USERNAME && password === process.env.PASSWORD) {
    return new Response("Login successful", { status: 200 });
  } else {
    return new Response("Invalid credentials", { status: 401 });
  }
}
async function serveLoginPage(): Promise<Response> {
  // Assuming login.html is in the same directory as your worker
  const loginPage = await fetch("./login.html");
  const body = await loginPage.text();

  return new Response(body, {
    headers: { "Content-Type": "text/html" },
  });
}

async function serveShortenPage(): Promise<Response> {
  // Assuming shorten.html is in the same directory as your worker
  const shortenPage = await fetch("./shorten.html");
  const body = await shortenPage.text();

  return new Response(body, {
    headers: { "Content-Type": "text/html" },
  });
}

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.split("/")[1];

  if (path === "login") {
    if (request.method === "GET") {
      return serveLoginPage();
    } else if (request.method === "POST") {
      return handleLogin(request);
    }
  } else if (path === "shorten") {
    return serveShortenPage();
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
