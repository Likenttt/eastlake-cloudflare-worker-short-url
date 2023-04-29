// pages/api/proxyLogin.ts

import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const baseURL = publicRuntimeConfig.CLOUDFLARE_WORKER_BASE_URL;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, body } = req;

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  const response = await axios.post(
    `${process.env.CLOUDFLARE_WORKER_BASE_URL}/api/list`,
    body,
    {
      withCredentials: true,
    }
  );
  res.status(200).json(response.data);
};

export default handler;
