import React from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@nextui-org/react";
import { FaPlay, FaPause, FaArrowUp, FaArrowDown, FaTrashAlt, FaCog } from "react-icons/fa";
import ModalMonitorSelection from "./ModalMonitorSelection"; // فرض کنید کامپوننت مودال شما اینجاست
import { MdAddBox } from "react-icons/md";

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
}) => {
  return (
    <div
      dir="rtl"
      className={`w-1/4 p-3 h-full border-r border-white flex flex-col justify-between bg-gray-800 overflow-hidden`}
      style={{
        backgroundColor: darkMode ? "#1a1a1a" : "#eaeaea",
        color: darkMode ? "#ffffff" : "#000000",
      }}
    >
      <div className="flex justify-between px-3 items-center mb-3">
        <h2 className="text-md font-semibold">منابع</h2>
        <Dropdown dir="rtl" className="vazir">
          <DropdownTrigger>
            <Button
              auto
              color="default"
              className="block p-0 text-xl  min-w-fit w-fit h-fit rounded-sm"
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
              className={`text-sm flex items-center justify-between ${
                darkMode ? "bg-gray-700" : "bg-gray-300"
              } p-3 rounded-md shadow-sm`}
            >
              <div className="flex items-center">
                <span className="mr-2">{resource.name}</span>
              </div>
              <div className="flex items-center gap-1">
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
                    <DropdownItem key="add" onClick={() => addVideo(resource.videoElement)}>
                      افزودن به صحنه
                    </DropdownItem>
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
