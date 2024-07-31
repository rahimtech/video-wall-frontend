import React, { useState, useEffect, useRef } from "react";
import { ThemeProvider, createTheme, CssBaseline, Box, Button } from "@mui/material";
import Navbar from "./components/Navbar";
import VideoManager from "./components/VideoManager";
import KonvaStage from "./components/KonvaStage";
import { useMyContext } from "../context/MyContext";
import io from "socket.io-client";
import config from "../../public/config.json";
import Konva from "konva";

let socket = null;

const App3 = () => {
  const [videoWalls, setVideoWalls] = useState([
    { x: 0, y: 0, width: 1920, height: 1080 },
    { x: 1920, y: 0, width: 1920, height: 1080 },
    // سایر مانیتورها ...
  ]);

  const [loopVideos, setLoopVideos] = useState({});
  const [content, setContent] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [allData, setAllData] = useState([]);
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  let host = config.host;
  let port = config.port;

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/config.json");
        const data = await response.json();
        if (data.host) host = data.host;
        if (data.port) port = data.port;
        socket = io(`http://${data.host}:${data.port}`);

        socket.on("connect", () => {
          setConnecting(true);
        });

        socket.on("init", (data) => {
          // Handle initialization data
        });

        socket.on("update-event", (data) => {
          // Handle update event
        });

        socket.on("update-cameras", (data) => {
          // Handle camera update
        });

        socket.on("update-monitors", (displays) => {
          // Handle monitors update
        });

        stageRef.current = new Konva.Stage({
          container: "containerKonva",
          width: window.innerWidth,
          height: window.innerHeight,
          draggable: true,
        });

        layerRef.current = new Konva.Layer();
        stageRef.current.add(layerRef.current);

        stageRef.current.scale({ x: 0.17, y: 0.17 });
        stageRef.current.position({ x: 500, y: 400 });

        const anim = new Konva.Animation(() => {}, layerRef.current);
        anim.start();
      } catch (err) {
        console.warn("Failed to fetch config.json", err);
      }
    }
    fetchData();

    return () => {
      if (stageRef.current) stageRef.current.destroy();
      if (layerRef.current) layerRef.current.destroy();
    };
  }, []);

  const fitToMonitors = (videoName, selectedMonitors) => {
    if (selectedMonitors.length === 0) {
      console.warn("No monitors selected");
      return;
    }

    const firstMonitor = allDataMonitors[selectedMonitors[0]];
    const lastMonitor = allDataMonitors[selectedMonitors[selectedMonitors.length - 1]];

    if (!firstMonitor || !lastMonitor) {
      console.error("Invalid monitor selection");
      return;
    }

    const x = firstMonitor.x;
    const y = firstMonitor.y;
    const width = lastMonitor.x + lastMonitor.width - firstMonitor.x;
    const height = lastMonitor.y + lastMonitor.height - firstMonitor.y;

    const videoGroup = layerRef.current.findOne(`#${videoName}`);
    if (videoGroup) {
      videoGroup.position({ x, y });
      videoGroup.width(width);
      videoGroup.height(height);
      layerRef.current.draw();

      const modifiedVideoURL = changeBlobURL(`video:http://${host}:${port}`, videoName);

      socket.emit("source", {
        action: "resize",
        id: videoName,
        payload: {
          source: modifiedVideoURL,
          x,
          y,
          width,
          height,
        },
      });

      setAllData((prevData) =>
        prevData.map((item) => (item.name === videoName ? { ...item, x, y, width, height } : item))
      );
    }
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: "100vh", bgcolor: "background.default", color: "text.primary" }}>
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onAddContent={addContent}
          connecting={connecting}
        />
        <Box display="flex" height="calc(100% - 64px)">
          <Box
            width="250px"
            p={2}
            bgcolor="background.paper"
            borderRight="1px solid rgba(0, 0, 0, 0.12)"
          >
            <VideoManager
              videos={content}
              onPlay={playVideo}
              onPause={pauseVideo}
              onReset={resetVideo}
              onDelete={deleteContent}
              onToggleLoop={toggleLoop}
              allDataMonitors={videoWalls}
              fitToMonitors={fitToMonitors}
            />
          </Box>
          <Box flexGrow={1}>
            <KonvaStage ref={{ stageRef, layerRef }} videos={content} />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App3;
