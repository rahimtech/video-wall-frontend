import React, { useState, useRef } from "react";
import { Rnd } from "react-rnd";
import {
  FaPlus,
  FaMoon,
  FaSun,
  FaTrashAlt,
  FaArrowUp,
  FaArrowDown,
  FaAngleDown,
  FaAngleUp,
  FaSyncAlt,
} from "react-icons/fa";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tooltip,
} from "@nextui-org/react";
import "./App.css";
import Swal from "sweetalert2";
import { Add } from "@mui/icons-material";
import "./input.css";
import { motion } from "framer-motion";

const VideoWallController = () => {
  const [scenes, setScenes] = useState([{ id: 1, name: "Scene 1", resources: [] }]);
  const [selectedScene, setSelectedScene] = useState(1);
  const [showSelectBox, setShowSelectBox] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [editingSceneId, setEditingSceneId] = useState(null);
  const [isBottomControlsVisible, setIsBottomControlsVisible] = useState(true);
  let rotationAnchorActive = false;
  const addScene = () => {
    const newScene = {
      id: Date.now(),
      name: `Scene ${scenes.length + 1}`,
      resources: [],
    };
    setScenes([...scenes, newScene]);
    setSelectedScene(newScene.id);
  };

  const deleteScene = (id) => {
    const updatedScenes = scenes.filter((scene) => scene.id !== id);
    setScenes(updatedScenes);
    if (selectedScene === id && updatedScenes.length > 0) {
      setSelectedScene(updatedScenes[0].id);
    }
  };

  const addResource = (type) => {
    const newResource = {
      id: Date.now(),
      type,
      content: "",
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      rotation: 0,
    };

    if (type === "video" || type === "image") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = type === "video" ? "video/*" : "image/*";
      input.onchange = (e) => handleFileInput(e, newResource);
      input.click();
    } else if (type === "text") {
      Swal.fire({
        title: "Enter your text:",
        input: "text",
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          newResource.content = result.value;
          updateSceneResources([...getSelectedScene().resources, newResource]);
        }
      });
    } else if (type === "web") {
      Swal.fire({
        title: "Enter the URL:",
        input: "text",
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          newResource.content = result.value;
          updateSceneResources([...getSelectedScene().resources, newResource]);
        }
      });
    }
    setShowSelectBox(false);
  };

  const handleFileInput = (e, resource) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        resource.content = event.target.result;
        updateSceneResources([...getSelectedScene().resources, resource]);
      };
      reader.readAsDataURL(file);
    }
  };

  const getSelectedScene = () => scenes.find((scene) => scene.id === selectedScene);

  const updateSceneResources = (updatedResources) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) =>
        scene.id === selectedScene ? { ...scene, resources: updatedResources } : scene
      )
    );
  };

  const deleteResource = (id) => {
    updateSceneResources(getSelectedScene()?.resources.filter((res) => res.id !== id));
  };

  const moveResource = (id, direction) => {
    const resources = getSelectedScene()?.resources;
    const index = resources.findIndex((res) => res.id === id);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= resources.length) return;

    const updatedResources = [...resources];
    const [movedResource] = updatedResources.splice(index, 1);
    updatedResources.splice(newIndex, 0, movedResource);

    updateSceneResources(updatedResources);
  };

  const handleEditSceneName = (id, newName) => {
    setScenes((prevScenes) =>
      prevScenes.map((scene) => (scene.id === id ? { ...scene, name: newName } : scene))
    );
    setEditingSceneId(null);
  };

  const rotateResource = (id, angle) => {
    const resources = getSelectedScene()?.resources;
    const updatedResources = resources.map((res) =>
      res.id === id ? { ...res, rotation: (res.rotation + angle) % 360 } : res
    );
    console.log("updatedResources::: ", updatedResources);
    updateSceneResources(updatedResources);
  };

  const startRotation = (e, resource) => {
    e.preventDefault();
    rotationAnchorActive = true;
    // پیدا کردن موقعیت اولیه موس و چرخش اولیه
    const initialX = e.clientX;
    const initialRotation = resource.rotation;

    const onMouseMove = (event) => {
      if (rotationAnchorActive) {
        // محاسبه تغییرات موس به صورت افقی
        const deltaX = event.clientX - initialX;
        const newAngle = initialRotation + deltaX * 0.5; // هرچه deltaX بیشتر باشد، زاویه بیشتر تغییر می‌کند

        // به‌روزرسانی منابع با زاویه جدید
        const updatedResources = getSelectedScene().resources.map((res) =>
          res.id === resource.id ? { ...res, rotation: newAngle } : res
        );
        updateSceneResources(updatedResources);
      }
    };

    const onMouseUp = () => {
      rotationAnchorActive = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    // افزودن رویدادهای موس برای حرکت و رها کردن
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      className={`flex flex-col h-screen vazir ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      <div className="flex items-center justify-between p-4 absolute left-0 top-0 z-10">
        <Button
          auto
          ghost
          className="min-w-fit h-fit p-1"
          color="primary"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </Button>
      </div>
      {/* Main Scene */}
      <div className="flex-1 p-4 relative">
        {getSelectedScene()?.resources.map((resource) => (
          <Rnd
            key={resource.id}
            default={{
              x: resource.x,
              y: resource.y,
              width: resource.width,
              height: resource.height,
            }}
            bounds="parent"
            style={{
              border: "2px solid #4A90E2",
              background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
              cursor: "move",
              borderRadius: "8px",
              rotate: `${resource.rotation}deg`, // چرخش اعمال شده
              transformOrigin: "center", // نقطه‌ی چرخش در وسط قرار داده شده
            }}
            dragHandleClassName="handle"
            onDragStop={(e, d) => {
              const updatedResources = getSelectedScene().resources.map((res) =>
                res.id === resource.id ? { ...res, x: d.x, y: d.y } : res
              );
              updateSceneResources(updatedResources);
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              const updatedResources = getSelectedScene().resources.map((res) =>
                res.id === resource.id
                  ? {
                      ...res,
                      width: ref.offsetWidth,
                      height: ref.offsetHeight,
                      x: position.x,
                      y: position.y,
                    }
                  : res
              );
              updateSceneResources(updatedResources);
            }}
          >
            <div className="handle bg-blue-600 w-full text-white p-1 rounded-t-md">
              {resource.type}
              <button className="text-red-500 ml-2" onClick={() => deleteResource(resource.id)}>
                Delete
              </button>
              <button
                className="text-yellow-500 ml-2"
                onClick={() => moveResource(resource.id, -1)}
              >
                Up
              </button>
              <button className="text-yellow-500 ml-2" onClick={() => moveResource(resource.id, 1)}>
                Down
              </button>
              <button
                className="text-green-500 ml-2"
                onClick={() => rotateResource(resource.id, 15)} // فراخوانی تابع چرخش
              >
                Rotate
              </button>
            </div>
            <div className="w-full h-full relative">
              {/* محتوای رندر شده */}
              <div className="w-full h-full">
                {resource.type === "video" && resource.content && (
                  <video
                    src={resource.content}
                    controls
                    className="w-full h-full object-cover rounded-b-md"
                  />
                )}
                {resource.type === "image" && resource.content && (
                  <img
                    src={resource.content}
                    alt="Resource"
                    className="w-full h-full object-cover rounded-b-md"
                  />
                )}
                {resource.type === "text" && resource.content && (
                  <div className="p-2 text-center text-lg rounded-b-md">{resource.content}</div>
                )}
                {resource.type === "web" && resource.content && (
                  <iframe
                    src={resource.content}
                    title="Web Content"
                    className="w-full h-full rounded-b-md"
                  />
                )}
              </div>
              {/* Anchor چرخش */}
              <div
                className="absolute left-0 right-[-20px] top-0 w-4 h-4 bg-green-500 rounded-full cursor-pointer"
                onMouseDown={(e) => startRotation(e, resource)}
              ></div>
            </div>
          </Rnd>
        ))}
      </div>

      {/* Bottom Controls */}
      <motion.div
        className="flex w-full h-[230px] border-t overflow-y-auto items-center"
        style={{ backgroundColor: isDarkMode ? "#222" : "#fff" }}
        animate={{ height: isBottomControlsVisible ? "230px" : "0px" }}
        transition={{ duration: 0.5 }}
      >
        {isBottomControlsVisible && (
          <>
            {/* Scenes Sidebar */}
            <div
              dir="rtl"
              className="w-1/4 p-2 border-r h-full overflow-auto"
              style={{ backgroundColor: isDarkMode ? "#333" : "#f4f4f4" }}
            >
              <div className="flex justify-between px-2 items-center mb-5">
                <h2 className="text-md font-semibold">Scenes</h2>
                <Button
                  auto
                  color="default"
                  className="block p-0 text-sm  min-w-fit w-fit h-fit rounded-sm"
                  onClick={addScene}
                >
                  <Add />
                </Button>
              </div>
              <ul>
                {scenes.map((scene) => (
                  <li key={scene.id} className="mb-1 flex items-center justify-between">
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
                        className={`p-2 cursor-pointer flex justify-between rounded-md transition-colors duration-200 flex-grow ${
                          selectedScene === scene.id
                            ? "bg-blue-500 text-white"
                            : isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600"
                            : "bg-gray-300 hover:bg-gray-400"
                        }`}
                        onDoubleClick={() => setEditingSceneId(scene.id)}
                        onClick={() => setSelectedScene(scene.id)}
                      >
                        {scene.name}
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

            {/* Sources Sidebar */}
            <div
              dir="rtl"
              className="w-1/4 p-2 h-full"
              style={{ backgroundColor: isDarkMode ? "#333" : "#f4f4f4" }}
            >
              <div className="flex justify-between px-2 items-center mb-5">
                <h2 className="text-md font-semibold">منابع</h2>

                <Dropdown dir="rtl" className="vazir">
                  <DropdownTrigger>
                    <Button
                      auto
                      color="default"
                      className="block p-0 text-sm  min-w-fit w-fit h-fit rounded-sm"
                    >
                      <Add />
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

              <div className="mt-2">
                <ul>
                  {getSelectedScene()?.resources.map((resource) => (
                    <li
                      key={resource.id}
                      className={`mb-1 text-sm flex items-center justify-between ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-200"
                      }  p-2 rounded-lg`}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{resource.type.toUpperCase()}</span>
                        <span className="text-xs text-gray-500">
                          {resource.content ? "Loaded" : "Not Loaded"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          className="text-red-500 min-w-fit h-fit p-1"
                          size="sm"
                          variant="flat"
                          color="default"
                          onClick={() => deleteResource(resource.id)}
                          title="Delete Resource"
                        >
                          <FaTrashAlt />
                        </Button>
                        <Button
                          className=" min-w-fit h-fit p-1"
                          size="sm"
                          variant="flat"
                          color="default"
                          onClick={() => moveResource(resource.id, -1)}
                          title="Move Up"
                        >
                          <FaArrowUp />
                        </Button>
                        <Button
                          className=" min-w-fit h-fit p-1"
                          size="sm"
                          variant="flat"
                          color="default"
                          onClick={() => moveResource(resource.id, 1)}
                          title="Move Down"
                        >
                          <FaArrowDown />
                        </Button>
                        <Button
                          className="text-green-500 min-w-fit h-fit p-1"
                          size="sm"
                          variant="flat"
                          color="default"
                          onClick={() => rotateResource(resource.id, 15)}
                          title="Rotate"
                        >
                          <FaSyncAlt />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Toggle Bottom Controls Button */}
      <div className="absolute right-0 bottom-0 transform -translate-x-1/2 mb-2">
        <Button
          auto
          ghost
          className="min-w-fit h-fit p-2"
          onClick={() => setIsBottomControlsVisible(!isBottomControlsVisible)}
        >
          {isBottomControlsVisible ? <FaAngleDown /> : <FaAngleUp />}
        </Button>
      </div>
    </div>
  );
};

export default VideoWallController;
