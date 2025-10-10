import axios from "axios";
import { extractData, catchErr } from "./utils";
const userAccessToken = localStorage.getItem("accessToken");

export const createMedia = (url, data) =>
  axios
    .post(`${url}/media`, data, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const getMedia = (url) =>
  axios
    .get(`${url}/media`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const getMediaById = (url, id) =>
  axios
    .get(`${url}/media/${id}`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const updateMedia = (url, id, data) =>
  axios
    .put(`${url}/media/${id}`, data, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const deleteMedia = (url, id) =>
  axios
    .delete(`${url}/media/${id}`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .catch(catchErr);
