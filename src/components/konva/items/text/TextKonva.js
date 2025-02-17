export const addText = (text) => {
  const selectedSceneLayer = getSelectedScene()?.layer;
  const selectedStage = getSelectedScene()?.stageData;
  let uniqId = uuidv4();

  if (!selectedSceneLayer || !selectedStage) return;

  const textNode = new Konva.Text({
    text: text.content,
    fontSize: 100,
    fontFamily: "Arial",
    fill: text.color || "black",
    x: 0,
    y: 0,
    draggable: false,
    id: String(text.id),
    uniqId,
  });

  const transformer = new Konva.Transformer({
    nodes: [textNode],
    id: String(uniqId),

    enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
    boundBoxFunc: (oldBox, newBox) => {
      newBox.width = Math.max(30, newBox.width);
      return newBox;
    },
  });
  transformer.flipEnabled(false);

  textNode.on("click", () => {
    textNode.draggable(true);
    selectedSceneLayer.add(transformer);
    transformer.attachTo(textNode);
    selectedSceneLayer.draw();
  });

  textNode.on("dblclick", () => {
    const textPosition = textNode.absolutePosition();
    const stageBox = selectedStage.container().getBoundingClientRect();
    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    textarea.value = textNode.text();
    textarea.style.position = "absolute";
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
    textarea.style.fontSize = "24px";
    textarea.style.border = "1px solid black";
    textarea.style.padding = "0px";
    textarea.style.margin = "0px";
    textarea.style.overflow = "hidden";
    textarea.style.background = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.lineHeight = textNode.lineHeight();
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = "left top";

    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill();
    const rotation = textNode.rotation();
    let transform = "";
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }

    textarea.style.transform = transform;
    textarea.style.height = "auto";
    textarea.focus();

    function removeTextarea() {
      textarea.parentNode.removeChild(textarea);
      window.removeEventListener("click", handleOutsideClick);
      textNode.show();
      transformer.show();
      transformer.forceUpdate();
      selectedSceneLayer.draw();
    }

    textarea.addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        textNode.text(textarea.value);
        removeTextarea();
      }
    });

    function handleOutsideClick(e) {
      if (e.target !== textarea) {
        textNode.text(textarea.value);
        removeTextarea();
      }
    }

    textarea.addEventListener("keydown", function (e) {
      if (e.keyCode === 27) {
        removeTextarea();
      }
    });

    setTimeout(() => {
      window.addEventListener("click", handleOutsideClick);
    });

    textarea.style.height = `${textarea.scrollHeight}px`;
  });

  textNode.on("dragend", (e) => {
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
      payload: { x: textNode.x(), y: textNode.y() },
    });
  });

  textNode.on("transformend", (e) => {
    const newWidth = textNode.width() * textNode.scaleX();
    const newHeight = textNode.height() * textNode.scaleY();

    const rotation = Math.round(textNode.getAttr("rotation"));
    const x = textNode.x();
    const y = textNode.y();

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

  setSources((prev) => [...prev, { ...text, uniqId, sceneId: getSelectedScene().id }]);

  selectedSceneLayer.add(textNode);
  selectedStage.add(selectedSceneLayer);
  selectedSceneLayer.draw();
};

export const editText = (text) => {
  Swal.fire({
    title: "ویرایش متن:",
    input: "text",
    inputValue: text.content,
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
                resource.id === text.id
                  ? { ...resource, content: result.value, name: result.value }
                  : resource
              ),
            };
          }
          return scene;
        })
      );

      const textNode = getSelectedScene()?.layer.findOne(`#${text.id}`);
      if (textNode) {
        textNode.text(result.value);
        getSelectedScene()?.layer.draw();
      }
    }
  });
};
