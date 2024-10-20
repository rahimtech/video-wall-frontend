import React, { useState } from "react";
import { Rnd } from "react-rnd";
import { Button } from "@nextui-org/react";
import { FaSearchPlus, FaSearchMinus } from "react-icons/fa";

const ZoomableOpenWorldScene = ({
  getSelectedScene,
  updateSceneResources,
  deleteResource,
  moveResource,
  rotateResource,
  startRotation,
  isDarkMode,
}) => {
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 3)); // حداکثر تا 3 برابر زوم کنیم
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5)); // حداقل تا نصف اندازه زوم کنیم
  };

  return (
    <div className="flex-1 p-4 relative overflow-scroll" style={{ width: "100%", height: "100%" }}>
      {/* دکمه‌های Zoom In و Zoom Out */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button auto ghost color="primary" onClick={handleZoomIn}>
          <FaSearchPlus />
        </Button>
        <Button auto ghost color="primary" onClick={handleZoomOut}>
          <FaSearchMinus />
        </Button>
      </div>

      {/* کانتینر اصلی که قابلیت زوم دارد */}
      <div
        className="absolute top-0 left-0"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${100 / scale}%`,
          height: `${100 / scale}%`,
          position: "relative",
        }}
      >
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
                onClick={() => rotateResource(resource.id, 15)}
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
    </div>
  );
};

export default ZoomableOpenWorldScene;
