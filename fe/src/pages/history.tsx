import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { history } from "./api/workersapi";
import ReactECharts from "echarts-for-react";
import getConfig from "next/config";
import Footer from "./components/Footer";
import ForkMeBadge from "./components/ForkMeBadge";

const { publicRuntimeConfig } = getConfig();
const baseURL = publicRuntimeConfig.CLOUDFLARE_WORKER_BASE_URL;

export default function ClickHistory() {
  const router = useRouter();
  const { shortUrl } = router.query;
  const [optionDay, setOptionDay] = useState({});
  const [optionMonth, setOptionMonth] = useState({});
  const [optionYear, setOptionYear] = useState({});
  const [timeRange, setTimeRange] = useState("day");
  const [jwt, setJwt] = useState("");

  useEffect(() => {
    const jwtCookie = document.cookie
      .split(";")
      .find((cookie) => cookie.startsWith("jwt="));

    if (jwtCookie) {
      const jwt = jwtCookie.split("=")[1];
      setJwt(jwt);

      if (!shortUrl) return;

      const fetchClickHistory = async (jwt, shortUrl) => {
        const dayResponse = await history({
          timeRange: "day",
          shortUrl,
          jwt,
        });
        setOptionDay(getOption(dayResponse.data, "day"));

        const monthResponse = await history({
          timeRange: "month",
          shortUrl,
          jwt,
        });
        setOptionMonth(getOption(monthResponse.data, "month"));

        const yearResponse = await history({
          timeRange: "year",
          shortUrl,
          jwt,
        });
        setOptionYear(getOption(yearResponse.data, "year"));
      };

      fetchClickHistory(jwt, shortUrl);
    }
  }, [shortUrl, jwt]);
  const goBack = () => {
    router.back();
  };
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  const getCurrentOption = () => {
    switch (timeRange) {
      case "day":
        return optionDay;
      case "month":
        return optionMonth;
      case "year":
        return optionYear;
      default:
        return {};
    }
  };

  const currentOption = getCurrentOption();

  const getOption = (clickHistory, range) => {
    const xAxisData = Object.keys(clickHistory);
    const yAxisData = Object.values(clickHistory);
    const formatLabel = (label) => {
      const dateParts = label.split(/[-:]/);
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = dateParts.length >= 3 ? parseInt(dateParts[2], 10) : 1;
      const hours = dateParts.length === 4 ? parseInt(dateParts[3], 10) : 0;

      const date = new Date(Date.UTC(year, month, day, hours));

      const localYear = date.getFullYear();
      const localMonth = date.getMonth() + 1;
      const localDay = date.getDate();
      const localHours = date.getHours();

      const padZero = (num) => (num < 10 ? `0${num}` : num);

      switch (range) {
        case "day":
          return `${localYear}-${padZero(localMonth)}-${padZero(
            localDay
          )} ${padZero(localHours)}:00`;
        case "month":
          return `${localYear}-${padZero(localMonth)}-${padZero(localDay)}`;
        case "year":
          return `${localYear}-${padZero(localMonth)}`;
        default:
          return label;
      }
    };

    const xAxisDataLocalTime = xAxisData.map(formatLabel);

    return {
      tooltip: {
        trigger: "axis",
      },
      xAxis: {
        type: "category",
        data: xAxisDataLocalTime,
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          data: yAxisData,
          type: "bar",
        },
      ],
    };
  };

  return (
    <div className="mt-8 flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <ForkMeBadge />{" "}
      <h1 className="text-3xl font-bold text-gray-700 mb-8">
        Click History for {baseURL}/{shortUrl}
      </h1>
      <div className="w-full max-w-lg p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <label htmlFor="timeRange" className="text-gray-700 font-bold mr-2">
              Time Range:
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={handleTimeRangeChange}
              className="border border-gray-300 rounded p-2 text-black"
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
          <button
            onClick={goBack}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Back
          </button>
        </div>
        {Object.keys(currentOption).length > 0 ? (
          <ReactECharts option={currentOption} style={{ height: "400px" }} />
        ) : (
          <div className="text-center text-gray-500 text-xl">
            No click history found
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
