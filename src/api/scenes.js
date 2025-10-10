import axios from "axios";
import { extractData, catchErr } from "./utils";
const userAccessToken = localStorage.getItem("accessToken");

export const createScene = (url, data) =>
  axios
    .post(`${url}/scenes`, data, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const getScenes = (url) =>
  axios
    .get(`${url}/scenes`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const getSceneById = (url, id) =>
  axios
    .get(`${url}/scenes/${id}`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const updateScene = (url, id, data) =>
  axios
    .put(`${url}/scenes/${id}`, data, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const deleteScene = (url, id) =>
  axios
    .delete(`${url}/scenes/${id}`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .catch(catchErr);
