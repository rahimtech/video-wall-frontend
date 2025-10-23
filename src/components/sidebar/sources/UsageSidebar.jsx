import React, { useState, useMemo } from "react";
import { Button, Chip, Tooltip } from "@nextui-org/react";
import {
  FaTrashAlt,
  FaCog,
  FaArrowDown,
  FaArrowUp,
  FaFont,
  FaGlobe,
  FaImage,
  FaVideo,
  FaPen,
  FaStream,
  FaRss,
} from "react-icons/fa";
import { MdDelete, MdFormatSize, MdInput, MdRefresh } from "react-icons/md";
import { useMyContext } from "@/context/MyContext";
import ModalMonitorSelection from "../scenes/screen/ModalMonitorSelection";
import { openTextContextMenuById } from "@/components/konva/items/text/TextKonva";
import { CgSize } from "react-icons/cg";
import { RiFontSize } from "react-icons/ri";
import { FiMonitor } from "react-icons/fi";
import { TbUvIndex } from "react-icons/tb";

const TYPE_ICON = {
  IMAGE: FaImage,
  VIDEO: FaVideo,
  IFRAME: FaGlobe,
  TEXT: FaFont,
  INPUT: MdInput,
  STREAM: FaStream,
  RSS: FaRss,
};

const TYPE_COLOR = {
  IMAGE: "success",
  VIDEO: "primary",
  IFRAME: "warning",
  TEXT: "secondary",
  STREAM: "danger",
  RSS: "warning",
};

