import axios from "axios";
import { extractData, catchErr } from "./utils";

export const createMedia = (url, data) =>
  axios.post(`${url}/media`, data).then(extractData).catch(catchErr);
export const getMedia = (url) => axios.get(`${url}/media`).then(extractData).catch(catchErr);
export const getMediaById = (url, id) =>
  axios.get(`${url}/media/${id}`).then(extractData).catch(catchErr);
export const updateMedia = (url, id, data) =>
  axios.put(`${url}/media/${id}`, data).then(extractData).catch(catchErr);
export const deleteMedia = (url, id) => axios.delete(`${url}/media/${id}`).catch(catchErr);
