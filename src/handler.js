import * as jwt from "jsonwebtoken";
import { loginHtml, shortenHtml } from "./htmls";
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
    await linksKV.put(`jwt:${username}`, token, {
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

function isValidToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return true;
  } catch (err) {
    return false;
  }
}

function getCookie(name) {
  const value = `; ${request.headers.get("Cookie")}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
}

async function handleShortenRequest(request) {
  const token = getCookie("jwt");

  if (!isValidToken(token)) {
    return new Response(loginHtml, {
      headers: { "Content-Type": "text/html" },
      status: 400,
    });
  }
  // Get the parameters from the request
  const params = await request.json();

  const url = new URL(params.url);
  const path = url.pathname.substring(1); // remove leading slash

  // Check if the path is already in use
  if (path === "shorten" || path === "login" || path === "links") {
    return new Response("Invalid path because of conflict!", { status: 400 });
  }

  // Check if the short URL key already exists
  let key = path;
  let value = await linksKV.get(key);
  while (value !== null) {
    key = generateRandomKey();
    value = await linksKV.get(key);
  }

  // Store the parameters in KV
  const data = {
    expirationTime: params.expirationTime,
    requirePassword: params.requirePassword,
    password: params.password,
    longUrl: params.longUrl,
  };

  await linksKV.put(key, JSON.stringify(data));

  return new Response(key, { status: 200 });
}
function getFullDomain(request) {
  const url = new URL(request.url);
  const protocol = url.protocol;
  const domain = url.hostname;
  const fullDomain = protocol + "//" + domain;
  return fullDomain;
}

export async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname.split("/")[1];

  if (!path || path === "login") {
    if (request.method === "GET") {
      return new Response(loginHtml, {
        headers: { "Content-Type": "text/html" },
      });
    } else if (request.method === "POST") {
      return handleLogin(request, LINKS);
    }
  } else if (path === "shorten") {
    if (request.method === "GET") {
      return new Response(shortenHtml, {
        headers: { "Content-Type": "text/html" },
      });
    } else if (request.method === "POST") {
      return handleShortenRequest(request);
    }
  } else {
    // Redirect the user to the full URL
    const fullURL = await LINKS.get(path);
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
