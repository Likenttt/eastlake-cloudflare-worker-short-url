import * as jwt from "jsonwebtoken";

async function handleLogin(request, linksKV) {
  const { username, password } = await request.json();

  // Implement your authentication logic here, for example:
  if (username === process.env.USERNAME && password === process.env.PASSWORD) {
    // Generate a JWT token
    const expireHour = 24;
    //REMEMBER TO MODIFY THIS
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || "default_secret",
      {
        expiresIn: expireHour + "h",
      }
    );

    // Store the JWT token in the KV namespace
    await LINKS_PRE.put(`jwt:${username}`, token, {
      expirationTtl: 3600 * expireHour,
    });

    // Return the JWT token to the client
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response("Invalid credentials", { status: 401 });
  }
}
async function serveLoginPage() {
  // Assuming login.html is in the same directory as your worker
  const loginPage = await fetch("./pages/login.html");
  const body = await loginPage.text();

  return new Response(body, {
    headers: { "Content-Type": "text/html" },
  });
}

async function serveShortenPage() {
  // Assuming shorten.html is in the same directory as your worker
  const shortenPage = await fetch("./pages/shorten.html");
  const body = await shortenPage.text();

  return new Response(body, {
    headers: { "Content-Type": "text/html" },
  });
}

export async function handleRequest(request) {
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
    const fullURL = await LINKS_PRE.get(path);
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
