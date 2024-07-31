import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import Moveable from "react-moveable";
import { FaPlay, FaPause, FaTrash } from "react-icons/fa";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import "./App.css";

const App2 = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [monitors] = useState([
    { id: 1, name: "Monitor 1", width: 1920, height: 1080, x: 0, y: 0 },
    { id: 2, name: "Monitor 2", width: 1920, height: 1080, x: 1920, y: 0 },
    { id: 3, name: "Monitor 3", width: 1920, height: 1080, x: 0, y: 1080 },
    { id: 4, name: "Monitor 4", width: 1920, height: 1080, x: 1920, y: 1080 },
  ]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const newVideo = {
        name: file.name,
        url: URL.createObjectURL(file),
        id: Date.now(),
        width: 320,
        height: 240,
        x: 100,
        y: 100,
        rotation: 0,
      };
      setVideos([...videos, newVideo]);
    }
  };

  const handleDelete = (id) => {
    setVideos(videos.filter((video) => video.id !== id));
    if (selectedVideo && selectedVideo.id === id) {
      setSelectedVideo(null);
    }
  };

  const handlePlay = (id) => {
    document.getElementById(`video-${id}`).play();
  };

  const handlePause = (id) => {
    document.getElementById(`video-${id}`).pause();
  };

  return (
    <div className="bg-black min-h-screen grid grid-cols-12 relative overflow-hidden">
      <motion.button
        className="fixed top-0 left-0 m-4 p-2 bg-gray-700 text-white rounded z-20"
        onClick={() => setIsNavOpen(!isNavOpen)}
        animate={{ x: isNavOpen ? 256 : 0 }}
        transition={{ duration: 0.3 }}
      >
        Menu
      </motion.button>

      <motion.div
        className="fixed top-0 left-0 bg-gray-800 text-white h-full w-64 z-10"
        animate={{ x: isNavOpen ? 0 : -256 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4">
          <h2 className="text-xl mb-4">مدیریت مانیتورها</h2>
          <ul>
            {monitors.map((monitor) => (
              <li key={monitor.id} className="mb-2">
                {monitor.name} - {monitor.width}x{monitor.height}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4">
          <h2 className="text-xl mb-4">مدیریت محتوا</h2>
          <button
            className="bg-blue-500 text-white p-2 rounded mb-4"
            onClick={() => fileInputRef.current.click()}
          >
            افزودن محتوا
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
          <ul>
            {videos.map((video, index) => (
              <li key={index} className="mb-4">
                <span>{video.name}</span>
                <button
                  className="bg-green-500 text-white p-2 m-2 rounded"
                  onClick={() => handlePlay(video.id)}
                >
                  <FaPlay />
                </button>
                <button
                  className="bg-yellow-500 text-white p-2 m-2 rounded"
                  onClick={() => handlePause(video.id)}
                >
                  <FaPause />
                </button>
                <button
                  className="bg-red-500 text-white p-2 m-2 rounded"
                  onClick={() => handleDelete(video.id)}
                >
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4">
          <h2 className="text-xl mb-4">مدیریت ورودی ها</h2>
        </div>
      </motion.div>

      <div className="app-container">
        <TransformWrapper>
          <TransformComponent>
            <div
              className="col-span-12 p-4 z-0 relative"
              style={{ width: "4000px", height: "3000px" }}
            >
              {monitors.map((monitor) => (
                <div
                  key={monitor.id}
                  className="absolute bg-darkcyan text-white flex items-center justify-center border border-gray-600"
                  style={{
                    width: `${monitor.width}px`,
                    height: `${monitor.height}px`,
                    transform: `translate(${monitor.x}px, ${monitor.y}px)`,
                  }}
                >
                  <div className="text-center">
                    {monitor.name} - {monitor.width}x{monitor.height}
                  </div>
                </div>
              ))}
              {videos.map((video, index) => (
                <div
                  key={index}
                  id={`video-container-${video.id}`}
                  className="absolute"
                  style={{
                    width: `${video.width}px`,
                    height: `${video.height}px`,
                    transform: `translate(${video.x}px, ${video.y}px) rotate(${video.rotation}deg)`,
                    border:
                      selectedVideo && selectedVideo.id === video.id ? "2px solid #00f" : "none",
                  }}
                  onClick={() => setSelectedVideo(video)}
                >
                  <video
                    id={`video-${video.id}`}
                    src={video.url}
                    className="w-full h-full"
                    controls={false}
                  />
                </div>
              ))}
              {selectedVideo && (
                <Moveable
                  target={document.getElementById(`video-container-${selectedVideo.id}`)}
                  container={null}
                  origin={true}
                  edge={false}
                  keepRatio={false}
                  throttleResize={0}
                  draggable={true}
                  resizable={true}
                  scalable={true}
                  rotatable={true}
                  throttleDrag={0}
                  renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
                  throttleRotate={0}
                  onDrag={(e) => {
                    const updatedVideos = videos.map((video) => {
                      if (video.id === selectedVideo.id) {
                        return { ...video, x: e.left, y: e.top };
                      }
                      return video;
                    });
                    setVideos(updatedVideos);
                    e.target.style.transform = `translate(${e.left}px, ${e.top}px) rotate(${selectedVideo.rotation}deg)`;
                  }}
                  onResize={(e) => {
                    const updatedVideos = videos.map((video) => {
                      if (video.id === selectedVideo.id) {
                        let beforeTranslate = e.drag.beforeTranslate;
                        return {
                          ...video,
                          width: e.width,
                          height: e.height,
                          x: video.x + beforeTranslate[0],
                          y: video.y + beforeTranslate[1],
                        };
                      }
                      return video;
                    });
                    setVideos(updatedVideos);
                    e.target.style.width = `${e.width}px`;
                    e.target.style.height = `${e.height}px`;
                    e.target.style.transform = `translate(${selectedVideo.x}px, ${selectedVideo.y}px) rotate(${selectedVideo.rotation}deg)`;
                  }}
                  onRotate={(e) => {
                    const updatedVideos = videos.map((video) => {
                      if (video.id === selectedVideo.id) {
                        return { ...video, rotation: e.rotate };
                      }
                      return video;
                    });
                    setVideos(updatedVideos);
                    e.target.style.transform = `translate(${selectedVideo.x}px, ${selectedVideo.y}px) rotate(${e.rotate}deg)`;
                  }}
                />
              )}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
};

export default App2;
