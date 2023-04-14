const loginHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login</title>
  </head>
  <body>
    <h1>Login</h1>
    <form id="login-form">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username" required />
      <br />
      <label for="password">Password:</label>
      <input type="password" id="password" name="password" required />
      <br />
      <button type="submit">Login</button>
    </form>
    <script>
      function setJwtCookie(token) {
        document.cookie = "jwt=${" + token"}; path=/";
      }
      document
        .getElementById("login-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();

          const username = event.target.username.value;
          const password = event.target.password.value;

          const response = await fetch("/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          });

          if (response.ok) {
            const { token } = await response.json();
            // Save the JWT token in the browser's localStorage
            localStorage.setItem("jwt", token);
            setJwtCookie(token);
            // Redirect to the shorten page or a protected page
            window.location.href = "/shorten";
          } else {
            alert("Invalid credentials");
          }
        });
    </script>
  </body>
</html>
`;
const notFoundHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Page Not Found</title>
  </head>
  <body>
    <h1>404 - Page Not Found</h1>
    <p>The requested URL was not found on this server.</p>

    <!-- Chinese translation -->
    <h1>404 - 找不到页面</h1>
    <p>请求的 URL 在此服务器上未找到。</p>

    <!-- Japanese translation -->
    <h1>404 - ページが見つかりません</h1>
    <p>要求された URL がこのサーバー上で見つかりませんでした。</p>

    <!-- French translation -->
    <h1>404 - Page non trouvée</h1>
    <p>L'URL demandée n'a pas été trouvée sur ce serveur.</p>

    <!-- Russian translation -->
    <h1>404 - Страница не найдена</h1>
    <p>Запрашиваемый URL не найден на этом сервере.</p>

    <!-- Portuguese translation -->
    <h1>404 - Página não encontrada</h1>
    <p>O URL solicitado não foi encontrado neste servidor.</p>
  </body>
</html>`;
const shortenHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Shorten Page</title>
  </head>
  <body>
    <h1>Shorten Page</h1>
    <form>
      <label for="short-url-length">Short URL length:</label>
      <select name="short-url-length" id="short-url-length">
        <option value="4">4</option>
        <option value="6">6</option>
        <option value="8">8</option>
      </select>
      <br /><br />

      <label for="expiration-time">Expiration time (in hours):</label>
      <input type="number" name="expiration-time" id="expiration-time" />
      <br /><br />

      <label for="password-authentication">Password Authentication:</label>
      <input
        type="checkbox"
        id="password-authentication"
        onchange="togglePasswordInput()"
      />

      <div id="password-input-container" style="display: none">
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" />
      </div>

      <label for="original-url">Original URL:</label>
      <input type="text" name="original-url" id="original-url" />
      <br /><br />

      <input type="submit" value="Shorten" />
    </form>
    <script>
      function togglePasswordInput() {
        const passwordInputContainer = document.getElementById(
          "password-input-container"
        );
        const passwordAuthenticationCheckbox = document.getElementById(
          "password-authentication"
        );

        if (passwordAuthenticationCheckbox.checked) {
          passwordInputContainer.style.display = "block";
        } else {
          passwordInputContainer.style.display = "none";
        }
      }
    </script>
  </body>
</html>`;
