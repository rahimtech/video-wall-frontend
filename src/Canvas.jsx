// src/components/konva/Canvas.jsx
import React, { useEffect, useMemo, useRef, useState, startTransition } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Switch,
} from "@nextui-org/react";
import {
  TbFocusCentered,
  TbMaximize,
  TbZoomReset,
  TbZoomIn,
  TbZoomOut,
  TbGridDots,
} from "react-icons/tb";
import Konva from "konva";
import { useMyContext } from "./context/MyContext";

// --- Helpers ---
function getStageAndLayer(getSelectedScene) {
  const scn = getSelectedScene?.();
  return scn?.stageData && scn?.layer ? { stage: scn.stageData, layer: scn.layer } : {};
}

function fitStageToMonitorsSmart(stage, monitors) {
  if (!stage || !monitors?.length) return;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  monitors.forEach((m) => {
    const x2 = m.x + m.width;
    const y2 = m.y + m.height;
    if (m.x < minX) minX = m.x;
    if (m.y < minY) minY = m.y;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  });
  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const viewW = stage.width();
  const viewH = stage.height();

  // padding و حداکثر اسکیل به شکل هوشمند
  const n = monitors.length;
  const padding = Math.min(
    Math.max(Math.round(Math.min(viewW, viewH) * 0.06) + Math.ceil(Math.sqrt(n)) * 4, 24),
    160
  );
  const sX = (viewW - padding * 2) / contentW;
  const sY = (viewH - padding * 2) / contentH;
  const scale = Math.min(sX, sY, 1);

  // مبدأ 0,0 و نمایش کامل
  stage.scale({ x: scale, y: scale });
  stage.position({ x: -minX * scale + padding, y: -minY * scale + padding });
  stage.batchDraw();
}

function centerStageOnMonitors(stage, monitors) {
  if (!stage || !monitors?.length) return;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  monitors.forEach((m) => {
    const x2 = m.x + m.width;
    const y2 = m.y + m.height;
    if (m.x < minX) minX = m.x;
    if (m.y < minY) minY = m.y;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  });
  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const viewW = stage.width();
  const viewH = stage.height();

  const scale = stage.scaleX() || 1;
  const contentCenter = { x: (minX + contentW / 2) * scale, y: (minY + contentH / 2) * scale };
  const viewCenter = { x: viewW / 2, y: viewH / 2 };

  stage.position({ x: viewCenter.x - contentCenter.x, y: viewCenter.y - contentCenter.y });
  stage.batchDraw();
}

// Zoom around a point (screen coords)
function zoomAt(stage, factor, point = null) {
  if (!stage) return;
  const oldScale = stage.scaleX() || 1;
  const newScale = oldScale * factor;
  const viewW = stage.width();
  const viewH = stage.height();
  const centerPoint = point || { x: viewW / 2, y: viewH / 2 };

  const mousePointTo = {
    x: (centerPoint.x - stage.x()) / oldScale,
    y: (centerPoint.y - stage.y()) / oldScale,
  };

  stage.scale({ x: newScale, y: newScale });
  const newPos = {
    x: centerPoint.x - mousePointTo.x * newScale,
    y: centerPoint.y - mousePointTo.y * newScale,
  };
  stage.position(newPos);
  stage.batchDraw();
}

// Draw / update virtual grid inside a monitor-group
function drawVirtualGridOnMonitor(layer, monitorId, rows, cols, startIndex = 1) {
  const group = layer.findOne(`#monitor-group-${monitorId}`);
  if (!group) return;

  const rect = group.findOne("Rect");
  if (!rect) return;

  // پاک‌سازی گرید قبلی
  const old = group.findOne(".virtual-grid");
  if (old) old.destroy();

  const gridGroup = new Konva.Group({ name: "virtual-grid", listening: false });

  const w = rect.width();
  const h = rect.height();

  // خطوط
  for (let c = 1; c < cols; c++) {
    const x = (w / cols) * c;
    gridGroup.add(
      new Konva.Line({
        points: [x, 0, x, h],
        stroke: "rgba(255,255,255,0.35)",
        strokeWidth: 1,
        dash: [6, 6],
      })
    );
  }
  for (let r = 1; r < rows; r++) {
    const y = (h / rows) * r;
    gridGroup.add(
      new Konva.Line({
        points: [0, y, w, y],
        stroke: "rgba(255,255,255,0.35)",
        strokeWidth: 1,
        dash: [6, 6],
      })
    );
  }

  // شماره‌گذاری از startIndex
  const cellW = w / cols;
  const cellH = h / rows;
  let idx = startIndex;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      gridGroup.add(
        new Konva.Text({
          x: c * cellW,
          y: r * cellH,
          width: cellW,
          height: cellH,
          align: "center",
          verticalAlign: "middle",
          text: String(idx++),
          fontSize: Math.max(12, Math.min(cellW, cellH) * 0.22),
          fontStyle: "bold",
          fill: "rgba(255,255,255,0.7)",
          listening: false,
        })
      );
    }
  }

  group.add(gridGroup);
  group.setAttr("gridMeta", { rows: Number(rows), cols: Number(cols) });
  group.setAttr("gridStartIndex", Number(startIndex)); // برای دیباگ/بازشماره

  layer.batchDraw();
}

