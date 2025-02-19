const removeTransformers = (layer) => {
  console.log("layer::: ", layer);
  layer.find("Transformer").forEach((tr) => tr.detach());
};

export const fitToMonitors = ({
  uniqId,
  selectedMonitors,
  getSelectedScene,
  allDataMonitors,
  sendOperation,
}) => {
  const videoGroup = getSelectedScene()
    ?.layer.getChildren()
    .find((child) => child.attrs.uniqId === uniqId);

  if (!videoGroup) {
    console.error("videoGroup not found");
    return;
  }

  const layer = getSelectedScene()?.layer;
  if (layer) {
    removeTransformers(layer);
  }

  if (selectedMonitors.length === 0) {
    console.error("No monitors selected");
    return;
  }

  const allSelectedData = selectedMonitors.map((id) => allDataMonitors[id]);
  const minX = Math.min(...allSelectedData.map((monitor) => monitor.x));
  const minY = Math.min(...allSelectedData.map((monitor) => monitor.y));
  const maxX = Math.max(...allSelectedData.map((monitor) => monitor.x + monitor.width));
  const maxY = Math.max(...allSelectedData.map((monitor) => monitor.y + monitor.height));

  const x = minX;
  const y = minY;
  const width = maxX - minX;
  const height = maxY - minY;

  if (videoGroup instanceof Konva.Image) {
    videoGroup.position({ x, y });
    videoGroup.width(width);
    videoGroup.height(height);
    videoGroup.setAttr("rotation", 0);
    getSelectedScene()?.layer.draw();

    sendOperation("source", {
      action: "resize",
      id: uniqId,
      payload: {
        x: x,
        y: y,
        width: width,
        height: height,
        rotation: "0",
      },
    });
  } else if (videoGroup instanceof Konva.Group) {
    videoGroup.position({ x, y });
    videoGroup?.getChildren((node) => {
      if (node instanceof Konva.Rect) {
        node.width(width);
        node.height(height);
      } else {
        node.width(width);
        node.height(height);
      }
    });
    videoGroup.setAttr("rotation", 0);
    getSelectedScene()?.layer.draw();

    sendOperation("source", {
      action: "resize",
      id: uniqId,
      payload: {
        x: x,
        y: y,
        width: width,
        height: height,
        rotation: "0",
      },
    });
  } else {
    console.log("videoGroup نوع نود دیگری است");
  }
};
