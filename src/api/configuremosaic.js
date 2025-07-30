import axios from "axios";
import { extractData, catchErr } from "./utils";

export const setConfigMosaic = (url, data) =>
  axios.post(`${url}/configure-mosaic`, data).then(extractData).catch(catchErr);
export const getConfigMosaic = (url) =>
  axios.get(`${url}/configure-mosaic`).then(extractData).catch(catchErr);
