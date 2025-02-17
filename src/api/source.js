import axios from "axios";
import { extractData, catchErr } from "./utils";

export const createSource = (url, data) =>
  axios.post(`${url}/sources`, data).then(extractData).catch(catchErr);
export const getSources = (url) => axios.get(`${url}/sources`).then(extractData).catch(catchErr);
export const getSourceById = (url, id) =>
  axios.get(`${url}/sources/${id}`).then(extractData).catch(catchErr);
export const updateSource = (url, id, data) =>
  axios.put(`${url}/sources/${id}`, data).then(extractData).catch(catchErr);
export const deleteSource = (url, id) => axios.delete(`${url}/sources/${id}`).catch(catchErr);
