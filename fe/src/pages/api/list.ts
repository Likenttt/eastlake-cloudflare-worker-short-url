// pages/api/proxyLogin.ts

import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const baseURL = publicRuntimeConfig.CLOUDFLARE_WORKER_BASE_URL;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { method, body } = req;

    if (method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
      return;
    }

    const response = await axios.post(`${baseURL}/api/list`, body, {
      withCredentials: true,
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(error.response?.status || 500).json({ message: error.message });
  }
};

export default handler;
