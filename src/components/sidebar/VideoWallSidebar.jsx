import React from "react";
import { Button, Tooltip } from "@nextui-org/react";
import { FaTrashAlt } from "react-icons/fa";
import { MdAddBox } from "react-icons/md";

const VideoWallSidebar = ({
  scenes,
  darkMode,
  selectedScene,
  setSelectedScene,
  addScene,
  editingSceneId,
  setEditingSceneId,
  handleEditSceneName,
  deleteScene,
}) => {
  return (
    <div
      dir="rtl"
      className=" p-3 border-r border-white h-full overflow-auto"
      style={{
        backgroundColor: darkMode ? "#1a1a1a" : "#eaeaea",
        color: darkMode ? "#ffffff" : "#000000",
      }}
    >
      <div className="flex justify-between px-2 items-center mb-4">
        <h2 className="text-md font-semibold">اطلاعات نمایشگرها</h2>
        {/* <Button
          className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1 text-xl`}
              size="lg"
              variant="light"
              color="default"
          onClick={addScene}
        >
          <MdAddBox />
        </Button> */}
      </div>

      <ul className="flex flex-col gap-2">
        {scenes.map((scene) => (
          <li key={scene.id} className="flex items-center justify-between">
            {editingSceneId === scene.id ? (
              <input
                type="text"
                defaultValue={scene.name}
                onBlur={(e) => handleEditSceneName(scene.id, e.target.value)}
                className="p-2 rounded-md bg-gray-700 text-white w-full"
                autoFocus
              />
            ) : (
              <div
                className={`p-2 cursor-pointer flex justify-between rounded-md transition-colors duration-200 w-full ${
                  selectedScene === scene.id
                    ? "bg-blue-500 text-white"
                    : darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                onDoubleClick={() => setEditingSceneId(scene.id)}
                onClick={() => setSelectedScene(scene.id)}
              >
                <span className="flex-grow">{scene.name}</span>
                <div className="flex gap-1">
                  <Tooltip content="Delete Scene">
                    <Button
                      className="min-w-fit h-fit p-1"
                      size="sm"
                      variant="flat"
                      color="default"
                      onClick={() => deleteScene(scene.id)}
                      disabled={scenes.length === 1}
                    >
                      <FaTrashAlt size={14} />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VideoWallSidebar;
