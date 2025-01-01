import React, { useState } from "react";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from "@nextui-org/react";
import { FaPlay, FaPause, FaTrashAlt, FaCog, FaRemoveFormat } from "react-icons/fa";
import ModalMonitorSelection from "../ModalMonitorSelection";
import { MdAddBox, MdDeleteForever, MdDeleteSweep } from "react-icons/md";
import { SketchPicker } from "react-color";

const UsageSidebar = ({
  resources,
  darkMode,
  allDataMonitors,
  fitToMonitors,
  addVideo,
  playVideo,
  pauseVideo,
  toggleLoopVideo,
  moveResource,
  deleteResource,
  loopVideos,
  addResource,
  addImage,
  addText,
  addWeb,
  editWeb,
  editText,
  updateResourceName,
  updateResourceColor,
  inputs,
  addInput,
  deleteResourceFromScene,
}) => {
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [newName, setNewName] = useState("");
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [colorPickerResourceId, setColorPickerResourceId] = useState(null);

  const handleDoubleClick = (resource) => {
    setEditingResourceId(resource.id);
    setNewName(resource.name);
  };

  const handleNameChange = (e) => {
    setNewName(e.target.value);
  };

  const handleNameSave = (resourceId) => {
    updateResourceName(resourceId, newName);
    setEditingResourceId(null);
    setNewName("");
  };

  const handleColorChange = (color) => {
    setSelectedColor(color.hex);
    if (colorPickerResourceId) {
      updateResourceColor(colorPickerResourceId, color.hex);
    }
  };

  return (
    <div
      dir="rtl"
      className="p-2 rounded-lg h-full overflow-auto  flex flex-col"
      style={{
        backgroundColor: darkMode ? "#1a1a1a" : "#eaeaea",
        color: darkMode ? "#ffffff" : "#000000",
      }}
    >
      {colorPickerVisible && (
        <div className="absolute left-0 right-0 top-0 bottom-0 m-auto z-[100] w-fit h-fit">
          <SketchPicker color={selectedColor} onChange={handleColorChange} />
          <Button
            className="w-full my-2"
            onPress={() => {
              setColorPickerVisible(false);
            }}
            color="primary"
            variant="solid"
          >
            انجام شد
          </Button>
        </div>
      )}

      {/* Fixed Header */}
      <div className="sticky top-[0px] z-[50] px-3 py-[2px] bg-inherit">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-semibold">منابع استفاده شده</h2>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto ">
        <ul className="flex flex-col gap-2">
          {resources?.map((resource) => (
            <li
              key={resource.id}
              className={`text-sm flex flex-wrap items-center justify-between ${
                darkMode ? "bg-gray-700" : "bg-gray-300"
              } p-2 rounded-md shadow-sm`}
            >
              <div className="flex items-center w-[50%]">
                {editingResourceId === resource.id ? (
                  <input
                    type="text"
                    value={newName}
                    onChange={handleNameChange}
                    onBlur={() => handleNameSave(resource.id)}
                    className={` ${darkMode ? "text-black" : "text-white"} p-1 rounded-sm`}
                    autoFocus
                  />
                ) : (
                  <span
                    className={` ${darkMode ? "text-white" : "text-black"} mr-2 truncate`}
                    onDoubleClick={() => handleDoubleClick(resource)}
                  >
                    {resource.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 w-[50%] justify-end">
                {resource.type === "video" && (
                  <>
                    <Button
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="light"
                      color="default"
                      onPress={() => playVideo(resource.id)}
                    >
                      <FaPlay />
                    </Button>
                    <Button
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="light"
                      color="default"
                      onPress={() => pauseVideo(resource.id)}
                    >
                      <FaPause />
                    </Button>
                  </>
                )}

                <ModalMonitorSelection
                  darkMode={darkMode}
                  videoName={resource.id}
                  monitors={allDataMonitors}
                  fitToMonitors={fitToMonitors}
                />
                <Tooltip content="حذف از صحنه">
                  <Button
                    className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                    size="sm"
                    variant="light"
                    color="default"
                    onPress={() => deleteResourceFromScene(resource.id)}
                  >
                    <MdDeleteSweep />
                  </Button>
                </Tooltip>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="light"
                      color="default"
                    >
                      <FaCog />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu dir="rtl" aria-label="More Actions">
                    <DropdownItem key="moveUp" onPress={() => moveResource(resource.id, -1)}>
                      بالا
                    </DropdownItem>
                    <DropdownItem key="moveDown" onPress={() => moveResource(resource.id, 1)}>
                      پایین
                    </DropdownItem>
                    {resource.type === "text"
                      ? [
                          <DropdownItem key="edit-text" onPress={() => editText(resource)}>
                            ویرایش متن اصلی
                          </DropdownItem>,
                          <DropdownItem
                            key="edit-color"
                            onPress={() => {
                              setColorPickerVisible(!colorPickerVisible);
                              setColorPickerResourceId(resource.id);
                            }}
                          >
                            انتخاب رنگ متن
                          </DropdownItem>,
                        ]
                      : resource.type === "web"
                      ? [
                          <DropdownItem key="edit-web" onPress={() => editWeb(resource)}>
                            ویرایش URL
                          </DropdownItem>,
                        ]
                      : null}
                    <DropdownItem key="loop" onPress={() => toggleLoopVideo(resource.id)}>
                      {loopVideos[resource.id] ? "لوپ فعال" : "لوپ غیرفعال"}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UsageSidebar;
