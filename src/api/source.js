import axios from "axios";
import { extractData, catchErr } from "./utils";
const userAccessToken = localStorage.getItem("accessToken");

export const createSource = (url, data) =>
  axios
    .post(`${url}/sources`, data, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const getSources = (url) =>
  axios
    .get(`${url}/sources`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const getSourceById = (url, id) =>
  axios
    .get(`${url}/sources/${id}`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const updateSource = (url, id, data) =>
  axios
    .put(`${url}/sources/${id}`, data, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const deleteSource = (url, id) =>
  axios
    .delete(`${url}/sources/${id}`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .catch(catchErr);
