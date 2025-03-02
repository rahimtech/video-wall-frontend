import { v4 as uuidv4 } from "uuid";

export const addVideo = ({
  videoItem,
  mode = true,
  getSelectedScene,
  setSources,
  sendOperation,
  url,
  loopVideos,
}) => {
  let uniqId = mode ? uuidv4() : videoItem.externalId;
  // let uniqId = videoItem.externalId;

  const selectedSceneLayer = getSelectedScene()?.layer;
  let selectedStage = null;
  if (mode) {
    selectedStage = getSelectedScene()?.stageData;
  }

  if (!selectedSceneLayer) return;

  const modifiedVideoURL = mode ? `video:${url}/${videoItem.content}` : videoItem.videoElement.src;

  console.log("modifiedVideoURL::: ", modifiedVideoURL);
  // videoItem.videoElement.src = `${url}/uploads/${videoItem.name}`;

  if (mode) {
    sendOperation("source", {
      action: "add",
      id: String(uniqId),
      payload: {
        source: modifiedVideoURL,
        x: 0,
        y: 0,
        width: videoItem.videoElement.videoWidth || videoItem.width,
        height: videoItem.videoElement.videoHeight || videoItem.height,
        name: videoItem.name,
        type: "VIDEO",
        sceneId: getSelectedScene().id,
        content: videoItem.content,
        mediaId: videoItem.id,
        externalId: uniqId,
        metadata: { source: modifiedVideoURL },
      },
    });
  }

  if (mode) {
    const text = new Konva.Text({
      x: 0,
      y: 0,
      text: `${videoItem.name}\n(${videoItem.type})`,
      fontSize: 30,
      fill: "black",
      fontFamily: "Arial",
      padding: 5,
      id: String(uniqId),
      uniqId,
      align: "center",
      width: videoItem.videoElement.videoWidth,
      ellipsis: true,
    });

    const group = new Konva.Group({
      x: mode ? 0 : videoItem.x,
      y: mode ? 0 : videoItem.y,
      draggable: false,
      id: String(uniqId),
      uniqId,
      rotation: videoItem.rotation || 0,
    });

    const image = new Konva.Image({
      image: videoItem.videoElement,
      width: videoItem.videoElement.videoWidth,
      height: videoItem.videoElement.videoHeight,
      name: "object",
      fill: "gray",
      id: String(videoItem.id),
      uniqId,
      stroke: "white",
      strokeWidth: 2,
      x: 0,
      y: 0,
      // rotation: videoItem.rotation || 0,
    });

    group.add(image);
    group.add(text);
    selectedSceneLayer.add(group);

    if (mode) {
      setSources((prev) =>
        mode
          ? [...prev, { ...videoItem, externalId: uniqId, sceneId: getSelectedScene().id }]
          : prev
      );
    }
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

    videoItem.loop = loopVideos[videoItem.name] || false;
  } else {
    videoItem.videoElement.onloadeddata = () => {
      const text = new Konva.Text({
        x: 0,
        y: 0,
        text: `${videoItem.name}\n(${videoItem.type})`,
        fontSize: 30,
        fill: "black",
        fontFamily: "Arial",
        padding: 5,
        id: String(uniqId),
        uniqId,
        align: "center",
        width: videoItem.width,
        ellipsis: true,
      });

      const group = new Konva.Group({
        x: mode ? 0 : videoItem.x,
        y: mode ? 0 : videoItem.y,
        draggable: false,
        uniqId,
        id: String(uniqId),
        rotation: videoItem.rotation || 0,
      });

      const image = new Konva.Image({
        image: videoItem.videoElement,
        width: videoItem.width,
        height: videoItem.height,
        name: "object",
        fill: "gray",
        id: String(uniqId),
        stroke: "white",
        strokeWidth: 2,
        uniqId,
        x: 0,
        y: 0,
        // rotation: videoItem.rotation || 0,
      });

      group.add(image);
      group.add(text);

      if (mode) {
        setSources((prev) =>
          mode
            ? [...prev, { ...videoItem, externalId: uniqId, sceneId: getSelectedScene().id }]
            : prev
        );
      }
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
        console.log("1");
        const newWidth = image.width() * group.scaleX();
        const newHeight = image.height() * group.scaleY();
        console.log("12");

        const rotation = Math.round(group.getAttr("rotation"));
        const x = group.x();
        const y = group.y();
        console.log("13");

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

      videoItem.loop = loopVideos[videoItem.name] || false;
    };
  }
};

export const playVideo = (videoId) => {
  const video = sources.filter((item) => item.id == videoId);

  // console.log("video::: ", video);
  if (video[0].videoElement) {
    video[0].videoElement.play();
    // anim = new Konva.Animation((frame) => {}, selectedScene);

    anim.start();
    // sendOperation("source", {
    //   action: "play",
    //   id: videoId,
    // });

    // console.log("anim::: ", anim);
  }
};

export const pauseVideo = (videoId) => {
  const video = sources.filter((item) => item.id == videoId);

  if (video[0].videoElement) {
    video[0].videoElement.pause();
    sendOperation("source", {
      action: "pause",
      id: videoId,
    });
  }
};

export const toggleLoopVideo = (videoId) => {
  setLoopVideos((prev) => {
    const isLooping = !prev[videoId];
    sendOperation("source", {
      action: "loop",
      id: videoId,
    });
    return {
      ...prev,
      [videoId]: isLooping,
    };
  });
};
