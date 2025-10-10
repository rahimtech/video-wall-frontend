import Konva from "konva";

import { v4 as uuidv4 } from "uuid";

export const addImage = ({
  img,
  mode = true,
  getSelectedScene,
  setSources,
  sendOperation,
  url,
  generateBlobImageURL,
}) => {
  // let uniqId = img.externalId;
  let uniqId = mode ? uuidv4() : img.externalId;
  const selectedSceneLayer = getSelectedScene()?.layer;
  if (!selectedSceneLayer) return;

  const targetX = Number.isFinite(img?.x) ? img.x : 0;
  const targetY = Number.isFinite(img?.y) ? img.y : 0;

  const modifiedImageURL = mode ? `image:${url}/${img.content}` : `image:${img.imageElement.src}`;

  if (mode) {
    sendOperation("source", {
      action: "add",
      id: String(uniqId),
      payload: {
        source: modifiedImageURL,
        x: targetX,
        y: targetY,
        width: img.imageElement.width || img.width,
        height: img.imageElement.height || img.height,
        name: img.name,
        type: "IMAGE",
        sceneId: getSelectedScene().id,
        content: img.content,
        mediaId: img.id,
        externalId: uniqId,
        metadata: { source: modifiedImageURL },
      },
    });
  }

  const image = new Image();
  image.src = img.imageElement.src;

  image.onload = () => {
    const konvaImage = new Konva.Image({
      image: image,
      width: mode ? img.imageElement.width : img.width,
      height: mode ? img.imageElement.height : img.height,
      name: "object",
      id: String(img.id),
      stroke: "white",
      strokeWidth: 2,
      uniqId,
      x: 0,
      y: 0,
    });

    const text = new Konva.Text({
      x: 0,
      y: 0,
      text: `${img.name}\n(${img.type})`,
      fontSize: 30,
      fill: "black",
      fontFamily: "Arial",
      uniqId,
      id: String(uniqId),
      padding: 5,
      align: "center",
      width: mode ? img.imageElement.width : img.width,
      ellipsis: true,
    });

    const group = new Konva.Group({
      x: mode ? targetX : img.x,
      y: mode ? targetY : img.y,
      draggable: false,
      uniqId,
      id: String(uniqId),
      rotation: img.rotation || 0,
    });

    group.add(konvaImage);
    group.add(text);

    selectedSceneLayer.add(group);

    group.on("click", () => {
      group.draggable(true);
      const transformer = new Konva.Transformer({
        nodes: [group],
        enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
        rotateEnabled: true,
        id: String(uniqId),
      });
      transformer.flipEnabled(false);
      selectedSceneLayer.add(transformer);
      transformer.attachTo(group);
      selectedSceneLayer.draw();
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
        payload: { source: modifiedImageURL, x, y },
      });
    });

    group.on("transformend", (e) => {
      const newWidth = konvaImage.width() * group.scaleX();
      const newHeight = konvaImage.height() * group.scaleY();

      const rotation = Math.round(group.getAttr("rotation"));
      const x = group.x();
      const y = group.y();

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

      sendOperation("source", {
        action: "resize",
        id: e.target.attrs.uniqId,
        payload: {
          source: modifiedImageURL,
          x,
          y,
          width: newWidth,
          height: newHeight,
          rotation,
        },
      });
    });

    if (mode)
      setSources((prev) => [
        ...prev,
        { ...img, externalId: uniqId, sceneId: getSelectedScene().id },
      ]);

    selectedSceneLayer.draw();
  };

  image.onerror = () => {
    console.error("Failed to load image:", img.imageElement.src);
  };
};
