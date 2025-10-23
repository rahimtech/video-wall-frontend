import Konva from "konva";

import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import api from "../../../../api/api";

export const addWeb = async ({
  webResource,
  mode = true,
  getSelectedScene,
  setSources,
  sendOperation,
  url,
}) => {
  const { id, content, x, y, width, height, externalId, mediaId, rotation } = webResource;
  console.log("webResource::: ", webResource);

  const targetX = Number.isFinite(webResource?.x) ? webResource.x : 0;
  const targetY = Number.isFinite(webResource?.y) ? webResource.y : 0;

  // let uniqId = externalId;
  let uniqId = mode ? uuidv4() : externalId;

  const selectedSceneLayer = getSelectedScene()?.layer;

  let selectedStage = null;
  if (mode) {
    selectedStage = getSelectedScene()?.stageData;
    sendOperation("source", {
      action: "add",
      id: String(uniqId),
      payload: {
        source: "iframe:" + content,
        x: targetX,
        y: targetY,
        z: webResource?.z,

        width: width || 1920,
        height: height || 1080,
        name: content,
        type: "IFRAME",
        sceneId: getSelectedScene()?.id,
        externalId: uniqId,
        mediaId: id,
        content: content,
        metadata: { source: "iframe:" + content },
      },
    });
  }

  if (!selectedSceneLayer) return;

  const group = new Konva.Group({
    x: mode ? targetX : x,
    y: mode ? targetY : y,
    draggable: false,
    id: String(uniqId),
    uniqId,
    rotation: rotation || 0,
  });

  const webRect = new Konva.Rect({
    width: width,
    height: height,
    fill: "lightgray",
    strokeWidth: 2,
    stroke: "white",
    uniqId,
  });

  const webText = new Konva.Text({
    text: webResource.name,
    fontSize: 30,
    fontFamily: "Arial",
    fill: "black",
    align: "center",
    verticalAlign: "middle",
    padding: 10,
    wrap: "word",
    width: width,
    ellipsis: true,
  });

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
      payload: { x: group.x(), y: group.y() },
    });
  });

  group.on("transformend", (e) => {
    const newWidth = webRect.width() * group.scaleX();
    const newHeight = webRect.height() * group.scaleY();

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
        x,
        y,
        width: newWidth,
        height: newHeight,
        rotation,
      },
    });
  });

  group.add(webRect);
  group.add(webText);
  selectedSceneLayer.add(group);

  if (mode)
    setSources((prev) => [
      ...prev,
      { ...webResource, externalId: uniqId, sceneId: getSelectedScene().id },
    ]);
  selectedSceneLayer.add(group);
  if (mode) selectedStage.add(selectedSceneLayer);

  selectedSceneLayer.draw();
};

export const editWeb = (webResource) => {
  Swal.fire({
    title: "ویرایش URL:",
    input: "url",
    inputValue: webResource.content,
    showCancelButton: true,
    confirmButtonColor: "limegreen",
    cancelButtonColor: "#d33",
    confirmButtonText: "ذخیره",
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      setScenes((prevScenes) =>
        prevScenes.map((scene) => {
          if (scene.id === selectedScene) {
            return {
              ...scene,
              resources: scene.resources.map((resource) =>
                resource.id === webResource.id
                  ? { ...resource, webURL: result.value, name: result.value }
                  : resource
              ),
            };
          }
          return scene;
        })
      );
    }
  });
};
