import axios from "axios";
import { extractData, catchErr } from "./utils";

export const createProgram = (url, data) =>
  axios.post(`${url}/programs`, data).then(extractData).catch(catchErr);
export const getPrograms = (url) => axios.get(`${url}/programs`).then(extractData).catch(catchErr);
export const getProgramById = (url, id) =>
  axios.get(`${url}/programs/${id}`).then(extractData).catch(catchErr);
export const updateProgram = (url, id, data) =>
  axios.put(`${url}/programs/${id}`, data).then(extractData).catch(catchErr);
export const deleteProgram = (url, id) => axios.delete(`${url}/programs/${id}`).catch(catchErr);
export const updateProgramScheduleOrders = (url, id, data) =>
  axios.put(`${url}/programs/${id}/schedules`, data).then(extractData).catch(catchErr);
