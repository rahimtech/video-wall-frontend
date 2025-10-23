import Konva from "konva";

import Swal from "sweetalert2";

export const addMonitorsToScenes = ({ jsonData, scenes, setScenes }) => {
  if (!jsonData || !Array.isArray(jsonData)) {
    Swal.fire({
      title: "خطا",
      text: "فرمت داده‌های JSON اشتباه است.",
      icon: "error",
      confirmButtonText: "باشه",
    });
    return;
  }

  const step = 5;
  const updatedScenes = scenes.map((scene) => {
    const layer = scene.layer;

    if (layer) {
      layer.destroyChildren();
    }

    let updatedVideoWalls = [...jsonData];

    jsonData.forEach((monitor, index) => {
      const group = new Konva.Group({
        x: monitor.x,
        y: monitor.y,
        clip: { x: 0, y: 0, width: monitor.width, height: monitor.height },
        draggable: false,
        id: `monitor-group-${monitor.id}`,
        catFix: "monitor",
        index: 2,
      });

      const rect = new Konva.Rect({
        x: 0,
        y: 0,
        catFix: "monitor",
        width: monitor.width,
        height: monitor.height,
        fill: monitor.connected ? "#161616" : "red",
        stroke: "white",
        name: "fillShape",
        strokeWidth: 3,
        id: `monitor-${index}`,
      });

      // const text2 = new Konva.Text({
      //   x: 10,
      //   y: 10,
      //   text: monitor.connected
      //     ? `VideoWall ${monitor.id}\nX: ${monitor.x}, Y: ${monitor.y}`
      //     : `VideoWall ${monitor.id} (Disconnected)`,
      //   fontSize: 50,
      //   fill: "white",
      //   align: "left",
      //   verticalAlign: "top",
      //   name: "monitorText",
      // });

      const text = new Konva.Text({
        x: 10,
        y: 10,
        text: monitor.connected
          ? `VideoWall ${monitor.name}`
          : `VideoWall ${monitor.id} (Disconnected)`,
        fontSize: 50,
        fill: "white",
        align: "left",
        verticalAlign: "top",
        name: "monitorText",
      });

      if (!monitor.connected) {
        const disconnectIcon = new Konva.Text({
          text: "❌",
          fontSize: 30,
          fill: "white",
          x: rect.width() / 2 - 15,
          y: rect.height() / 2 - 15,
          name: "disconnectIcon",
        });
        group.add(disconnectIcon);
      }

      let previousPosition = { x: monitor.x, y: monitor.y };

      group.on("dragmove", (e) => {
        const { x, y } = e.target.position();
        const newX = Math.round(x / step) * step;
        const newY = Math.round(y / step) * step;

        const textNode = group.findOne(".monitorText");
        textNode.text(`VideoWall ${index + 1}\nX: ${newX}, Y: ${newY}`);

        e.target.position({ x: newX, y: newY });
      });

      group.on("dragend", (e) => {
        const targetRect = group.getClientRect();

        let hasCollision = false;

        layer.children.forEach((otherGroup) => {
          if (otherGroup === group) return;
          const otherRect = otherGroup.getClientRect();
          if (
            !(
              targetRect.x + targetRect.width <= otherRect.x ||
              targetRect.x >= otherRect.x + otherRect.width ||
              targetRect.y + targetRect.height <= otherRect.y ||
              targetRect.y >= otherRect.y + otherRect.height
            )
          ) {
            hasCollision = true;
          }
        });

        if (hasCollision) {
          rect.fill("red");
          setTimeout(() => {
            rect.fill(monitor.connected ? "#161616" : "red");
            layer.draw();
          }, 500);
          e.target.position(previousPosition);
        } else {
          const newX = e.target.x();
          const newY = e.target.y();
          previousPosition = { x: newX, y: newY };

          updatedVideoWalls = videoWallsRef.current;
          const monitorIndex = updatedVideoWalls.findIndex((m) => m.id === monitor.id);
          if (monitorIndex !== -1) {
            updatedVideoWalls[monitorIndex] = {
              ...updatedVideoWalls[monitorIndex],
              x: newX,
              y: newY,
            };
          }
          arrangeMForScenes(updatedVideoWalls);
        }

        layer.draw();
        setVideoWalls(updatedVideoWalls);
      });

      group.add(rect);
      group.add(text);
      // group.add(text2);

      layer.add(group);
      group.zIndex(0);
    });

    layer.draw();
    return scene;
  });
  return updatedScenes;
};

export const arrangeMForScenes = (updatedVideoWalls) => {
  let minX = Infinity;
  let minY = Infinity;
  let primaryMonitor = null;

  updatedVideoWalls.forEach((wall) => {
    if (wall.x < minX || (wall.x === minX && wall.y < minY)) {
      minX = wall.x;
      minY = wall.y;
      primaryMonitor = wall["Monitor ID"];
    }
  });

  updatedVideoWalls.forEach((wall) => {
    wall.primary = wall["Monitor ID"] === primaryMonitor ? "Yes" : "No";
  });

  sendOperation(
    "arrange-displays",
    updatedVideoWalls.map((item) => ({
      "Monitor ID": item["Monitor ID"],
      x: item.x,
      y: item.y,
      primary: item.primary, // `primary`
    }))
  );

  if (connectionMode === true) {
    setIsLoading(true);
  }

  const updatedScenesIn = scenesRef.current.map((scene) => {
    const layer = scene.layer;
    if (!layer) return scene;

    const monitors = layer.children;

    monitors.forEach((group) => {
      if (group.attrs.catFix === "monitor") {
        group.draggable(isToggleVideoWall);

        const monitorId = parseInt(group.id().split("-")[2], 10);

        const matchingWall = updatedVideoWalls.find((wall) => parseInt(wall.id) === monitorId);

        if (matchingWall) {
          const { x: newX, y: newY } = matchingWall;
          group.position({ x: newX, y: newY });

          const textNode = group.findOne(".monitorText");
          if (textNode) {
            textNode.text(`VideoWall ${monitorId}\nX: ${newX}, Y: ${newY}`);
          }
        }
      }
    });

    layer.draw();
    return scene;
  });

  setScenes(updatedScenesIn);
};

