// src/components/konva/Canvas.jsx
import React, { useEffect, useMemo, useState } from "react";
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

function getGridCells(layer, monitorId) {
  const group = layer.findOne(`#monitor-group-${monitorId}`);
  if (!group) return [];
  const gridMeta = group.getAttr("gridMeta");
  if (!gridMeta?.rows || !gridMeta?.cols) return [];

  const rect = group.findOne("Rect");
  if (!rect) return [];

  const abs = group.getAbsoluteTransform().copy();
  const rows = gridMeta.rows;
  const cols = gridMeta.cols;
  const cellW = rect.width() / cols;
  const cellH = rect.height() / rows;

  const cells = [];
  let idx = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // گوشه‌های سلول در مختصات local مانیتور
      const tlLocal = { x: c * cellW, y: r * cellH };
      const brLocal = { x: (c + 1) * cellW, y: (r + 1) * cellH };

      // تبدیل به مختصات لایه/استیج
      const tlAbs = abs.point(tlLocal);
      const brAbs = abs.point(brLocal);

      cells.push({
        index: idx++,
        row: r,
        col: c,
        rect: {
          x: tlAbs.x,
          y: tlAbs.y,
          width: brAbs.x - tlAbs.x,
          height: brAbs.y - tlAbs.y,
        },
      });
    }
  }
  return cells;
}

function placeResourceInCell({
  type, // "IMAGE" | "VIDEO" | "IFRAME" | "INPUT"
  resource, // آبجکت منبع انتخاب‌شده
  cellRect, // {x,y,width,height}
  ctx, // useMyContext() => { addImage, addVideo, ... , getSelectedScene, ... }
}) {
  const {
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
  } = ctx;
  const scn = getSelectedScene();
  if (!scn) return;

  const base = {
    x: cellRect.x,
    y: cellRect.y,
    width: cellRect.width,
    height: cellRect.height,
    sceneId: scn.id,
  };

  if (type === "IMAGE") {
    // addImage انتظار دارد: { img, getSelectedScene, ... }
    addImage({
      img: { ...resource, ...base },
      getSelectedScene,
      setSources,
      sendOperation,
      url,
      generateBlobImageURL,
    });
  } else if (type === "VIDEO") {
    addVideo({
      videoItem: { ...resource, ...base },
      getSelectedScene,
      setSources,
      sendOperation,
      url,
      loopVideos,
    });
  } else if (type === "IFRAME") {
    addWeb({
      webResource: { ...resource, ...base },
      getSelectedScene,
      setSources,
      sendOperation,
      url,
    });
  } else if (type === "INPUT") {
    addInput({ input: { ...resource, ...base }, getSelectedScene, setSources, sendOperation });
  }
}

export default function Canvas({ title = "بوم نمایش", subtitle = "Drag & Drop منابع روی صحنه" }) {
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
      className={`my-auto ${isToggleLayout ? " w-[98%]" : " w-[58%]"} py-2 bottom-0 top-5 
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
            isSelected={dragEnabled}
            onValueChange={toggleDrag}
            className="ml-1"
          >
            درگ کردن
          </Switch>
          <Button size="sm" variant="flat" onPress={doFit} startContent={<TbMaximize />}>
            فیت
          </Button>
          <Button size="sm" variant="flat" onPress={doCenter} startContent={<TbFocusCentered />}>
            سنتر
          </Button>
          <Button size="sm" variant="flat" onPress={doReset} startContent={<TbZoomReset />}>
            100%
          </Button>

          <div className="h-6 w-px bg-gray-300/30 mx-1" />

          <Button size="sm" variant="flat" onPress={doZoomOut} startContent={<TbZoomOut />}>
            Zoom-
          </Button>
          <Button size="sm" variant="flat" onPress={doZoomIn} startContent={<TbZoomIn />}>
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

          {/* Footer bar: Virtual Grid Builder */}
          {isActiveGrid && (
            <div className="absolute left-3 right-3 bottom-1 flex items-center gap-2 rounded-xl px-3 py-2 backdrop-blur-sm bg-black/10 dark:bg-white/10 shadow-sm">
              <TbGridDots className="opacity-80" />
              <Select
                size="sm"
                label="مانیتور"
                selectedKeys={gridMonitorId ? [String(gridMonitorId)] : []}
                className="w-44"
                onChange={(e) => setGridMonitorId(Number(e.target.value))}
              >
                {videoWalls.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name ?? `Monitor ${m.id}`}
                  </SelectItem>
                ))}
              </Select>
              <Input
                size="sm"
                type="number"
                min={1}
                label="سطر"
                className="w-24"
                value={String(gridRows)}
                onChange={(e) => setGridRows(e.target.value)}
              />
              <Input
                size="sm"
                type="number"
                min={1}
                label="ستون"
                className="w-24"
                value={String(gridCols)}
                onChange={(e) => setGridCols(e.target.value)}
              />
              <Button size="sm" color="primary" onPress={applyGrid}>
                اعمال گرید
              </Button>

              <div className="h-6 w-px bg-gray-300/30 mx-1" />

              <Select
                size="sm"
                label="سلول"
                selectedKeys={selectedCellIndex ? [String(selectedCellIndex)] : []}
                className="w-36"
                onChange={(e) => setSelectedCellIndex(e.target.value)}
                isDisabled={!cellOptions.length}
              >
                {cellOptions.map((c) => (
                  <SelectItem key={c.key} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </Select>

              <Select
                size="sm"
                label="منبع"
                selectedKeys={selectedAssetKey ? [selectedAssetKey] : []}
                className="w-60"
                onChange={(e) => setSelectedAssetKey(e.target.value)}
              >
                {/* Inputs */}
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

                {/* Resources */}
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

              <Button
                size="sm"
                color="success"
                onPress={handlePlace}
                isDisabled={!selectedCellIndex || !selectedAssetKey}
              >
                قرار بده
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
