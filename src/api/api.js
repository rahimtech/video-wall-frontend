import { createScene, getScenes, getSceneById, updateScene, deleteScene } from "./scenes";
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
};

export default api;
