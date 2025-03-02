import { createScene, getScenes, getSceneById, updateScene, deleteScene } from "./scenes";
import { createSource, getSources, getSourceById, updateSource, deleteSource } from "./source";
import { createMedia, getMedia, getMediaById, updateMedia, deleteMedia } from "./media";
import {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
  updateProgramScheduleOrders,
} from "./programs";
import {
  createProgramSchedule,
  getProgramSchedules,
  getProgramScheduleById,
  updateProgramSchedule,
  deleteProgramSchedule,
  addSceneToProgram,
} from "./programSchedules";

const api = {
  // Scenes
  createScene,
  getScenes,
  getSceneById,
  updateScene,
  deleteScene,

  // Programs
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
  updateProgramScheduleOrders,

  // ProgramSchedules
  createProgramSchedule,
  getProgramSchedules,
  getProgramScheduleById,
  updateProgramSchedule,
  deleteProgramSchedule,
  addSceneToProgram,

  // Source
  createSource,
  getSources,
  getSourceById,
  updateSource,
  deleteSource,

  // Media
  createMedia,
  getMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
};

export default api;
