import { useState, useEffect } from "react";
import { del } from "../api/workersapi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashAlt,
  faCopy,
  faSpinner,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import getConfig from "next/config";
import ClickHistory from "../history";
import Link from "next/link";
import { useRouter } from "next/router";

const { publicRuntimeConfig } = getConfig();
const baseURL = publicRuntimeConfig.CLOUDFLARE_WORKER_BASE_URL;

export default function ShortUrlList({ shortUrls, setReloadShortUrls }) {
  const router = useRouter();

  const [passwordLineIndex, setPasswordLineIndex] = useState(-1);
  const [jwt, setJwt] = useState("");
  const [loading, setLoading] = useState(null);
  const [hoveredLongUrl, setHoveredLongUrl] = useState(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [tooltipTimeoutId, setTooltipTimeoutId] = useState(null);
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [shortUrlUsingHistory, setShortUrlUsingHistory] = useState("");

  useEffect(() => {
    const jwtCookie = document.cookie
      .split(";")
      .find((cookie) => cookie.startsWith("jwt="));
    if (jwtCookie) {
      const jwt = jwtCookie.split("=")[1];
      setJwt(jwt);
    } else {
      window.location.href = "/index";
    }
  }, []); // Only run once on component mount
  const truncateLongUrl = (longUrl) => {
    if (longUrl.length > 20) {
      return longUrl.substr(0, 20) + "...";
    } else {
      return longUrl;
    }
  };
  const handleLongUrlMouseEnter = (longUrl) => {
    setHoveredLongUrl(longUrl);
  };

  const handleLongUrlMouseLeave = () => {
    setHoveredLongUrl(null);
  };
  const handleDelete = async (shortUrl) => {
    // Display a confirmation dialog before proceeding with deletion
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this short URL?"
    );

    // If the user confirms deletion, proceed with the deletion process
    if (shouldDelete) {
      setLoading(shortUrl); // Updated to set shortUrl

      const response = await del({ shortUrl, jwt });
      if (response.status === 200) {
        setReloadShortUrls((prev) => !prev);
      }
      setLoading(null); // Updated to set shortUrl
    }
  };
  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
  };

  const handleViewClickHistory = (shortUrl) => {
    router.push(`/history?shortUrl=${shortUrl}`);
  };

  const handlePasswordClick = (index) => {
    setPasswordLineIndex((prev) => (prev === index ? -1 : index));
  };
  const formatExpirationTime = (expirationTime) => {
    if (expirationTime === 0) {
      return "NEVER";
    }
    const expirationDate = new Date(expirationTime);
    return expirationDate.toLocaleString();
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-black mb-2">Short URL List</h2>
      {shortUrls && shortUrls.length > 0 ? (
        <div className="w-full max-h-64 overflow-auto">
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="px-4 text-black py-2 text-center">Short URL</th>
                <th className="px-4 text-black py-2 text-center">
                  Origin Long URL
                </th>
                <th className="px-4 text-black py-2 text-center">
                  Expiration Time
                </th>
                <th className="px-4 text-black py-2 text-center">Password</th>
                <th className="px-4 text-black py-2 text-center">Clicks</th>
                <th className="px-4 text-black py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shortUrls.map(
                (
                  { shortUrl, longUrl, expirationTime, password, clicks },
                  index
                ) => (
                  <tr key={shortUrl}>
                    <td className="border text-black px-4 py-2">
                      {baseURL}/{shortUrl}
                      <button
                        type="button"
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() => handleCopy(`${baseURL}/${shortUrl}`)}
                      >
                        <FontAwesomeIcon icon={faCopy} />
                      </button>
                    </td>
                    <td
                      className="border text-black px-4 py-2 text-center relative cursor-pointer"
                      onMouseEnter={() => {
                        clearTimeout(tooltipTimeoutId); // Clear any existing timeout
                        setIsTooltipVisible(true);
                        setHoveredRowIndex(index);
                      }}
                      onMouseLeave={() => {
                        setTooltipTimeoutId(
                          setTimeout(() => {
                            setIsTooltipVisible(false);
                          }, 2000)
                        );
                        setHoveredRowIndex(null);
                      }}
                    >
                      {truncateLongUrl(longUrl)}{" "}
                      <button
                        type="button"
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        onClick={() => handleCopy(longUrl)}
                      >
                        <FontAwesomeIcon icon={faCopy} />
                      </button>
                      {hoveredRowIndex === index && (
                        <span
                          className={`tooltiptext ${
                            isTooltipVisible
                              ? "visible opacity-100"
                              : "invisible opacity-0"
                          } w-64 bg-gray-700 text-white text-center rounded-md p-2 absolute z-10 -bottom-24 left-1/2 transform -translate-x-1/2 transition-opacity duration-300`}
                        >
                          <span>{longUrl}</span>
                        </span>
                      )}
                    </td>

                    <td className="border text-black px-4 py-2 text-center">
                      {formatExpirationTime(expirationTime)}
                    </td>
                    <td className="border text-black px-4 py-2 text-center">
                      {password ? password : "NONE"}
                    </td>
                    <td className="border text-black px-4 py-2 text-center">
                      {clicks ? clicks : "0"}
                    </td>
                    <td className="border text-black px-4 py-2 flex justify-center items-center">
                      <button
                        type="button"
                        className="text-blue-500 hover:text-blue-700 mr-2"
                        onClick={() => handleViewClickHistory(shortUrl)}
                      >
                        <FontAwesomeIcon icon={faChartLine} />
                      </button>

                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(shortUrl)}
                        disabled={loading === shortUrl} // Updated condition
                      >
                        {loading === shortUrl ? ( // Updated condition
                          <span>
                            <FontAwesomeIcon icon={faSpinner} spin />
                          </span>
                        ) : (
                          <FontAwesomeIcon icon={faTrashAlt} />
                        )}
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-black">No short URLs found.</p>
      )}
    </div>
  );
}
