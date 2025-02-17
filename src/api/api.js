import { createScene, getScenes, getSceneById, updateScene, deleteScene } from "./scenes";
import { createSource, getSources, getSourceById, updateSource, deleteSource } from "./source";
import {
  createProgram,
  getPrograms,
  getProgramById,
  updateProgram,
  deleteProgram,
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
};

export default api;
