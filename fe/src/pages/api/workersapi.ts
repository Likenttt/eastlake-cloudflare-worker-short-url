import axios from "axios";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const baseURL = publicRuntimeConfig.CLOUDFLARE_WORKER_BASE_URL;

const api = axios.create({
  withCredentials: true, // add this option to include cookies in requests
});

export const login = async (postData: any) => {
  const response = await api.post("/api/login", postData);
  return response;
};

export const shorten = async (postData: any) => {
  const response = await api.post("/api/shorten", postData);

  return response.data;
};
export const list = async (postData: any) => {
  const response = await api.post("/api/list", postData);
  return response.data;
};
export const del = async (postData: any) => {
  const response = await api.post("/api/del", postData);
  return response.data;
};
export const edit = async (postData: any) => {
  const response = await api.post("/api/edit", postData);
  return response.data;
};
export const history = async (postData: any) => {
  const response = await api.post("/api/history", postData);
  return response.data;
};
