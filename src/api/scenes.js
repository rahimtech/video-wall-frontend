import axios from "axios";
import { extractData, catchErr } from "./utils";

export const createScene = (url, data) =>
  axios.post(`${url}/scenes`, data).then(extractData).catch(catchErr);
export const getScenes = (url) => axios.get(`${url}/scenes`).then(extractData).catch(catchErr);
export const getSceneById = (url, id) =>
  axios.get(`${url}/scenes/${id}`).then(extractData).catch(catchErr);
export const updateScene = (url, id, data) =>
  axios.put(`${url}/scenes/${id}`, data).then(extractData).catch(catchErr);
export const deleteScene = (url, id) => axios.delete(`${url}/scenes/${id}`).catch(catchErr);
