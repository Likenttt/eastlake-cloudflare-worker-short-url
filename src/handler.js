import jwt from "@tsndr/cloudflare-worker-jwt";
import { parse } from "cookie";

const invalidPaths = [
  "shorten",
  "login",
  "del",
  "edit",
  "links",
  "admin",
  "dashboard",
  "settings",
];
async function handleLogin(request) {
  const { username, password } = await request.json();
  let response;

  // Implement your authentication logic here, for example:
  if (username === USERNAME && password === PASSWORD) {
    // Generate a JWT token
    const expireHour = 24;
    //REMEMBER TO MODIFY THIS
    console.log(`JWT_SECRET is: ${JWT_SECRET}`);
    const expireTime = Math.floor(Date.now() / 1000) + expireHour * (60 * 60);
    // Creating a token
    const token = await jwt.sign(
      {
        username: username,
        exp: expireTime,
      },
      JWT_SECRET
    );

    // Store the JWT token in the KV namespace
    await LINKS.put(`jwt:${username}`, token, {
      expirationTtl: 60 * 60 * expireHour,
    });

    // Return the JWT token to the client
    response = new Response(JSON.stringify({ token, exp: expireTime }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    response = new Response("Invalid credentials", { status: 401 });
  }
  return response;
}

function generateRandomKey(length) {
  const characters =
    "23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude similar looking characters, include uppercase letters
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function generateUniqueKey() {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 12);
  return `${timestamp}${randomString}`;
}
function formatExpirationTime(expirationTime) {
  const now = new Date();
  const expirationDate = new Date(now.getTime() + expirationTime * 60 * 1000);
  return expirationDate.getTime();
}

async function handleShortenRequest(request) {
  // Get the parameters from the request
  const params = await request.json();
  const token = params.jwt;
  console.log(`token is:${token}`);
  const isValid = await jwt.verify(token, JWT_SECRET);
  if (!isValid) {
    return new Response("Invalid credentials! Need Login", { status: 401 });
  }
  const length = params.shortUrlLength;
  let response;

  let key;
  const url = params.shortUrl;

  if (url === null || url === "") {
    console.log("url is empty");
    key = generateRandomKey(length);
    let value = await LINKS.get(key);
    while (value !== null) {
      key = generateRandomKey(length);
      value = await LINKS.get(key);
    }
    key = `url:${key}`;
  } else {
    console.log("url is not empty");

    // Check if the path is already in use
    if (invalidPaths.includes(url)) {
      response = new Response("Invalid path because of conflict!", {
        status: 400,
      });
      return response;
    }
    key = `url:${url}`;
    const value = await LINKS.get(key);
    if (value !== null && JSON.parse(value).longUrl !== params.longUrl) {
      const response = new Response("The shortUrl has been used!", {
        status: 400,
      });
      return response;
    }
    const oldShortUrl = params.oldShortUrl;
    const oldUrlKey = `url:${oldShortUrl}`;
    const oldUrlValue = await LINKS.get(oldUrlKey);
    if (url !== oldShortUrl && oldUrlValue !== null) {
      await LINKS.delete(oldUrlKey);
    }
  }

  const expirationTime = params.expirationTime;

  // Store the parameters in KV
  const data = {
    expirationTime:
      expirationTime === 0 ? 0 : formatExpirationTime(expirationTime),
    requirePassword: params.requirePassword,
    password: params.password,
    shortUrlLength: length,
    longUrl: params.longUrl,
    id: params.id || generateUniqueKey(),
  };
  if (expirationTime === 0) {
    await LINKS.put(key, JSON.stringify(data));
  } else {
    await LINKS.put(key, JSON.stringify(data), {
      expirationTtl: expirationTime * 60 * 1000,
    });
  }
  const result = {
    status: 200,
    shortUrl: key.split(":")[1],
    ...data,
  };
  response = new Response(JSON.stringify(result), { status: 200 });
  return response;
}

const CLICKS_NAMESPACE = "clicks";

async function storeClickRecord(
  shortUrl,
  timestamp,
  country,
  referrer,
  userAgent
) {
  const clickRecord = {
    timestamp: timestamp,
    country: country,
    referrer: referrer,
    userAgent: userAgent,
  };
  await LINKS.put(
    CLICKS_NAMESPACE + ":" + shortUrl,
    JSON.stringify(clickRecord)
  );

  // Update daily key
  const dateStr = new Date(timestamp * 1000).toISOString().slice(0, 10);
  await updateAggregateClickRecord(dateStr, shortUrl, clickRecord);

  // Update monthly key
  const monthStr = new Date(timestamp * 1000).toISOString().slice(0, 7);
  await updateAggregateClickRecord(monthStr, shortUrl, clickRecord);

  // Update yearly key
  const yearStr = new Date(timestamp * 1000).toISOString().slice(0, 4);
  await updateAggregateClickRecord(yearStr, shortUrl, clickRecord);
}

async function updateAggregateClickRecord(dateStr, shortUrl, clickRecord) {
  const aggregateKey = CLICKS_NAMESPACE + ":" + dateStr;
  const value = await LINKS.get(aggregateKey);
  if (value) {
    const aggregateRecord = JSON.parse(value);
    if (aggregateRecord[shortUrl]) {
      aggregateRecord[shortUrl].count += 1;
      aggregateRecord[shortUrl].clicks.push(clickRecord);
    } else {
      aggregateRecord[shortUrl] = {
        count: 1,
        clicks: [clickRecord],
      };
    }
    await LINKS.put(aggregateKey, JSON.stringify(aggregateRecord));
  } else {
    const aggregateRecord = {};
    aggregateRecord[shortUrl] = {
      count: 1,
      clicks: [clickRecord],
    };
    await LINKS.put(aggregateKey, JSON.stringify(aggregateRecord));
  }
}

async function getClickRecords(shortUrl) {
  const value = await LINKS.get(CLICKS_NAMESPACE + shortUrl);
  if (value === null) {
    return [];
  } else {
    return JSON.parse(value);
  }
}
async function addClickRecord(shortUrl, timestamp) {
  const date = new Date(timestamp);
  const dayKey = `${shortUrl}:${date.getUTCFullYear()}-${
    date.getUTCMonth() + 1
  }-${date.getUTCDate()}`;
  const monthKey = `${shortUrl}:${date.getUTCFullYear()}-${
    date.getUTCMonth() + 1
  }`;
  const yearKey = `${shortUrl}:${date.getUTCFullYear()}`;

  const dayValue = await LINKS.get(CLICKS_NAMESPACE + dayKey);
  const dayRecords = dayValue === null ? [] : JSON.parse(dayValue);
  dayRecords.push(timestamp);
  await LINKS.put(CLICKS_NAMESPACE + dayKey, JSON.stringify(dayRecords), {});

  const monthValue = await LINKS.get(CLICKS_NAMESPACE + monthKey);
  const monthRecords = monthValue === null ? [] : JSON.parse(monthValue);
  monthRecords.push(timestamp);
  await LINKS.put(
    CLICKS_NAMESPACE + monthKey,
    JSON.stringify(monthRecords),
    {}
  );

  const yearValue = await LINKS.get(CLICKS_NAMESPACE + yearKey);
  const yearRecords = yearValue === null ? [] : JSON.parse(yearValue);
  yearRecords.push(timestamp);
  await LINKS.put(CLICKS_NAMESPACE + yearKey, JSON.stringify(yearRecords), {});
}
function generatePasswordPage() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Password Protected URL</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f3f4f6;
          }
          form {
            background-color: #fff;
            padding: 2rem;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 300px;
          }
          h1 {
            margin-bottom: 1rem;
            font-size: 1rem;
          }
          label {
            display: block;
            margin-bottom: 0.5rem;
          }
          .input-container {
            position: relative;

          }
          input {
            width: 100%;
            padding: 0.5rem;
            padding-right: 30px;
            margin-bottom: 1rem;
            border: 1px solid #ccc;
            border-radius: 3px;
            box-sizing: border-box;
          }


          .toggle-password {
            position: absolute;
            top: 30%;
            right: 10px;
            transform: translateY(-50%);
            cursor: pointer;
          }
          button {
            width: 100%;
            padding: 0.5rem;
            background-color: #3f51b5;
            color: #fff;
            border: none;
            border-radius: 3px;
            cursor: pointer;
          }
          button:hover {
            background-color: #283593;
          }
          footer {
            position: absolute;
            bottom: 1rem;
            text-align: center;
            font-size: 0.8rem;
          }
        </style>
      </head>
      <body>
        <form id="passwordForm">
          <h1>Password Protected URL</h1>
          <label for="password">Enter Password:</label>
          <div class="input-container">
            <input type="password" id="password" name="password" required>
            <span class="toggle-password" onclick="togglePasswordVisibility()">
            &#x1F441;
            </span>
          </div>
          <button type="submit">Submit</button>
        </form>
        <footer>
          Made by <a href="https://blog.li2niu.com" target="_blank" rel="noopener noreferrer">li2niu</a> with love in Wuhan, China
        </footer>
        <script>
          function togglePasswordVisibility() {
            const passwordInput = document.getElementById("password");
            if (passwordInput.type === "password") {
              passwordInput.type = "text";
            } else {
              passwordInput.type = "password";
            }
          }

          document.getElementById("passwordForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const password = document.getElementById("password").value;
            const response = await fetch(window.location.pathname, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password }),
            });

            if (response.status === 200) {
              const { url } = await response.json();
              window.location.href = url;
            } else {
              alert("Incorrect password. Please try again.");
            }
          });
        </script>
      </body>
    </html>
  `;
}

export async function handleRequest(event) {
  const request = event.request;
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path || path === "/api/login") {
    return handleLogin(request);
  } else if (path === "/api/shorten") {
    return handleShortenRequest(request);
  } else if (path === "/api/del") {
    return handleDeleteRequest(request);
  } else if (path === "/api/list") {
    return handleListRequest(request);
  } else if (path === "/api/edit") {
    return handleEditRequest(request);
  } else {
    if (path == "/") {
      console.log("special redirect");
    }
    // Redirect the user to the full URL
    const pathWithoutSlash = path.substring(1);
    const key = `url:${pathWithoutSlash}`;
    console.log(`path is:${key}`);
    let fullURLObj = await LINKS.get(key);
    let response;
    console.log(`path is:${JSON.stringify(fullURLObj)}`);

    if (fullURLObj) {
      fullURLObj = JSON.parse(fullURLObj);
      if (fullURLObj.requirePassword) {
        // If the short URL requires a password, return the password page
        if (request.method === "GET") {
          return new Response(generatePasswordPage(), {
            headers: { "Content-Type": "text/html" },
          });
        } else if (request.method === "POST") {
          const params = await request.json();
          console.log(
            `password:${params.password} and fullURLObj.password ${fullURLObj.password}`
          );
          // Handle password validation and redirection
          if (params.password && params.password === fullURLObj.password) {
            // check if provided password matches
            // event.waitUntil(addClickRecord(path, timestamp)); // Schedule click event recording in the background
            return new Response(JSON.stringify({ url: fullURLObj.longUrl }), {
              headers: { "Content-Type": "application/json" },
            });
          } else {
            return new Response("Incorrect password", { status: 401 });
          }
        }
      } else {
        console.log(`fullURLObj.longUrl is:${fullURLObj.longUrl}`);
        return Response.redirect(fullURLObj.longUrl, 301);
        // event.waitUntil(addClickRecord(path, timestamp)); // Schedule click event recording in the background
      }
    } else {
      return new Response("NOT FOUND!", { status: 404 });
    }
  }

  async function handleEditRequest(request) {
    const params = await request.json();
    const token = params.jwt;
    const isValid = await jwt.verify(token, JWT_SECRET);
    if (!isValid) {
      return new Response("Invalid credentials! Need Login", { status: 401 });
    }
    const {
      shortUrl,
      longUrl,
      expirationTime,
      requirePassword,
      password,
      shortUrlLength,
    } = params;
    let response;
    if (invalidPaths.include(shortUrl)) {
      response = new Response("Invalid path because of conflict!", {
        status: 400,
      });
      return response;
    }
    const value = await LINKS.get(shortUrl);
    if (value !== null) {
      response = new Response(`Short URL ${shortUrl} already exists!`, {
        status: 400,
      });
      return response;
    }

    // Update the record in KV
    const data = {
      expirationTime: expirationTime,
      requirePassword: requirePassword,
      password: password,
      shortUrlLength: shortUrlLength,
      longUrl: longUrl,
    };
    await LINKS.put(shortUrl, JSON.stringify(data));

    response = new Response(shortUrl, { status: 200 });
    return response;
  }

  async function handleDeleteRequest(request) {
    const params = await request.json();
    const shortUrl = params.shortUrl;
    const token = params.jwt;
    const isValid = await jwt.verify(token, JWT_SECRET);
    if (!isValid) {
      return new Response("Invalid credentials! Need Login", { status: 401 });
    }

    await LINKS.delete(`url:${shortUrl}`);
    const response = new Response({ shortUrl, status: 200 }, { status: 200 });
    return response;
  }

  async function handleListRequest(request) {
    const params = await request.json();
    const shortUrl = params.shortUrl;
    const token = params.jwt;
    const isValid = await jwt.verify(token, JWT_SECRET);
    if (!isValid) {
      return new Response("Invalid credentials! Need Login", { status: 401 });
    }

    const keys = await LINKS.list();
    const shortUrls = [];

    for (const key of keys.keys) {
      if (key.name.startsWith("url:")) {
        const value = await LINKS.get(key.name);
        if (value) {
          const data = JSON.parse(value);
          shortUrls.push({
            shortUrl: key.name.substring(4),
            longUrl: data.longUrl,
            expirationTime: data.expirationTime,
            requirePassword: data.requirePassword,
            password: data.password,
          });
        }
      }
    }

    const response = new Response(JSON.stringify(shortUrls), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    return response;
  }
}