export const arrangeMonitors = (rows, cols) => {
  let x = null;
  const updatedScenes = scenes.map((scene) => {
    const layer = scene.layer;

    if (!layer) return scene;

    const monitors = layer.children;
    const totalMonitors = monitors.length;

    const gap = 10;

    const updatedVideoWalls = [...videoWalls];
    const monitorWidth = videoWalls[0].width;
    const monitorHeight = videoWalls[0].height;

    let monitorIndex = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (monitorIndex >= totalMonitors) break;

        const x = col * (monitorWidth + gap);
        const y = row * (monitorHeight + gap);

        const group = monitors[monitorIndex];
        const monitorId = parseInt(group.id().split("-")[2], 10);

        group.position({ x, y });

        const textNode = group.findOne("Text");
        if (textNode) {
          textNode.text(`VideoWall ${monitorId}\nX: ${x}, Y: ${y}`);
        }

        const wallIndex = updatedVideoWalls.findIndex((m) => m.id === monitorId);
        if (wallIndex !== -1) {
          updatedVideoWalls[wallIndex] = { ...updatedVideoWalls[wallIndex], x, y };
        }

        monitorIndex++;
      }
    }

    layer.draw();
    x = updatedVideoWalls;
    setVideoWalls(updatedVideoWalls);

    return scene;
  });

  setIsLoading(true);
  sendOperation(
    "arrange-displays",
    x.map((item, i) => ({
      "Monitor ID": item["Monitor ID"],
      x: item.x,
      y: item.y,
      primary: i === 0 ? "Yes" : "No",
    }))
  );

  setScenes(updatedScenes);
};

export const generateMonitorsForLayer = (layer, monitors, setMonitorConnection) => {
  if (!layer || !monitors) return;
  const step = 5;

  if (layer) {
    layer.destroyChildren();
  }

  let updatedVideoWalls = [...monitors];

  monitors.forEach((monitor, index) => {
    const group = new Konva.Group({
      x: monitor.x,
      y: monitor.y,
      clip: { x: 0, y: 0, width: monitor.width, height: monitor.height },
      draggable: true,
      id: `monitor-group-${monitor.id}`,
      catFix: "monitor",
    });

    const isConnected = monitor.connected;
    setMonitorConnection(isConnected);
    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      catFix: "monitor",
      width: monitor.width,
      height: monitor.height,
      fill: isConnected ? "#161616" : "red",
      stroke: "white",
      name: "fillShape",
      strokeWidth: 3,
      id: `monitor-${monitor.id}`,
    });

    const text = new Konva.Text({
      x: 10,
      y: 10,
      text: isConnected ? `VideoWall ${monitor.name}` : `VideoWall ${monitor.name} (Disconnected)`,
      fontSize: 50,
      fill: "white",
      align: "left",
      verticalAlign: "top",
      name: "monitorText",
    });

    if (!isConnected) {
      const disconnectIcon = new Konva.Text({
        text: "❌",
        fontSize: 30,
        fill: "white",
        x: monitor.width / 2 - 15,
        y: monitor.height / 2 - 15,
        name: "disconnectIcon",
      });
      group.add(disconnectIcon);
    }

    let previousPosition = { x: monitor.x, y: monitor.y };

    group.on("dragmove", (e) => {
      const { x, y } = e.target.position();
      const newX = Math.round(x / step) * step;
      const newY = Math.round(y / step) * step;

      const textNode = group.findOne(".monitorText");
      textNode.text(`VideoWall ${index + 1}\nX: ${newX}, Y: ${newY}`);

      e.target.position({ x: newX, y: newY });
    });

    group.on("dragend", (e) => {
      const targetRect = group.getClientRect();

      let hasCollision = false;

      layer.children.forEach((otherGroup) => {
        if (otherGroup === group) return;
        const otherRect = otherGroup.getClientRect();
        if (
          !(
            targetRect.x + targetRect.width <= otherRect.x ||
            targetRect.x >= otherRect.x + otherRect.width ||
            targetRect.y + targetRect.height <= otherRect.y ||
            targetRect.y >= otherRect.y + otherRect.height
          )
        ) {
          hasCollision = true;
        }
      });

      if (hasCollision) {
        rect.fill("red");
        setTimeout(() => {
          rect.fill(isConnected ? "#161616" : "red");
          layer.draw();
        }, 500);
        e.target.position(previousPosition);
      } else {
        const newX = e.target.x();
        const newY = e.target.y();
        previousPosition = { x: newX, y: newY };

        updatedVideoWalls = videoWallsRef.current;

        const monitorIndex = updatedVideoWalls.findIndex((m) => m.id === monitor.id);
        if (monitorIndex !== -1) {
          updatedVideoWalls[monitorIndex] = {
            ...updatedVideoWalls[monitorIndex],
            x: newX,
            y: newY,
          };
        }

        arrangeMForScenes(updatedVideoWalls);
      }

      layer.draw();
      setVideoWalls(updatedVideoWalls);
    });

    group.add(rect);
    group.add(text);

    layer.add(group);
    group.zIndex(0);
  });

  layer.draw();
};