function getGridCells(layer, monitorId, { debug = false, clearPrev = true } = {}) {
  const group = layer.findOne(`#monitor-group-${monitorId}`);
  if (!group) return [];
  const gridMeta = group.getAttr("gridMeta");
  if (!gridMeta?.rows || !gridMeta?.cols) return [];

  const rect = group.findOne("Rect");
  if (!rect) return [];

  const rows = Number(gridMeta.rows);
  const cols = Number(gridMeta.cols);

  // باکس مطلق رکت نسبت به لِیِر (همه‌ی ترنسفورم‌ها لحاظ می‌شود)
  const absBox = rect.getClientRect({ relativeTo: layer }); // {x,y,width,height}

  const cellW = absBox.width / cols;
  const cellH = absBox.height / rows;

  if (clearPrev) {
    const old = layer.findOne(`#grid-debug-${monitorId}`);
    if (old) old.destroy();
  }
  const dbg = debug
    ? new Konva.Group({ id: `grid-debug-${monitorId}`, name: "grid-debug", listening: false })
    : null;

  const cells = [];
  const startIndex = Number(group.getAttr("gridStartIndex")) || 1;
  let idx = startIndex;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = absBox.x + c * cellW;
      const y = absBox.y + r * cellH;
      const cell = { index: idx++, row: r, col: c, rect: { x, y, width: cellW, height: cellH } };
      cells.push(cell);

      if (dbg) {
        dbg.add(
          new Konva.Rect({
            x,
            y,
            width: cellW,
            height: cellH,
            stroke: "rgba(255,0,0,0.8)",
            dash: [8, 6],
            strokeWidth: 1,
            fill: "rgba(255,0,0,0.08)",
          })
        );
        dbg.add(
          new Konva.Text({
            x,
            y: y + cellH / 2 - 10,
            width: cellW,
            height: 20,
            align: "center",
            text: String(cell.index),
            fontSize: Math.max(12, Math.min(cellW, cellH) * 0.22),
            fontStyle: "bold",
            fill: "rgba(255,0,0,0.9)",
          })
        );
      }
    }
  }

  if (dbg) {
    layer.add(dbg);
    layer.batchDraw();
  }
  return cells;
}

function placeResourceInCell({ type, resource, cellRect, ctx }) {
  const {
    addImage,
    addVideo,
    addWeb,
    addInput,
    addText,
    getSelectedScene,
    setSources,
    sendOperation,
    url,
    loopVideos,
    generateBlobImageURL,
  } = ctx;

  const scn = getSelectedScene();
  if (!scn) return;

  const base = {
    x: cellRect.x,
    y: cellRect.y,
    sceneId: scn.id,
  };

  if (type === "IMAGE" && resource) {
    const imgObj = { ...resource, ...base };
    if (imgObj.imageElement) {
      imgObj.imageElement.width = cellRect.width;
      imgObj.imageElement.height = cellRect.height;
    }
    // برای اینکه addImage هم بدونه اندازه هدف چنده
    imgObj.width = cellRect.width;
    imgObj.height = cellRect.height;

    addImage({
      img: imgObj,
      getSelectedScene,
      setSources,
      sendOperation,
      url,
      generateBlobImageURL,
    });
  } else if (type === "VIDEO" && resource) {
    const vidObj = { ...resource, ...base, width: cellRect.width, height: cellRect.height };
    if (vidObj.videoElement) {
      vidObj.videoElement.width = cellRect.width;
      vidObj.videoElement.height = cellRect.height;
    }

    addVideo({
      videoElement: vidObj,
      getSelectedScene,
      setSources,
      sendOperation,
      url,
      loopVideos,
    });
  } else if (type === "IFRAME" && resource) {
    const webObj = { ...resource, ...base };
    if (webObj.iframeElement) {
      webObj.iframeElement.width = cellRect.width;
      webObj.iframeElement.height = cellRect.height;
      if (webObj.iframeElement.style) {
        webObj.iframeElement.style.width = `${cellRect.width}px`;
        webObj.iframeElement.style.height = `${cellRect.height}px`;
      }
    }
    // همچنین روی خود آبجکت:
    webObj.width = cellRect.width;
    webObj.height = cellRect.height;

    addWeb({
      webResource: webObj,
      getSelectedScene,
      setSources,
      sendOperation,
      url,
    });
  } else if (type === "INPUT" && resource) {
    const inpObj = { ...resource, ...base };
    if (inpObj.imageElement) {
      inpObj.imageElement.width = cellRect.width;
      inpObj.imageElement.height = cellRect.height;
    }
    if (inpObj.inputElement) {
      if (inpObj.inputElement.style) {
        inpObj.inputElement.style.width = `${cellRect.width}px`;
        inpObj.inputElement.style.height = `${cellRect.height}px`;
      }
      inpObj.inputElement.width = cellRect.width;
      inpObj.inputElement.height = cellRect.height;
    }
    inpObj.width = cellRect.width;
    inpObj.height = cellRect.height;

    addInput({
      input: inpObj,
      getSelectedScene,
      setSources,
      sendOperation,
    });
  } else {
    console.warn("placeResourceInCell: unsupported type or empty resource", { type, resource });
  }
}

