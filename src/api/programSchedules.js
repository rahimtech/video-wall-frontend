import axios from "axios";
import { extractData, catchErr } from "./utils";
const userAccessToken = localStorage.getItem("accessToken");

export const createProgramSchedule = (url, data) =>
  axios
    .post(`${url}/programs/schedules`, data, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const getProgramSchedules = (url) =>
  axios
    .get(`${url}/programs/schedules`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const getProgramScheduleById = (url, id) =>
  axios
    .get(`${url}/programs/schedules/${id}`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const updateProgramSchedule = (url, id, data) =>
  axios
    .put(`${url}/programs/schedules/${id}`, data, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .then(extractData)
    .catch(catchErr);
export const deleteProgramSchedule = (url, id) =>
  axios
    .delete(`${url}/programs/schedules/${id}`, {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
    })
    .catch(catchErr);

export const addSceneToProgram = async (
  url,
  programId,
  sceneId,
  duration = 60,
  skip = true,
  description = undefined,
  metadata = {}
) => {
  console.log(`Adding scene ${sceneId} to program ${programId}(${duration}s) ${!skip}`);
  return createProgramSchedule(url, { programId, sceneId, duration, skip, description, metadata });
};
