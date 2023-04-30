import { useState, useEffect } from "react";
import axios from "axios";
import { login } from "./api/workersapi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import Footer from "./components/Footer";
import ForkMeBadge from "./components/ForkMeBadge";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const jwtCookie = document.cookie
      .split(";")
      .map((cookie) => cookie.trim()) // Add this line to trim each cookie string
      .find((cookie) => cookie.startsWith("jwt="));

    console.log(`document.cookie is:${document.cookie}`);
    console.log(`jwtCookie is:${jwtCookie}`);

    if (jwtCookie) {
      const jwt = jwtCookie.split("=")[1];
      window.location.href = "/shorten";
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await login({ username, password });

      console.log(`login res:${JSON.stringify(response)}`);
      console.log(`login res status:${response.status === 200}`);
      if (response.status === 200) {
        window.location.href = "/shorten";
      }
    } catch (error) {
      alert(`Invalid credentials: ${JSON.stringify(error.response)}`); // error message is in response.data
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <ForkMeBadge />
      <h1 className="text-3xl font-bold mb-8" style={{ color: "black" }}>
        EastLake Short Url System Login
      </h1>
      <form
        className="w-full max-w-lg p-4 bg-white rounded-lg shadow-md"
        onSubmit={handleSubmit}
      >
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block text-gray-700 font-bold mb-2"
          >
            Username
          </label>
          <input
            type="text"
            name="username"
            id="username"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-gray-700 font-bold mb-2"
          >
            Password
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-0 mr-2"
              onClick={toggleShowPassword}
            >
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                className="text-gray-500"
              />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded focus:outline-none focus:shadow-outline mx-auto"
          >
            Login
          </button>
        </div>
      </form>
      <Footer />
    </div>
  );
}
