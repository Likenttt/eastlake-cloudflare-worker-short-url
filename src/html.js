export const askPasswordPageHtml = `
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

export const notFoundMessageHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Not Found</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        text-align: center;
        background-color: #f0f0f0;
        padding-top: 50px;
      }
  
      h1 {
        font-size: 24px;
        color: #333;
      }
  
      p {
        font-size: 16px;
        color: #666;
      }
  
      a {
        text-decoration: none;
        color: #007BFF;
      }
    </style>
  </head>
  <body>
    <h1>Page Not Found</h1>
    <p>未找到！请联系网址提供者。</p>
    <p>Not found! Please contact the URL provider.</p>
    <p> ¡No encontrado! Por favor, contacta con el proveedor de la URL.</p>
    <p> Introuvable ! Veuillez contacter le fournisseur de l'URL.</p>
    <p> Nicht gefunden! Bitte wenden Sie sich an den URL-Anbieter.</p>
    <p>見つかりません！URL提供者に連絡してください。</p>
    <p> Не найдено! Пожалуйста, свяжитесь с поставщиком URL.</p>
    <p>찾을 수 없음! URL 공급자에게 문의하십시오.</p>
    <a href="${DEFAULT_PAGE}">Go to Homepage</a>
  </body>
  </html>
  `;
