import Konva from "konva";

import { v4 as uuidv4 } from "uuid";
import api from "../../../../api/api";

export const addVideo = ({
  videoElement,
  mode = true,
  getSelectedScene,
  setSources,
  sendOperation,
  url,
  loopVideos,
}) => {
  let uniqId = mode ? uuidv4() : videoElement.externalId;
  // let uniqId = videoElement.externalId;

  const targetX = Number.isFinite(videoElement?.x) ? videoElement.x : 0;
  const targetY = Number.isFinite(videoElement?.y) ? videoElement.y : 0;
  const selectedSceneLayer = getSelectedScene()?.layer;
  let selectedStage = null;
  if (mode) {
    selectedStage = getSelectedScene()?.stageData;
  }

  if (!selectedSceneLayer) return;
  const anim = new Konva.Animation(function () {
    // do nothing, animation just needs to update the layer
  }, selectedSceneLayer);
  const modifiedVideoURL =
    videoElement.type === "VIDEO"
      ? mode
        ? `video:${url}/${videoElement.content}`
        : `video:${videoElement.videoElement.src}`
      : `video:${videoElement.content}`;

  // videoElement.videoElement.src = `${url}/uploads/${videoElement.name}`;

  if (mode) {
    sendOperation("source", {
      action: "add",
      id: String(uniqId),
      payload: {
        source: modifiedVideoURL,
        x: targetX,
        y: targetY,
        z: videoElement?.z,
        width: videoElement.videoElement.width || videoElement.videoElement.videoWidth,
        height: videoElement.videoElement.height || videoElement.videoElement.videoHeight,
        name: videoElement.name,
        type: videoElement.type,
        sceneId: getSelectedScene().id,
        content: videoElement.content,
        mediaId: videoElement.id,
        externalId: uniqId,
        metadata: {},
      },
    });
  }

  if (mode) {
    const text = new Konva.Text({
      x: 0,
      y: 0,
      text: `${videoElement.name}\n(${videoElement.type})`,
      fontSize: 30,
      fill: "black",
      fontFamily: "Arial",
      padding: 5,
      id: String(uniqId),
      uniqId,
      align: "center",
      width: videoElement.videoElement.videoWidth,
      ellipsis: true,
    });

    const group = new Konva.Group({
      x: mode ? targetX : videoElement.x,
      y: mode ? targetY : videoElement.y,
      draggable: false,
      id: String(uniqId),
      uniqId,
      rotation: videoElement.rotation || 0,
    });

    const image = new Konva.Image({
      image: videoElement.videoElement,
      width: videoElement.videoElement.width || videoElement.videoElement.videoWidth,
      height: videoElement.videoElement.height || videoElement.videoElement.videoHeight,
      name: "object",
      fill: "gray",
      id: String(videoElement.id),
      uniqId,
      stroke: "white",
      strokeWidth: 2,
      x: 0,
      y: 0,
      // rotation: videoElement.rotation || 0,
    });

    group.add(image);
    group.add(text);

    selectedSceneLayer.add(group);

    setSources((prev) => [
      ...prev,
      { ...videoElement, externalId: uniqId, sceneId: getSelectedScene().id },
    ]);
    selectedStage.add(selectedSceneLayer);

    const transformer = new Konva.Transformer({
      nodes: [group],
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
      rotateEnabled: true,
      id: String(uniqId),
    });
    transformer.flipEnabled(false);

    group.on("click", () => {
      group.draggable(true);

      selectedSceneLayer.add(transformer);
      transformer.attachTo(group);
      selectedSceneLayer.draw();
    });

    transformer.on("transformend", (e) => {
      const newWidth = image.width() * group.scaleX();
      const newHeight = image.height() * group.scaleY();

      const rotation = Math.round(group.getAttr("rotation"));
      const x = group.x();
      const y = group.y();

      sendOperation("source", {
        action: "resize",
        id: e.target.attrs.uniqId,
        payload: {
          // source: modifiedVideoURL,
          x,
          y,
          width: newWidth,
          height: newHeight,
          rotation,
        },
      });

      setSources((prev) =>
        prev.map((item) =>
          item.uniqId === e.target.attrs.uniqId
            ? {
                ...item,
                x,
                y,
                width: newWidth,
                height: newHeight,
                rotation,
                sceneId: getSelectedScene().id,
              }
            : item
        )
      );
    });

    group.on("dragend", (e) => {
      const { x, y } = e.target.position();

      setSources((prev) =>
        prev.map((item) =>
          item.uniqId === e.target.attrs.uniqId
            ? { ...item, x, y, sceneId: getSelectedScene().id }
            : item
        )
      );
      sendOperation("source", {
        action: "move",
        id: e.target.attrs.uniqId,
        payload: { x, y },
      });

      selectedSceneLayer.draw();
    });

    // videoElement.loop = loopVideos[videoElement.name] || false;

    videoElement.videoElement.loop = true;
    // videoElement.videoElement.play();
    videoElement.videoElement.muted = true;

    // anim.start();
  } else {
    const v = videoElement.videoElement;

    // 1) قبل از هر کاری، اتریبیوت‌ها را ست کن
    v.muted = true;
    v.defaultMuted = true;
    v.volume = 0;
    v.playsInline = true;
    v.webkitPlaysInline = true; // iOS
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.crossOrigin = v.crossOrigin || "anonymous";

    // 2) به جای loadeddata از loadedmetadata استفاده کن
    // const onMeta = async () => {
    //   v.removeEventListener("loadedmetadata", onMeta);

    const text = new Konva.Text({
      x: 0,
      y: 0,
      text: `${videoElement.name}\n(${videoElement.type})`,
      fontSize: 30,
      fill: "black",
      fontFamily: "Arial",
      padding: 5,
      id: String(uniqId),
      uniqId,
      align: "center",
      width: videoElement.width,
      ellipsis: true,
    });

    const group = new Konva.Group({
      x: mode ? targetX : videoElement.x,
      y: mode ? targetY : videoElement.y,
      draggable: false,
      uniqId,
      id: String(uniqId),
      rotation: videoElement.rotation || 0,
    });

    const vw = videoElement.width || v.videoWidth || 640;
    const vh = videoElement.height || v.videoHeight || 360;

    const image = new Konva.Image({
      image: v,
      width: vw,
      height: vh,
      name: "object",
      fill: "gray",
      id: String(uniqId),
      stroke: "white",
      strokeWidth: 2,
      uniqId,
      x: 0,
      y: 0,
    });

    group.add(image);
    group.add(text);

    const node = getSelectedScene()?.layer;
    console.log("node::: ", node);

    selectedSceneLayer.add(group);
    if (mode) selectedStage.add(selectedSceneLayer);
    const transformer = new Konva.Transformer({
      nodes: [group],
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
      rotateEnabled: true,
      id: String(uniqId),
    });
    transformer.flipEnabled(false);

    group.on("click", () => {
      group.draggable(true);

      selectedSceneLayer.add(transformer);
      transformer.attachTo(group);
      selectedSceneLayer.draw();
    });

    transformer.on("transformend", (e) => {
      const newWidth = image.width() * group.scaleX();
      const newHeight = image.height() * group.scaleY();

      const rotation = Math.round(group.getAttr("rotation"));
      const x = group.x();
      const y = group.y();

      sendOperation("source", {
        action: "resize",
        id: e.target.attrs.uniqId,
        payload: {
          x,
          y,
          width: newWidth,
          height: newHeight,
          rotation,
        },
      });
      setSources((prev) =>
        prev.map((item) =>
          item.uniqId === e.target.attrs.uniqId
            ? {
                ...item,
                x,
                y,
                width: newWidth,
                height: newHeight,
                rotation,
                sceneId: getSelectedScene().id,
              }
            : item
        )
      );
    });

    group.on("dragend", (e) => {
      const { x, y } = e.target.position();

      setSources((prev) =>
        prev.map((item) =>
          item.uniqId === e.target.attrs.uniqId
            ? { ...item, x, y, sceneId: getSelectedScene().id }
            : item
        )
      );
      sendOperation("source", {
        action: "move",
        id: e.target.attrs.uniqId,
        payload: { x, y },
      });

      selectedSceneLayer.draw();
    });

    v.loop = true;
    try {
      // await v.play();
      // await v.muted();
      // anim.start();
    } catch (err) {
      console.warn("Autoplay blocked, will resume on first user gesture", err);
      // 4) fallback: اولین تعامل کاربر → همه ویدیوهای معلق پلی شوند
      const resume = async () => {
        document.removeEventListener("pointerdown", resume, true);
        document.removeEventListener("keydown", resume, true);
        try {
          // await v.play();
          // anim.start();
        } catch (e) {
          /* نادیده بگیر */
        }
      };
      document.addEventListener("pointerdown", resume, true);
      document.addEventListener("keydown", resume, true);
    }
  }

  //   if (videoElement.type === "STREAM") {
  //     onMeta();
  //   }
  //   v.addEventListener("loadedmetadata", onMeta);
  // }

  // document.getElementById("play").addEventListener("click", function () {
  //   text.destroy();
  // });
  // document.getElementById("pause").addEventListener("click", function () {
  //   video.pause();
  //   anim.stop();
  // });
};

export const playVideo = ({ id, sources = [] }) => {
  const s = sources.find(
    (it) =>
      String(it.externalId) === String(id) ||
      String(it.uniqId) === String(id) ||
      String(it.id) === String(id)
  );
  if (s?.videoElement) {
    try {
      s.videoElement.muted = true;
      s.videoElement.play();
    } catch (e) {
      // autoplay may be blocked
    }
  }
};

export const pauseVideo = ({ id, sources = [] }) => {
  const s = sources.find(
    (it) =>
      String(it.externalId) === String(id) ||
      String(it.uniqId) === String(id) ||
      String(it.id) === String(id)
  );
  if (s?.videoElement) {
    try {
      s.videoElement.pause();
    } catch (e) {
      // ignore
    }
  }
};

export const toggleLoopVideo = ({ id, sources = [] }) => {
  const s = sources.find(
    (it) =>
      String(it.externalId) === String(id) ||
      String(it.uniqId) === String(id) ||
      String(it.id) === String(id)
  );
  if (s?.videoElement) {
    s.videoElement.loop = !s.videoElement.loop;
  }
};
