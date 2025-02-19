import React, { useState } from "react";
import { Button, Tooltip } from "@nextui-org/react";
import {
  FaPlay,
  FaPause,
  FaTrashAlt,
  FaCog,
  FaRemoveFormat,
  FaArrowDown,
  FaArrowUp,
} from "react-icons/fa";
import ModalMonitorSelection from "../scenes/screen/ModalMonitorSelection";
import { MdAddBox, MdDelete, MdDeleteForever, MdDeleteSweep } from "react-icons/md";
import { SketchPicker } from "react-color";
import { BsArrowDown } from "react-icons/bs";
import { useMyContext } from "@/context/MyContext";

const UsageSidebar = () => {
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [newName, setNewName] = useState("");
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [colorPickerResourceId, setColorPickerResourceId] = useState(null);
  const {
    darkMode,
    setScenes,
    selectedScene,
    sources,
    setSources,
    allDataMonitors,
    getSelectedScene,
    deleteSourceFromScene,
    fitToMonitors,
    sendOperation,
  } = useMyContext();

  let usageSources = null;
  usageSources = sources.filter((item) => item.sceneId === getSelectedScene()?.id) ?? [];

  const updateSourceName = (resourceId, newName, isSource = true) => {
    setSources((prev) =>
      prev.map((item) =>
        (item.id ?? item.uniqId) === resourceId ? { ...item, name: newName } : item
      )
    );
    if (isSource) {
      sendOperation("source", {
        action: "resize",
        id: resourceId,
        payload: {
          name: newName,
        },
      });
    }
    if (isSource == false) {
      setScenes((prevScenes) =>
        prevScenes.map((scene) => {
          if (scene.id === selectedScene) {
            const updatedResources = scene.usageSources.map((resource) => {
              return resource.id === resourceId
                ? { ...resource, name: newName, content: newName }
                : resource;
            });
            return { ...scene, usageSources: updatedResources };
          }
          return scene;
        })
      );
    }
  };

  const updateSourceColor = (resourceId, color) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) =>
        scene.id === selectedScene
          ? {
              ...scene,
              usageSources: scene.usageSources.map((resource) =>
                resource.id === resourceId ? { ...resource, color } : resource
              ),
            }
          : scene
      )
    );

    const textNode = getSelectedScene()?.layer.findOne(`#${resourceId}`);
    if (textNode) {
      textNode.fill(color);
      getSelectedScene()?.layer.draw();
    }
  };

  const handleDoubleClick = (resource) => {
    setEditingResourceId(resource.id);
    setNewName(resource.name);
  };

  const handleNameChange = (e) => {
    setNewName(e.target.value);
  };

  const handleNameSave = (resourceId) => {
    updateSourceName(resourceId, newName);
    setEditingResourceId(null);
    setNewName("");
  };

  const handleColorChange = (color) => {
    setSelectedColor(color.hex);
    if (colorPickerResourceId) {
      updateSourceColor(colorPickerResourceId, color.hex);
    }
  };

  const moveSource = (id, direction) => {
    const resources = [...sources];
    const index = resources.findIndex((res) => res.id === id);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= resources.length) return;

    const updatedResources = [...sources];
    const [movedResource] = updatedResources.splice(index, 1);
    updatedResources.splice(newIndex, 0, movedResource);
    setSources(updatedResources);

    const resourceNode = getSelectedScene()?.layer.findOne(`#${id}`);
    if (resourceNode) {
      if (direction > 0) {
        resourceNode.moveDown();
      } else {
        resourceNode.moveUp();
      }
      getSelectedScene()?.layer.draw();
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
      <div className="sticky top-[-10px] z-[50] px-3 py-[2px] bg-inherit">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md font-semibold">
            ورودی و فایل‌های استفاده شده {`(${usageSources.length})`}
          </h2>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto ">
        <ul className="flex flex-col gap-2">
          {usageSources?.map((resource) => {
            return (
              <li
                key={`${resource.id}-${Math.random()}`}
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
                  {/* {resource.type === "video" && (
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
                  )} */}

                  <Tooltip content="اولویت بالا">
                    <Button
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="light"
                      color="default"
                      onPress={() => moveSource(resource.id, -1)}
                    >
                      <FaArrowUp size={15} />
                    </Button>
                  </Tooltip>
                  <Tooltip content="اولویت پایین">
                    <Button
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="light"
                      color="default"
                      onPress={() => moveSource(resource.id, 1)}
                    >
                      <FaArrowDown size={15} />
                    </Button>
                  </Tooltip>

                  <ModalMonitorSelection
                    item={resource}
                    darkMode={darkMode}
                    videoName={resource.externalId}
                    uniqId={resource.id}
                    monitors={allDataMonitors}
                    fitToMonitors={fitToMonitors}
                  />
                  <Tooltip content="حذف از صحنه">
                    <Button
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      size="sm"
                      variant="light"
                      color="default"
                      onPress={() =>
                        deleteSourceFromScene({
                          id: resource.externalId,
                          getSelectedScene,
                          setSources,
                          sendOperation,
                        })
                      }
                    >
                      <MdDelete size={15} />
                    </Button>
                  </Tooltip>

                  {/* <Dropdown>
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
                      <DropdownItem key="moveUp" onPress={() => moveSource(resource.id, -1)}>
                        بالا
                      </DropdownItem>
                      <DropdownItem key="moveDown" onPress={() => moveSource(resource.id, 1)}>
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
                  </Dropdown> */}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default UsageSidebar;
