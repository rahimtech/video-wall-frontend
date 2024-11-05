import React from "react";
import { Button, Tooltip } from "@nextui-org/react";
import { FaTrashAlt } from "react-icons/fa";
import { MdAddBox } from "react-icons/md";

const Settings = ({
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
      className="p-2 rounded-lg h-full  overflow-auto"
      style={{
        backgroundColor: darkMode ? "#1a1a1a" : "#eaeaea",
        color: darkMode ? "#ffffff" : "#000000",
      }}
    >
      <div className="flex justify-between px-2 items-center mb-4">
        <h2 className="text-md font-semibold">تنظیمات</h2>
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
        <li
          className={`text-sm flex flex-wrap items-center justify-between  ${
            darkMode ? "bg-gray-700" : "bg-gray-300"
          } p-2 rounded-md shadow-sm`}
        >
          مدیریت
        </li>
        <li
          className={`text-sm flex flex-wrap items-center justify-between  ${
            darkMode ? "bg-gray-700" : "bg-gray-300"
          } p-2 rounded-md shadow-sm`}
        >
          درباره نرم افزار
        </li>
        <li
          className={`text-sm flex flex-wrap items-center justify-between  ${
            darkMode ? "bg-gray-700" : "bg-gray-300"
          } p-2 rounded-md shadow-sm`}
        >
          خروج
        </li>
      </ul>
    </div>
  );
};

export default Settings;
