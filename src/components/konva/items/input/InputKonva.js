import { v4 as uuidv4 } from "uuid";

export const addInput = ({ input, mode = true, getSelectedScene, setSources, sendOperation }) => {
  console.log("input::: ", input);
  let uniqId = mode ? uuidv4() : input.externalId;

  const selectedSceneLayer = getSelectedScene()?.layer;
  if (!selectedSceneLayer) return;

  const group = new Konva.Group({
    x: input.x || 0,
    y: input.y || 0,
    draggable: false,
    id: String(uniqId),
    type: "INPUT",
    uniqId,
    rotation: input.rotation || 0,
  });

  const rect = new Konva.Rect({
    x: 0,
    y: 0,
    width: input.width,
    height: input.height,
    fill: "lightblue",
    id: String(uniqId),
    stroke: "white",
    strokeWidth: 2,
    uniqId,
  });

  const text = new Konva.Text({
    x: 10,
    y: 10,
    text: `${input.name}\n(${input.type})`,
    fontSize: 40,
    fill: "black",
    uniqId,
    id: String(uniqId),
  });

  group.add(rect);
  group.add(text);

  if (mode) {
    setSources((prev) => [...prev, { ...input, uniqId, sceneId: getSelectedScene().id }]);
    sendOperation("source", {
      action: "add",
      id: uniqId,
      payload: {
        source: "input:" + input.content,
        x: 0,
        y: 0,
        width: input.width,
        height: input.height,
        name: input.name,
        type: "INPUT",
        sceneId: getSelectedScene().id,
        content: input.content,
        mediaId: input.id,
        metadata: { source: "input:" + input.content },
      },
    });
  }

  selectedSceneLayer.add(group);
  selectedSceneLayer.draw();

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
    const newWidth = rect.width() * group.scaleX();
    const newHeight = rect.height() * group.scaleY();

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
};