export default function Canvas({
  title = "بوم نمایش",
  subtitle = "Drag & Drop منابع روی صحنه",
  onFit,
}) {
  const {
    darkMode,
    scenes,
    selectedScene,
    handleDragOver,
    handleDrop,
    getSelectedScene,
    videoWalls,
    resources, // لیست
    inputs, // لیست ورودی‌ها
    addImage,
    addVideo,
    addWeb,
    addInput,
    setSources,
    sendOperation,
    url,
    loopVideos,
    generateBlobImageURL,
    isToggleLayout,
    isRealTime,
    setIsRealTime,
    contentGenerator,
  } = useMyContext();

  const [selectedCellIndex, setSelectedCellIndex] = useState(null);
  const [selectedAssetKey, setSelectedAssetKey] = useState(null); // "type:id" مثل IMAGE:123

  // UI states
  const [dragEnabled, setDragEnabled] = useState(true);
  const [zoomStep, setZoomStep] = useState(1.1);
  const [gridRows, setGridRows] = useState(2);
  const [gridCols, setGridCols] = useState(2);
  const [gridMonitorId, setGridMonitorId] = useState(null);
  const [isActiveGrid, setIsActiveGrid] = useState(false);

  const [cellOptions, setCellOptions] = useState([]); // [{key,value,label}]
  const [monitorGroups, setMonitorGroups] = useState([]);
  const [selectedMonitors, setSelectedMonitors] = useState([]);
  const [groupCounter, setGroupCounter] = useState(1);
  const [groups, setGroups] = useState([]); // آرایه‌ای از Konva.Group ها
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("grid"); // "grid" | "groups" | "place"

  const cellCacheRef = useRef(new Map());

  useEffect(() => {
    const tabs = [
      { btn: "#tab-grid", panel: "#panel-grid" },
      { btn: "#tab-groups", panel: "#panel-groups" },
      { btn: "#tab-place", panel: "#panel-place" },
    ];
    const setActive = (idx) => {
      tabs.forEach((t, i) => {
        const b = document.querySelector(t.btn);
        const p = document.querySelector(t.panel);
        if (!b || !p) return;
        b.dataset.active = i === idx ? "true" : "false";
        p.classList.toggle("hidden", i !== idx);
      });
    };
    tabs.forEach((t, i) => {
      const b = document.querySelector(t.btn);
      b && b.addEventListener("click", () => setActive(i));
    });
    setActive(0);
    return () => {
      tabs.forEach((t) => {
        const b = document.querySelector(t.btn);
        b && b.replaceWith(b.cloneNode(true)); // remove handlers
      });
    };
  }, [isActiveGrid, darkMode]);

  const handlePlaceIntoGroup = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer) return;
    if (selectedGroupIndex === null || selectedGroupIndex === undefined) return;
    if (!selectedAssetKey) return;

    const targetGroup = groups[selectedGroupIndex];
    if (!targetGroup) return;

    // مستطیل گروه
    const rectNode = targetGroup.findOne("Rect");
    console.log("rectNode::: ", rectNode);
    if (!rectNode) return;

    // مختصات مطلق با درنظر گرفتن ترنسفورم
    const abs = targetGroup.getAbsoluteTransform().copy();
    const topLeft = abs.point({ x: rectNode.x(), y: rectNode.y() });
    const bottomRight = abs.point({
      x: rectNode.x() + rectNode.width(),
      y: rectNode.y() + rectNode.height(),
    });

    const cellRect = {
      x: rectNode.x(),
      y: rectNode.y(),
      width: rectNode.width(),
      height: rectNode.height(),
    };

    const [type, id] = selectedAssetKey.split(":");
    let resource = null;
    if (type === "IMAGE" || type === "VIDEO" || type === "IFRAME") {
      resource = resources.find((r) => String(r.id) === id);
    } else if (type === "INPUT") {
      resource = inputs.find((r) => String(r.id) === id);
    }
    if (!resource) return;

    placeResourceInCell({
      type,
      resource,
      cellRect,
      ctx: {
        addImage,
        contentGenerator,
        addVideo,
        addWeb,
        addInput,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
        loopVideos,
        generateBlobImageURL,
      },
    });
  };

  const handleCreateGroup = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer || !selectedMonitors.length) return;

    const groupName = `Group ${groupCounter}`;

    // محاسبه‌ی باکس احاطه‌ای مانیتورهای انتخابی
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    selectedMonitors.forEach((mId) => {
      const m = videoWalls.find((v) => Number(v.id) === Number(mId));
      if (!m) return;
      const x2 = m.x + m.width;
      const y2 = m.y + m.height;
      if (m.x < minX) minX = m.x;
      if (m.y < minY) minY = m.y;
      if (x2 > maxX) maxX = x2;
      if (y2 > maxY) maxY = y2;
    });

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY)
    )
      return;

    // ساخت اوورلی
    const group = new Konva.Group({ name: "monitor-grouping", listening: false });

    const rect = new Konva.Rect({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      stroke: "red",
      strokeWidth: 2,
      dash: [10, 6],
      listening: false,
    });

    const label = new Konva.Text({
      x: minX,
      y: minY + (maxY - minY) / 2 - 30,
      width: maxX - minX,
      align: "center",
      text: groupName,
      fontSize: 70,
      fontStyle: "bold",
      fill: "white",
      listening: false,
    });

    group.add(rect);
    group.add(label);
    group.setAttr("groupName", groupName); // برای نمایش در لیست
    group.setAttr("kind", "monitor-grouping"); // برای شناسایی نوع

    layer.add(group);
    layer.batchDraw();

    // به آرایهٔ گروپ‌ها اضافه کن
    setGroups((prev) => [...prev, group]);
    setGroupCounter((c) => c + 1);
    setSelectedMonitors([]);
  };

  const handleCancelGroup = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!groups.length || !layer) return;

    const last = groups[groups.length - 1];
    if (last && last.destroy) last.destroy();

    setGroups((prev) => prev.slice(0, -1));
    layer.batchDraw();
  };

  function createMonitorGroup(layer, videoWalls, selectedIds, groupName) {
    if (!layer || !selectedIds?.length) return null;

    // اطمینان از تبدیل به عدد
    const normalizedIds = selectedIds.map((id) => Number(id));

    // فیلتر مانیتورهای معتبر
    const mons = videoWalls.filter((m) => normalizedIds.includes(Number(m.id)));

    if (!mons.length) {
      console.warn("❌ هیچ مانیتور معتبری برای گروه پیدا نشد!", { selectedIds, videoWalls });
      return null;
    }

    // فقط مانیتورهای سالم رو نگه دار
    const safeMons = mons.filter((m) => m && typeof m.x === "number" && typeof m.y === "number");
    if (!safeMons.length) {
      console.warn("❌ همه مانیتورهای انتخابی نال یا خراب هستند:", mons);
      return null;
    }

    let minX = Math.min(...safeMons.map((m) => m.x));
    let minY = Math.min(...safeMons.map((m) => m.y));
    let maxX = Math.max(...safeMons.map((m) => m.x + m.width));
    let maxY = Math.max(...safeMons.map((m) => m.y + m.height));

    const groupRect = new Konva.Rect({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      stroke: "red",
      dash: [6, 4],
      strokeWidth: 2,
      listening: false,
    });

    const label = new Konva.Text({
      x: minX + 4,
      y: minY + 4,
      text: groupName,
      fontSize: 16,
      fontStyle: "bold",
      fill: "red",
      listening: false,
    });

    const group = new Konva.Group({ name: "monitor-group-overlay" });
    group.add(groupRect);
    group.add(label);

    layer.add(group);
    layer.batchDraw();

    return { id: Date.now(), name: groupName, rect: groupRect };
  }

  useEffect(() => {
    // هر بار scene عوض شد، کش سلول‌ها را پاک کن تا سازگار بماند
    cellCacheRef.current.clear();
  }, [selectedScene]);

  useEffect(() => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer || !gridMonitorId) {
      setCellOptions([]);
      return;
    }

    // اول از کش بخوان
    let cells = cellCacheRef.current.get(gridMonitorId);
    if (!cells) {
      // فقط اگر کش نداریم، حساب کن
      cells = getGridCells(layer, gridMonitorId);
      cellCacheRef.current.set(gridMonitorId, cells);
    }

    startTransition(() => {
      setCellOptions(
        cells.map((c) => ({
          key: String(c.index),
          value: String(c.index),
          label: `سلول ${c.index}`,
        }))
      );
    });
  }, [gridMonitorId]); // بقیه‌ی وابستگی‌ها را حذف کن تا بی‌خودی دوباره محاسبه نشود

  useEffect(() => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer) return;

    monitorGroups.forEach((g) => {
      // پاک‌سازی قدیمی
      let existing = layer.findOne(`#monitor-group-box-${g.id}`);
      if (existing) existing.destroy();

      const rect = new Konva.Rect({
        id: `monitor-group-box-${g.id}`,
        x: g.rect.x,
        y: g.rect.y,
        width: g.rect.width,
        height: g.rect.height,
        stroke: "red",
        dash: [10, 5],
        strokeWidth: 2,
        listening: false,
      });

      layer.add(rect);
    });

    layer.batchDraw();
  }, [monitorGroups, selectedScene, scenes]);

  useEffect(() => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer || !gridMonitorId) {
      setCellOptions([]);
      return;
    }
    const cells = getGridCells(layer, gridMonitorId);
    setCellOptions(
      cells.map((c) => ({ key: String(c.index), value: String(c.index), label: `سلول ${c.index}` }))
    );
  }, [gridMonitorId, gridRows, gridCols, selectedScene, scenes]);

  // Initialize drag toggle from stage (once available)
  useEffect(() => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (stage) setDragEnabled(stage.draggable());
  }, [selectedScene, scenes]);

  const handlePlace = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer || !gridMonitorId || !selectedCellIndex || !selectedAssetKey) return;

    const cells = getGridCells(layer, gridMonitorId);
    console.log("cells::: ", cells);
    const cell = cells.find((c) => String(c.index) === String(selectedCellIndex));

    if (!cell) return;

    const [type, id] = selectedAssetKey.split(":"); // مثلا "IMAGE:42"
    let resource = null;

    if (type === "IMAGE" || type === "VIDEO" || type === "IFRAME") {
      resource = resources.find((r) => String(r.id) === id);
    } else if (type === "INPUT") {
      resource = inputs.find((r) => String(r.id) === id);
    }
    if (!resource) return;

    placeResourceInCell({
      type,
      resource,
      cellRect: cell.rect,
      ctx: {
        contentGenerator,
        addImage,
        addVideo,
        addWeb,
        addInput,
        getSelectedScene,
        setSources,
        sendOperation,
        url,
        loopVideos,
        generateBlobImageURL,
      },
    });
  };

  const gridBg = useMemo(() => {
    const line = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
    const dot = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    return {
      backgroundImage: `
        linear-gradient(0deg, ${line} 1px, transparent 1px),
        linear-gradient(90deg, ${line} 1px, transparent 1px),
        radial-gradient(${dot} 1px, transparent 1px)
      `,
      backgroundSize: "24px 24px, 24px 24px, 24px 24px",
      backgroundPosition: "0 0, 0 0, 12px 12px",
    };
  }, [darkMode]);

  // Actions
  const doFit = () => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    fitStageToMonitorsSmart(stage, videoWalls);
  };

  const doCenter = () => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    centerStageOnMonitors(stage, videoWalls);
  };

  const doReset = () => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
  };

  const doZoomIn = () => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    zoomAt(stage, zoomStep);
  };
  const doZoomOut = () => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    zoomAt(stage, 1 / zoomStep);
  };

  const toggleDrag = (checked) => {
    const { stage } = getStageAndLayer(getSelectedScene);
    if (!stage) return;
    stage.draggable(checked);
    stage.batchDraw();
    setDragEnabled(checked);
  };

  function renumberAllGrids(layer, videoWalls) {
    let start = 1;
    for (const m of videoWalls) {
      const g = layer.findOne(`#monitor-group-${m.id}`);
      if (!g) continue;
      const meta = g.getAttr("gridMeta");
      if (!meta?.rows || !meta?.cols) continue;

      // دوباره بساز با شروع جدید
      drawVirtualGridOnMonitor(layer, m.id, meta.rows, meta.cols, start);

      start += meta.rows * meta.cols;
    }
  }

  const applyGrid = () => {
    const { layer } = getStageAndLayer(getSelectedScene);
    if (!layer || !gridMonitorId) return;

    // محاسبه‌ی شروع سراسری: مجموع سلول‌های مانیتورهای قبلی
    const orderIndex = videoWalls.findIndex((m) => m.id === gridMonitorId);
    let startIndex = 1;

    for (let i = 0; i < orderIndex; i++) {
      const prevId = videoWalls[i].id;
      const g = layer.findOne(`#monitor-group-${prevId}`);
      const meta = g?.getAttr("gridMeta");
      if (meta?.rows && meta?.cols) {
        startIndex += meta.rows * meta.cols;
      }
    }

    drawVirtualGridOnMonitor(
      layer,
      gridMonitorId,
      parseInt(gridRows),
      parseInt(gridCols),
      startIndex
    );
    const cells = getGridCells(layer, gridMonitorId);
    cellCacheRef.current.set(gridMonitorId, cells);
    // و آپشن‌های سلکت را سریع از کش بساز
    startTransition(() => {
      setCellOptions(
        cells.map((c) => ({
          key: String(c.index),
          value: String(c.index),
          label: `سلول ${c.index}`,
        }))
      );
    });
  };

  useEffect(() => {
    // پیش‌فرض مانیتور اول
    if (!gridMonitorId && videoWalls?.length) {
      setGridMonitorId(videoWalls[0].id);
    }
  }, [videoWalls]);

  return (
    <Card
      radius="lg"
      shadow="lg"
      className={`my-auto ${isToggleLayout ? " w-[98%]" : " w-[58%]"} py-2 h-[85%] bottom-0 top-5 
        ${darkMode ? "bg-[#171b22] border border-[#2a2f36]" : "bg-white border border-gray-200"}
      `}
    >
      <CardHeader className="flex flex-wrap gap-3 justify-between items-center py-3 px-4">
        <div className="flex flex-col">
          <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
            {subtitle}
          </span>
          <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
            {title}
          </h3>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Switch
            classNames={{ label: `${darkMode ? "dark" : "light"}` }}
            size="sm"
            isSelected={isActiveGrid}
            onValueChange={() => setIsActiveGrid(!isActiveGrid)}
          >
            چیدمان مجازی
          </Switch>
          <Switch
            classNames={{ label: `${darkMode ? "dark" : "light"}` }}
            size="sm"
            isSelected={isRealTime}
            onValueChange={() => setIsRealTime(!isRealTime)}
            className="ml-1"
          >
            RealTime
          </Switch>
          <Switch
            classNames={{ label: `${darkMode ? "dark" : "light"}` }}
            size="sm"
            isSelected={dragEnabled}
            onValueChange={toggleDrag}
            className="ml-1"
          >
            درگ کردن
          </Switch>
          <Button
            size="sm"
            variant="flat"
            className={`${darkMode ? "dark" : "light"}`}
            onPress={onFit}
            startContent={<TbMaximize />}
          >
            کالیبره
          </Button>
          <Button
            size="sm"
            className={`${darkMode ? "dark" : "light"}`}
            variant="flat"
            onPress={doCenter}
            startContent={<TbFocusCentered />}
          >
            مرکز صفحه
          </Button>
          <Button
            size="sm"
            variant="flat"
            className={`${darkMode ? "dark" : "light"}`}
            onPress={doReset}
            startContent={<TbZoomReset />}
          >
            100%
          </Button>

          <div className="h-6 w-px bg-gray-300/30 mx-1" />

          <Button
            size="sm"
            variant="flat"
            className={`${darkMode ? "dark" : "light"}`}
            onPress={doZoomOut}
            startContent={<TbZoomOut />}
          >
            Zoom-
          </Button>
          <Button
            size="sm"
            variant="flat"
            className={`${darkMode ? "dark" : "light"}`}
            onPress={doZoomIn}
            startContent={<TbZoomIn />}
          >
            Zoom+
          </Button>
        </div>
      </CardHeader>

      <CardBody className="px-0 pb-0">
        {/* کانواس */}
        <div
          className={`
            relative mx-auto
            w-[96%]
            h-[72vh]
            rounded-2xl overflow-hidden
            ${darkMode ? "ring-1 ring-[#2a2f36]" : "ring-1 ring-gray-200"}
          `}
          style={gridBg}
        >
          {/* قاب داخلی نرم */}
          <div
            className={`absolute inset-3 rounded-xl 
              ${darkMode ? "border border-white/10" : "border border-black/10"}
              pointer-events-none
            `}
          />

          {/* Konva Containers */}
          <div className="absolute inset-0">
            <div id="Video-Wall-Section" className="w-full h-full">
              <div
                id="Monitor"
                className="block w-full h-full overflow-hidden relative active:cursor-grabbing"
              >
                <div id="infiniteDiv" style={{ scale: 1 }} className="w-full h-full relative">
                  <div id="content" className="absolute inset-0">
                    {scenes.map((scene) => (
                      <div
                        key={scene.id}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        id={`containerKonva-${scene.id}`}
                        style={{ display: selectedScene === scene.id ? "block" : "none" }}
                        className="w-full h-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isActiveGrid && (
            <div
              className={`
      absolute left-3 right-3 bottom-2 rounded-2xl
      backdrop-blur-md shadow-lg border
      ${darkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}
    `}
            >
              <div className="px-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TbGridDots className="opacity-80" />
                    <span
                      className={`text-sm font-medium ${
                        darkMode ? "text-white/80" : "text-black/80"
                      }`}
                    >
                      ابزار چیدمان
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="light" onPress={doZoomOut} isIconOnly>
                      <TbZoomOut />
                    </Button>
                    <Button size="sm" variant="light" onPress={doZoomIn} isIconOnly>
                      <TbZoomIn />
                    </Button>
                    <Button size="sm" variant="light" onPress={doCenter} isIconOnly>
                      <TbFocusCentered />
                    </Button>
                    <Button size="sm" variant="light" onPress={onFit} isIconOnly>
                      <TbMaximize />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="px-3 pb-3">
                <div
                  className={`mt-2 rounded-xl overflow-hidden border ${
                    darkMode ? "border-white/10" : "border-black/10"
                  }`}
                >
                  {/* Tabs */}
                  <div
                    className={`grid grid-cols-3 text-center text-sm font-medium ${
                      darkMode ? "bg-white/5 text-white/70" : "bg-gray-400 text-black/70"
                    }`}
                  >
                    <button
                      className={`py-2 hover:opacity-80 ${
                        activeTab === "grid" ? "bg-primary/20" : ""
                      }`}
                      onClick={() => setActiveTab("grid")}
                    >
                      گرید
                    </button>
                    <button
                      className={`py-2 hover:opacity-80 ${
                        activeTab === "groups" ? "bg-primary/20" : ""
                      }`}
                      onClick={() => setActiveTab("groups")}
                    >
                      گروه‌ها
                    </button>
                    <button
                      className={`py-2 hover:opacity-80 ${
                        activeTab === "place" ? "bg-primary/20" : ""
                      }`}
                      onClick={() => setActiveTab("place")}
                    >
                      قرار دادن
                    </button>
                  </div>

                  {/* Panels */}
                  <div className={`${darkMode ? "bg-[#0f131a]" : "bg-white"} p-3`}>
                    {/* === Grid panel === */}
                    <div className={activeTab === "grid" ? "grid grid-cols-12 gap-2" : "hidden"}>
                      <div className="col-span-12 md:col-span-3">
                        <Select
                          size="sm"
                          label="مانیتور"
                          selectedKeys={gridMonitorId ? [String(gridMonitorId)] : []}
                          onChange={(e) => setGridMonitorId(Number(e.target.value))}
                        >
                          {videoWalls.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.name ?? `Monitor ${m.id}`}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <Input
                          size="sm"
                          type="number"
                          min={1}
                          label="سطر"
                          value={String(gridRows)}
                          onChange={(e) => setGridRows(e.target.value)}
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <Input
                          size="sm"
                          type="number"
                          min={1}
                          label="ستون"
                          value={String(gridCols)}
                          onChange={(e) => setGridCols(e.target.value)}
                        />
                      </div>
                      <div className="col-span-12 md:col-span-2 flex items-end">
                        <Button size="sm" color="primary" className="w-full" onPress={applyGrid}>
                          اعمال گرید
                        </Button>
                      </div>
                    </div>

                    {/* === Groups panel === */}
                    <div className={activeTab === "groups" ? "grid grid-cols-12 gap-2" : "hidden"}>
                      <div className="col-span-12 md:col-span-5">
                        <Select
                          size="sm"
                          selectionMode="multiple"
                          label="انتخاب مانیتورها"
                          selectedKeys={selectedMonitors.map(String)}
                          onSelectionChange={(keys) => setSelectedMonitors([...keys].map(Number))}
                        >
                          {videoWalls.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.name ?? `Monitor ${m.id}`}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                      <div className="col-span-6 md:col-span-2 flex items-end">
                        <Button
                          size="sm"
                          color="danger"
                          className="w-full"
                          isDisabled={!selectedMonitors.length}
                          onPress={handleCreateGroup}
                        >
                          ایجاد گروه
                        </Button>
                      </div>
                      <div className="col-span-6 md:col-span-2 flex items-end">
                        <Button
                          size="sm"
                          color="warning"
                          className="w-full"
                          isDisabled={!groups.length}
                          onPress={handleCancelGroup}
                        >
                          لغو گروه اخیر
                        </Button>
                      </div>
                    </div>

                    {/* === Place panel === */}
                    <div className={activeTab === "place" ? "grid grid-cols-12 gap-2" : "hidden"}>
                      <div className="col-span-12 md:col-span-6">
                        <div className="col-span-12 flex flex-col gap-2 md:col-span-3">
                          <div className="w-full flex items-center justify-center mx-auto">
                            <Select
                              size="sm"
                              label="گروه"
                              selectedKeys={
                                selectedGroupIndex !== null && selectedGroupIndex !== undefined
                                  ? [String(selectedGroupIndex)]
                                  : []
                              }
                              onChange={(e) => setSelectedGroupIndex(Number(e.target.value))}
                              isDisabled={!groups.length}
                            >
                              {groups.length === 0 ? (
                                <SelectItem key="__ng" isReadOnly>
                                  گروهی ندارید
                                </SelectItem>
                              ) : (
                                groups.map((g, idx) => (
                                  <SelectItem key={idx} value={String(idx)}>
                                    {g.getAttr("groupName") || `Group ${idx + 1}`}
                                  </SelectItem>
                                ))
                              )}
                            </Select>
                            <Select
                              size="sm"
                              label="سلول"
                              selectedKeys={selectedCellIndex ? [String(selectedCellIndex)] : []}
                              onChange={(e) => setSelectedCellIndex(e.target.value)}
                              isDisabled={!cellOptions.length}
                            >
                              {cellOptions.length === 0 ? (
                                <SelectItem key="__empty" isReadOnly>
                                  ابتدا گرید را اعمال کنید
                                </SelectItem>
                              ) : (
                                cellOptions.map((c) => (
                                  <SelectItem key={c.key} value={c.value}>
                                    {c.label}
                                  </SelectItem>
                                ))
                              )}
                            </Select>
                          </div>
                          <Select
                            size="sm"
                            label="منبع"
                            selectedKeys={selectedAssetKey ? [selectedAssetKey] : []}
                            onChange={(e) => setSelectedAssetKey(e.target.value)}
                          >
                            {inputs.length > 0 && (
                              <SelectItem key="__group_inputs" isReadOnly>
                                — ورودی‌ها —
                              </SelectItem>
                            )}
                            {inputs.map((i) => (
                              <SelectItem key={`INPUT:${i.id}`} value={`INPUT:${i.id}`}>
                                [INPUT] {i.name}
                              </SelectItem>
                            ))}
                            {resources.length > 0 && (
                              <SelectItem key="__group_files" isReadOnly>
                                — فایل‌ها —
                              </SelectItem>
                            )}
                            {resources.map((r) => (
                              <SelectItem key={`${r.type}:${r.id}`} value={`${r.type}:${r.id}`}>
                                [{r.type}] {r.name}
                              </SelectItem>
                            ))}
                          </Select>
                        </div>
                      </div>
                      <div className="col-span-6 md:col-span-3 flex items-end">
                        <Button
                          size="sm"
                          color="success"
                          className="w-full"
                          onPress={handlePlace}
                          isDisabled={!selectedCellIndex || !selectedAssetKey}
                        >
                          قرار بده (سلول)
                        </Button>
                      </div>
                      <div className="col-span-6 md:col-span-3 flex items-end">
                        <Button
                          size="sm"
                          color="success"
                          className="w-full"
                          onPress={handlePlaceIntoGroup}
                          isDisabled={
                            !selectedAssetKey ||
                            selectedGroupIndex === null ||
                            selectedGroupIndex === undefined ||
                            !groups.length
                          }
                        >
                          قرار بده (گروه)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
