import React, { useState } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@nextui-org/react";
import { FaPlay, FaPause, FaArrowUp, FaArrowDown, FaTrashAlt, FaCog } from "react-icons/fa";
import ModalMonitorSelection from "../ModalMonitorSelection"; // فرض کنید کامپوننت مودال شما اینجاست
import { MdAddBox } from "react-icons/md";
import { SketchPicker } from "react-color"; // استفاده از یک Color Picker مانند react-color

const ResourcesSidebar = ({
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
    updateResourceName(resourceId, newName); // ذخیره نام جدید
    setEditingResourceId(null);
    setNewName("");
  };

  const handleColorChange = (color) => {
    setSelectedColor(color.hex);
    if (colorPickerResourceId) {
      updateResourceColor(colorPickerResourceId, color.hex); // ذخیره رنگ انتخابی برای آیتم خاص
    }
  };

  return (
    <div
      dir="rtl"
      className={`w-1/4 p-3 h-full border-r border-white flex flex-col justify-between bg-gray-800 overflow-hidden`}
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
            onClick={() => {
              setColorPickerVisible(false);
            }}
            color="primary"
            variant="solid"
          >
            انجام شد
          </Button>
        </div>
      )}

      <div className="flex justify-between px-3 items-center mb-3">
        <h2 className="text-md font-semibold">منابع</h2>
        <Dropdown dir="rtl" className="vazir">
          <DropdownTrigger>
            <Button
              auto
              color="default"
              className="block p-0 text-xl min-w-fit w-fit h-fit rounded-sm"
            >
              <MdAddBox />
            </Button>
          </DropdownTrigger>

          <DropdownMenu aria-label="Static Actions">
            <DropdownItem onClick={() => addResource("video")} key="video">
              ویدیو
            </DropdownItem>
            <DropdownItem onClick={() => addResource("image")} key="image">
              تصویر
            </DropdownItem>
            <DropdownItem onClick={() => addResource("text")} key="text">
              متن
            </DropdownItem>
            <DropdownItem onClick={() => addResource("web")} key="web">
              وب
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <div className="mt-2 flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-2">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className={`text-sm flex flex-wrap items-center justify-between ${
                darkMode ? "bg-gray-700" : "bg-gray-300"
              } p-3 rounded-md shadow-sm`}
            >
              <div className="flex items-center w-[50%]">
                {editingResourceId === resource.id ? (
                  <input
                    type="text"
                    value={newName}
                    onChange={handleNameChange}
                    onBlur={() => handleNameSave(resource.id)}
                    className="p-1 rounded-sm"
                    autoFocus
                  />
                ) : (
                  <span
                    className="mr-2 truncate"
                    onDoubleClick={() => handleDoubleClick(resource)}
                    style={{ color: resource.color || "#000000" }} // تنظیم رنگ متن بر اساس رنگ انتخاب شده
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
                      onClick={() => playVideo(resource.id)}
                    >
                      <FaPlay />
                    </Button>
                    <Button
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="light"
                      color="default"
                      onClick={() => pauseVideo(resource.id)}
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
                  onAddToScene={() => addVideo(resource.videoElement)}
                />
                <Button
                  className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                  size="sm"
                  variant="light"
                  color="default"
                  onClick={() => deleteResource(resource.id)}
                >
                  <FaTrashAlt />
                </Button>
                <Dropdown>
                  <DropdownTrigger>
                    <Button className="min-w-[20px] h-[20px] p-[2px]" variant="light">
                      <FaCog />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="More Actions">
                    <DropdownItem key="moveUp" onClick={() => moveResource(resource.id, -1)}>
                      بالا
                    </DropdownItem>
                    <DropdownItem key="moveDown" onClick={() => moveResource(resource.id, 1)}>
                      پایین
                    </DropdownItem>
                    {resource.type === "video" ? (
                      <DropdownItem key="add-video" onClick={() => addVideo(resource.videoElement)}>
                        افزودن به صحنه
                      </DropdownItem>
                    ) : resource.type === "image" ? (
                      <DropdownItem key="add-image" onClick={() => addImage(resource)}>
                        افزودن به صحنه
                      </DropdownItem>
                    ) : resource.type === "text" ? (
                      [
                        <DropdownItem key="add-text" onClick={() => addText(resource)}>
                          افزودن به صحنه
                        </DropdownItem>,
                        <DropdownItem key="edit-text" onClick={() => editText(resource)}>
                          ویرایش متن اصلی
                        </DropdownItem>,
                        <DropdownItem
                          key="edit-color"
                          onClick={() => {
                            setColorPickerVisible(!colorPickerVisible);
                            setColorPickerResourceId(resource.id); // ست کردن آیتمی که قرار است رنگ آن تغییر کند
                          }}
                        >
                          انتخاب رنگ متن
                        </DropdownItem>,
                      ]
                    ) : resource.type === "web" ? (
                      [
                        <DropdownItem key="add-web" onClick={() => addWeb(resource)}>
                          افزودن به صحنه
                        </DropdownItem>,
                        <DropdownItem key="edit-web" onClick={() => editWeb(resource)}>
                          ویرایش URL
                        </DropdownItem>,
                      ]
                    ) : (
                      <></>
                    )}
                    <DropdownItem key="loop" onClick={() => toggleLoopVideo(resource.id)}>
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

export default ResourcesSidebar;