const UsageSidebar = () => {
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [newName, setNewName] = useState("");
  const [showIndex, setShowIndex] = useState(false);

  const {
    darkMode,
    setScenes,
    selectedScene,
    sources,
    setSources,
    allDataMonitors,
    getSelectedScene,
    deleteSourceFromScene,
    fitToMonitors,
    sendOperation,
    selectedSource,
    setSelectedSource,
  } = useMyContext();

  // فقط منابعِ صحنهٔ انتخاب‌شده
  const usageSources = useMemo(() => {
    const sceneId = getSelectedScene()?.id;
    if (!sceneId) return [];

    return sources
      .filter((s) => s.sceneId === sceneId)
      .slice() // کپیِ آرایه تا منابع اصلی تغییر نکنند
      .sort((a, b) => {
        // پشتیبانی از چند نام فیلد (z یا zIndex) و تبدیل به عدد امن
        const az = Number(a.z ?? a.zIndex ?? 0);
        const bz = Number(b.z ?? b.zIndex ?? 0);

        // نزولی: مقدار بزرگتر z اول نمایش داده می‌شود (روی لایه جلوتر)
        return bz - az;
      });
  }, [sources, selectedScene /* یا getSelectedScene()?.id اگر می‌خواهید */]);

  // --- helpers: انتخاب و هایلایت
  const isSelectedRow = (res) =>
    res.type === "INPUT" ? selectedSource === res.uniqId : selectedSource === res.externalId;

  // --- update name
  const updateSourceName = (resourceId, name, isSource = true) => {
    setSources((prev) => prev.map((it) => (it.externalId === resourceId ? { ...it, name } : it)));
    if (isSource) {
      sendOperation("source", {
        action: "resize",
        id: resourceId,
        payload: { name },
      });
    } else {
      setScenes((prevScenes) =>
        prevScenes.map((sc) => {
          if (sc.id !== selectedScene) return sc;
          const updated = sc.usageSources.map((r) =>
            r.externalId === resourceId ? { ...r, name, content: name } : r
          );
          return { ...sc, usageSources: updated };
        })
      );
    }
  };

  const handleDoubleClick = (resource) => {
    setEditingResourceId(resource.externalId);
    setNewName(resource.name || "");
  };

  const handleNameSave = (resourceId) => {
    updateSourceName(resourceId, newName);
    setEditingResourceId(null);
    setNewName("");
    location.reload();
  };

  const handleKeyDownEdit = (e, id) => {
    if (e.key === "Enter") handleNameSave(id);
    if (e.key === "Escape") {
      setEditingResourceId(null);
      setNewName("");
    }
  };

  let helperSourceUp = 1;
  let helperSourceDown = 1;

  // --- ترتیب Z
  const moveSource = (id, direction) => {
    const currentSceneId = getSelectedScene()?.id;
    if (!currentSceneId) return;

    // منابع همین صحنه
    const sceneSources = sources.filter((s) => s.sceneId === currentSceneId);
    if (sceneSources.length === 0) return;

    // مرتب‌سازی منابع بر اساس z-index
    const sortedSources = [...sceneSources].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));

    // پیدا کردن منبع جاری و ایندکس آن
    const currentIndex = sortedSources.findIndex((s) => s.externalId === id);
    if (currentIndex === -1) return;

    // محاسبه ایندکس جدید
    const newIndex = currentIndex + (direction > 0 ? -1 : 1);

    // بررسی مرزها
    if (newIndex < 0 || newIndex >= sortedSources.length) return;

    // جابجایی در آرایه مرتب‌شده
    const updatedSources = [...sortedSources];
    [updatedSources[currentIndex], updatedSources[newIndex]] = [
      updatedSources[newIndex],
      updatedSources[currentIndex],
    ];

    // تخصیص z-index جدید از 1 تا n
    const finalSources = updatedSources.map((source, index) => ({
      ...source,
      z: index + 1, // شروع از 1 به جای 0
    }));

    // به‌روزرسانی state
    setSources((prev) => {
      const otherSources = prev.filter((s) => s.sceneId !== currentSceneId);
      return [...otherSources, ...finalSources];
    });

    // به‌روزرسانی گرافیکی در Konva
    const layer = getSelectedScene()?.layer;
    const node = layer?.findOne(`#${id}`);

    if (node) {
      if (direction > 0) {
        node.moveDown();
      } else {
        node.moveUp();
      }
      layer.draw();
    }

    // ارسال به سرور برای همه منابعی که z-index تغییر کرده
    finalSources.forEach((source) => {
      const originalZ = sortedSources.find((s) => s.externalId === source.externalId)?.z ?? 0;
      if (source.z !== originalZ) {
        sendOperation("source", {
          action: "move",
          id: source.externalId,
          payload: { z: source.z },
        });
      }
    });
  };

  // --- رندر
  return (
    <div
      dir="rtl"
      className="p-2 rounded-lg h-full overflow-auto flex flex-col"
      style={{ color: darkMode ? "#ffffff" : "#000000" }}
    >
      {/* Header */}
      <div className="sticky top-[-10px] z-[50] px-3 py-[6px] bg-inherit">
        <div className="flex items-center justify-between">
          <h2 className="text-md font-semibold flex items-center gap-2">
            منابع استفاده‌شده
            <Chip size="sm" color="primary" variant="flat">
              {usageSources.length}
            </Chip>
          </h2>
        </div>
        {showIndex && (
          <div className="flex w-full gap-2">
            <Tooltip content="سینک شدن محتواهای کنترلر با درایور">
              <button
                className="p-1 bg-orange-500 text-sm w-full cursor-pointer rounded "
                onClick={(e) => {
                  location.reload();
                  setShowIndex(false);
                }}
                aria-label="rename"
              >
                همسان سازی
              </button>
            </Tooltip>
            <button
              className="p-1 bg-red-500 text-sm w-full cursor-pointer rounded hover:bg-red-500"
              onClick={(e) => {
                setShowIndex(false);
              }}
              aria-label="rename"
            >
              لغو
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <ul className="flex flex-col gap-2">
          {usageSources.map((resource) => {
            const type = resource.media?.type || resource.type || "TEXT";
            const Icon = TYPE_ICON[type] || FaFont;

            const rowSelected = isSelectedRow(resource);
            const rowBase = darkMode ? "" : "";
            const rowSelectedCls = rowSelected
              ? darkMode
                ? " bg-blue-700 "
                : " bg-blue-300 "
              : "  ";

            return (
              <li
                key={resource.externalId}
                // className={`flex items-center cursor-pointer justify-between rounded-md ${
                //   darkMode ? "bg-gray-900" : "bg-gray-100"
                // } px-1 py-[10px] transition-all ${rowBase} ${rowSelectedCls}`}
                onClick={() => {
                  const layer = getSelectedScene()?.layer;
                  if (!layer) return;

                  // پاک‌کردن Transformerهای قدیمی
                  layer.find("Transformer").forEach((tr) => {
                    if (tr.attrs.id !== resource.externalId) tr.detach();
                  });
                  layer.find("Group").forEach((g) => {
                    if (g.attrs.id !== resource.externalId) g.draggable(false);
                  });
                  layer.draw();

                  const group = layer.findOne(`#${resource.externalId}`);
                  if (!group) return;

                  // تشخیص type المان
                  const elementType = resource.type || resource.media?.type;

                  // تنظیم anchors بر اساس type
                  let enabledAnchors = [];
                  if (elementType === "TEXT" || elementType === "RSS") {
                    // برای متن: فقط rotate - بدون anchors
                    enabledAnchors = [];
                  } else {
                    // برای بقیه (IMAGE, VIDEO, INPUT, etc.): anchors کامل
                    enabledAnchors = ["top-left", "top-right", "bottom-left", "bottom-right"];
                  }

                  // اگر Transformer پیدا نشد، بساز
                  let transformer = layer.findOne(`Transformer[id="${resource.externalId}"]`);
                  if (!transformer) {
                    transformer = new Konva.Transformer({
                      nodes: [group],
                      enabledAnchors: enabledAnchors,
                      rotateEnabled: true,
                      keepRatio: true,
                      id: resource.externalId,
                    });
                    transformer.flipEnabled(false);
                    layer.add(transformer);
                  } else {
                    transformer.nodes([group]);
                    // آپدیت anchors برای transformer موجود
                    transformer.enabledAnchors(enabledAnchors);
                  }

                  group.draggable(true);
                  layer.batchDraw();

                  setSelectedSource(resource.externalId);
                }}
                className={`text-sm  cursor-pointer flex flex-wrap items-center justify-between  ${
                  type == "INPUT"
                    ? selectedSource == resource.externalId
                      ? "bg-blue-500"
                      : darkMode
                      ? "bg-gray-700"
                      : "bg-gray-300"
                    : selectedSource == resource.externalId
                    ? "bg-blue-500"
                    : darkMode
                    ? "bg-gray-700"
                    : "bg-gray-300"
                } p-2 rounded-md shadow-sm`}
              >
                {/* Left: type + name + inline rename + z-order */}
                <div className="flex items-center gap-2 min-w-0">
                  <Chip
                    size="sm"
                    color={TYPE_COLOR[type] || "default"}
                    variant="solid"
                    className="min-w-[56px] justify-center p-0"
                  >
                    <div className="flex items-center gap-1">
                      <span>{resource.z ?? 1}</span>
                      <Icon size={12} />
                      <span className="text-[10px]">{type}</span>
                    </div>
                  </Chip>

                  {/* نام + ادیت */}
                  {editingResourceId === resource.externalId ? (
                    <input
                      className="px-2 py-[2px] rounded bg-white text-black text-sm w-[180px] outline-none"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={() => handleNameSave(resource.externalId)}
                      onKeyDown={(e) => handleKeyDownEdit(e, resource.externalId)}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className={`truncate max-w-[180px] text-sm ${
                          darkMode ? "text-white" : "text-black"
                        }`}
                        title={resource.name}
                        onDoubleClick={() => handleDoubleClick(resource)}
                      >
                        {resource.name}
                      </span>
                      <Tooltip content="تغییر نام">
                        <button
                          className="p-1 rounded hover:bg-black/10"
                          onClick={(e) => {
                            handleDoubleClick(resource);
                          }}
                          aria-label="rename"
                        >
                          <FaPen size={12} />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>

                {/* Right: fit, text settings, delete */}
                <div className="flex items-center gap-1">
                  {/* Z-order controls */}
                  <div className="flex items-center gap-1 ml-2">
                    <Tooltip content="اولویت بالا">
                      <Button
                        size="sm"
                        variant="light"
                        className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                        onPress={(e) => {
                          moveSource(resource.externalId, -1);
                          setShowIndex(true);
                        }}
                      >
                        <FaArrowUp size={14} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="اولویت پایین">
                      <Button
                        size="sm"
                        variant="light"
                        className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                        onPress={(e) => {
                          moveSource(resource.externalId, 1);
                          setShowIndex(true);
                        }}
                      >
                        <FaArrowDown size={14} />
                      </Button>
                    </Tooltip>
                  </div>
                  <ModalMonitorSelection
                    item={resource}
                    darkMode={darkMode}
                    videoName={resource.externalId}
                    uniqId={resource.externalId}
                    monitors={allDataMonitors}
                    fitToMonitors={fitToMonitors}
                  />

                  {(resource?.media?.type === "TEXT" ||
                    resource.type === "TEXT" ||
                    type === "RSS" ||
                    type === "TEXT") && (
                    <Tooltip content="تنظیمات متن">
                      <Button
                        size="sm"
                        variant="light"
                        className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                        onPress={(e) => {
                          openTextContextMenuById(resource.externalId, {
                            getSelectedScene,
                            setSources,
                            sendOperation,
                          });
                        }}
                      >
                        <FaCog size={15} />
                      </Button>
                    </Tooltip>
                  )}

                  <Tooltip content="حذف از صحنه">
                    <Button
                      size="sm"
                      variant="light"
                      className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
                      onPress={(e) => {
                        deleteSourceFromScene({
                          id: resource.externalId,
                          getSelectedScene,
                          setSources,
                          sendOperation,
                        });
                      }}
                    >
                      <MdDelete size={16} />
                    </Button>
                  </Tooltip>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default UsageSidebar;
