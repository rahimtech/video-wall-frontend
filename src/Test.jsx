import React, { useEffect } from "react";
import Konva from "konva";

export default function Test() {
  useEffect(() => {
    var width = window.innerWidth;
    var height = window.innerHeight;

    var stage = new Konva.Stage({
      container: "containerKonva",
      width: width,
      height: height,
      draggable: true,
    });

    var layer = new Konva.Layer();
    stage.add(layer);

    var WIDTH = 3000;
    var HEIGHT = 3000;
    var NUMBER = 20;

    function generateNode() {
      return new Konva.Circle({
        x: WIDTH * Math.random(),
        y: HEIGHT * Math.random(),
        radius: 50,
        fill: "red",
        stroke: "black",
      });
    }

    for (var i = 0; i < NUMBER; i++) {
      layer.add(generateNode());
    }

    layer.draw();
  }, []);

  return (
    <div id="containerKonva" style={{ width: "100vw", height: "100vh" }} />
  );
}
