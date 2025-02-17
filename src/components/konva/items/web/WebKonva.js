import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";

export const addWeb = ({
  webResource,
  mode = true,
  getSelectedScene,
  setSources,
  sendOperation,
}) => {
  const { id, content, x, y, width, height } = webResource;
  let uniqId = mode ? uuidv4() : id;

  const selectedSceneLayer = getSelectedScene()?.layer;

  let selectedStage = null;
  if (mode) {
    selectedStage = getSelectedScene()?.stageData;
    sendOperation("source", {
      action: "add",
      id: String(uniqId),
      payload: {
        source: "iframe:" + content,
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        name: content,
        type: "iframe",
        sceneId: getSelectedScene()?.id,
        content: content,
      },
    });
  }

  if (!selectedSceneLayer) return;

  const group = new Konva.Group({
    x: mode ? 0 : x,
    y: mode ? 0 : y,
    draggable: false,
    id: String(id),
    uniqId,
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
    text: content,
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

  setSources((prev) => [...prev, { ...webResource, uniqId, sceneId: getSelectedScene().id }]);

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

  if (mode) {
    setSources((prev) =>
      mode ? [...prev, { ...webResource, uniqId, sceneId: getSelectedScene().id }] : prev
    );
  }
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
