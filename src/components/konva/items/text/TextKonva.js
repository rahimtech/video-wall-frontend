// src/components/konva/items/text/TextKonva.js
import Konva from "konva";

import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";

function coerceNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function openMarqueeSettingsModal({ initial }) {
  return Swal.fire({
    title: "تنظیمات زیرنویس",
    html: `
      <div style="text-align:right">
        <div style="display:flex; gap:8px">
          <div style="flex:1">
            <label>عرض باکس (px):</label>
            <input id="mq-w" class="swal2-input" type="number" min="50" step="10" value="${
              initial.width ?? 400
            }">
          </div>
          <div style="flex:1">
            <label>ارتفاع باکس (px):</label>
            <input id="mq-h" class="swal2-input" type="number" min="20" step="5" value="${
              initial.height ?? 50
            }">
          </div>
        </div>
        <div style="display:flex; gap:8px">
          <div style="flex:1">
            <label>سرعت (px/sec):</label>
            <input id="mq-speed" class="swal2-input" type="number" min="10" step="5" value="${
              initial.speed ?? 80
            }">
          </div>
          <div style="flex:1">
            <label>جهت حرکت:</label>
            <select id="mq-dir" class="swal2-select">
              <option value="rtl" ${
                initial.dir === "rtl" ? "selected" : ""
              }>راست ← چپ (RTL)</option>
              <option value="ltr" ${
                initial.dir === "ltr" ? "selected" : ""
              }>چپ → راست (LTR)</option>
            </select>
          </div>
        </div>
        <div style="margin-top:8px">
          <label>پس‌زمینه باکس:</label>
          <input id="mq-bg" class="swal2-input" type="color" value="${initial.bg ?? "#000000"}">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonColor: "green",
    confirmButtonText: "اعمال",
    cancelButtonColor: "red",
    cancelButtonText: "انصراف",
    focusConfirm: false,
    preConfirm: () => {
      const w = Number(document.getElementById("mq-w").value);
      const h = Number(document.getElementById("mq-h").value);
      const speed = Number(document.getElementById("mq-speed").value);
      const dir = document.getElementById("mq-dir").value || "rtl";
      const bg = document.getElementById("mq-bg").value || "#000000";
      return {
        width: Number.isFinite(w) ? w : 400,
        height: Number.isFinite(h) ? h : 50,
        speed: Number.isFinite(speed) ? speed : 80,
        dir,
        bg,
      };
    },
  });
}

async function showTextContextMenu({ group, textNode, layer, setSources, sendOperation }) {
  const isMarquee = !!group.getAttr("_marquee");
  const cfg = group.getAttr("_marqueeCfg") || {
    width: 400,
    height: 50,
    speed: 80,
    dir: "rtl",
    bg: "#000000",
  };
  const uniqId = group.id();

  const res = await Swal.fire({
    title: "عملیات متن",
    showCancelButton: true,
    cancelButtonColor: "red",
    cancelButtonText: "بستن",
    showDenyButton: true,
    denyButtonColor: isMarquee ? "#ef4444" : "black",
    denyButtonText: isMarquee ? "خاموش‌کردن زیرنویس" : "روشن‌کردن زیرنویس",
    confirmButtonColor: "black",
    confirmButtonText: "تنظیمات زیرنویس",
    footer: `
      <button id="btn-edit" class="swal2-confirm swal2-styled" style="background:#2563eb;margin-top:6px">
        ویرایش متن/استایل
      </button>
      <button id="btn-del" class="swal2-confirm swal2-styled" style="background:#ef4444;margin-top:6px">
        حذف
      </button>
    `,
    didOpen: () => {
      const btnDel = document.getElementById("btn-del");
      if (btnDel) {
        btnDel.addEventListener("click", async () => {
          Swal.close();
          group.destroy();
          layer.draw();
          setSources((prev) => prev.filter((s) => s.externalId !== uniqId));
          sendOperation("source", { action: "remove", id: uniqId, payload: {} });
        });
      }
      const btnEdit = document.getElementById("btn-edit");
      if (btnEdit) {
        btnEdit.addEventListener("click", async () => {
          Swal.close();
          const { isConfirmed: ok, value } = await openTextEditorModal({
            initial: {
              text: textNode.text(),
              fontSize: textNode.fontSize(),
              fill: textNode.fill(),
              align: textNode.align(),
            },
          });
          if (!ok) return;
          textNode.text(value.text);
          textNode.fontSize(coerceNumber(value.fontSize, textNode.fontSize()));
          textNode.fill(value.fill);
          textNode.align(value.align);

          if (group.getAttr("_marquee")) {
            const cfgNow = group.getAttr("_marqueeCfg") || cfg;
            startMarquee(group, textNode, cfgNow);
          } else {
            // اگر تابع syncBGNormal داری، صداش بزن (یا باکس انتخاب رو آپدیت کن)
          }
          layer.batchDraw();

          sendOperation("source", {
            action: "update",
            id: uniqId,
            payload: {
              content: value.text,
              fontSize: textNode.fontSize(),
              fill: textNode.fill(),
              align: textNode.align(),
            },
          });
        });
      }
    },
  });

  if (res.isDenied) {
    if (isMarquee) {
      stopMarquee(group);
      // syncBGNormal();
    } else {
      startMarquee(group, textNode, cfg);
    }
    layer.draw();
    return;
  }

  if (res.isConfirmed) {
    const { isConfirmed: ok, value: cfgNew } = await openMarqueeSettingsModal({ initial: cfg });
    if (!ok) return;
    startMarquee(group, textNode, cfgNew);
    sendOperation("source", {
      action: "update",
      id: uniqId,
      payload: { marquee: { enabled: true, ...cfgNew } },
    });
  }
}

// ⬇️ اکسپورت برای فراخوانی از بیرون (UsageSidebar)
export function openTextContextMenuById(
  externalId,
  { getSelectedScene, setSources, sendOperation }
) {
  const scn = getSelectedScene?.();
  const layer = scn?.layer;
  if (!layer) return;
  const group = layer.findOne(`#${externalId}`);
  if (!group) return;
  // متن را پیدا کن: یا داخل marqueeInner یا مستقیماً زیر گروه
  let textNode = group.findOne(".marqueeInner Text") || group.findOne("Text");
  if (!textNode) return;

  showTextContextMenu({ group, textNode, layer, setSources, sendOperation });
}

function openTextEditorModal({ initial }) {
  return Swal.fire({
    title: "تنظیمات متن",
    html: `
      <div style="text-align:right">
        <label>متن:</label>
        <textarea id="txt-content" class="swal2-textarea" rows="3">${initial.text ?? ""}</textarea>
        <div style="display:flex; gap:8px; margin-top:8px">
          <div style="flex:1">
            <label>اندازه فونت:</label>
            <input id="txt-fontsize" class="swal2-input" type="number" min="8" step="1" value="${
              initial.fontSize ?? 40
            }">
          </div>
          <div style="flex:1">
            <label>رنگ:</label>
            <input id="txt-color" class="swal2-input" type="color" value="${
              initial.fill ?? "#ffffff"
            }">
          </div>
        </div>
        <div style="margin-top:8px">
          <label>تراز:</label>
          <select id="txt-align" class="swal2-select">
            <option value="left" ${initial.align === "left" ? "selected" : ""}>چپ</option>
            <option value="center" ${initial.align === "center" ? "selected" : ""}>وسط</option>
            <option value="right" ${initial.align === "right" ? "selected" : ""}>راست</option>
          </select>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonColor: "green",
    confirmButtonText: "ذخیره",
    cancelButtonColor: "red",
    cancelButtonText: "انصراف",
    focusConfirm: false,
    preConfirm: () => {
      const text = document.getElementById("txt-content").value ?? "";
      const fontSize = coerceNumber(document.getElementById("txt-fontsize").value, 40);
      const fill = document.getElementById("txt-color").value || "#ffffff";
      const align = document.getElementById("txt-align").value || "left";
      return { text, fontSize, fill, align };
    },
  });
}

function hexToRgba(hex, alpha = 1) {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  const int = parseInt(h, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function startMarquee(group, textNode, cfg) {
  stopMarquee(group);
  const layer = group.getLayer();
  if (!layer) return;

  // ساخت/گرفتن ویوپورت کلیپ‌دار
  let viewport = group.findOne(".marqueeViewport");
  if (!viewport) {
    viewport = new Konva.Group({
      name: "marqueeViewport",
      clip: { x: 0, y: 0, width: cfg.width, height: cfg.height },
    });
    group.add(viewport);
  } else {
    viewport.clip({ x: 0, y: 0, width: cfg.width, height: cfg.height });
  }

  // پس‌زمینهٔ باکس زیرنویس
  let bg = group.findOne(".marqueeBG");
  if (!bg) {
    bg = new Konva.Rect({
      name: "marqueeBG",
      x: 0,
      y: 0,
      width: cfg.width,
      height: cfg.height,
      fill: hexToRgba(cfg.bg, 0.65),
      cornerRadius: 3,
      stroke: "white",
      strokeWidth: 1,
      listening: true,
    });
    group.add(bg);
    bg.moveToBottom(); // بک‌گراند زیر همه
  } else {
    bg.width(cfg.width);
    bg.height(cfg.height);
    bg.fill(hexToRgba(cfg.bg, 0.65));
  }

  // گروه داخلی حرکت‌کننده
  let inner = viewport.findOne(".marqueeInner");
  if (!inner) {
    inner = new Konva.Group({ name: "marqueeInner" });
    viewport.add(inner);
  } else {
    inner.removeChildren(); // متن قبلی را پاک کن
  }

  // متن را به inner منتقل کن
  inner.add(textNode);
  // متن را همتراز عمودی وسط کن
  textNode.y((cfg.height - textNode.height()) / 2);

  // نقطهٔ شروع متن بر اساس جهت
  if (cfg.dir === "rtl") {
    inner.x(cfg.width); // از راست وارد شود
  } else {
    inner.x(-textNode.width()); // از چپ وارد شود
  }
  inner.y(0);

  // انیمیشن
  const anim = new Konva.Animation((frame) => {
    const dt = (frame?.timeDiff ?? 16) / 1000;
    const step = cfg.speed * dt;

    if (cfg.dir === "rtl") {
      inner.x(inner.x() - step);
      // وقتی متن کامل از چپ بیرون رفت، از راست دوباره شروع کن
      if (inner.x() + textNode.width() < 0) {
        inner.x(cfg.width);
      }
    } else {
      inner.x(inner.x() + step);
      // وقتی متن کامل از راست بیرون رفت، از چپ دوباره شروع کن
      if (inner.x() > cfg.width) {
        inner.x(-textNode.width());
      }
    }
  }, layer);
  anim.start();

  group.setAttr("_marqueeAnim", anim);
  group.setAttr("_marquee", true);
  group.setAttr("_marqueeCfg", cfg);

  layer.batchDraw();
}

function stopMarquee(group) {
  const anim = group.getAttr("_marqueeAnim");
  if (anim && anim.stop) anim.stop();
  group.setAttr("_marqueeAnim", null);
  group.setAttr("_marquee", false);
}

export const addText = ({
  textItem, // { text, name, x, y, width?, height?, rotation?, fill?, fontSize?, align? }
  mode = true,
  getSelectedScene,
  setSources,
  sendOperation,
}) => {
  const scn = getSelectedScene?.();
  const selectedSceneLayer = scn?.layer;
  const stage = scn?.stageData;
  if (!selectedSceneLayer) return;

  const uniqId = mode ? uuidv4() : textItem.externalId;
  const targetX = Number.isFinite(textItem?.x) ? textItem.x : 0;
  const targetY = Number.isFinite(textItem?.y) ? textItem.y : 0;

  // پیش‌فرض‌های متن
  const initialText = textItem.text ?? textItem.content ?? "متن جدید";
  const initialFill = textItem.fill ?? "#ffffff";
  const initialSize = coerceNumber(textItem.fontSize, 40);
  const initialAlign = textItem.align ?? "left";
  const rotation = textItem.rotation || 0;

  // --- ارسال به سرور (در حالت آنلاین) ---
  if (mode) {
    sendOperation("source", {
      action: "add",
      id: String(uniqId),
      payload: {
        type: "TEXT",
        name: textItem.name ?? "TEXT",
        x: targetX,
        y: targetY,
        width: textItem.width ?? undefined, // متن نرمال عرض/ارتفاع داینامیک دارد
        height: textItem.height ?? undefined,
        rotation,
        sceneId: scn.id,
        externalId: uniqId,
        content: initialText,
        metadata: {
          text: initialText,
          fill: initialFill,
          fontSize: initialSize,
          align: initialAlign,
        },
      },
    });
  }

  // --- ساخت نودهای کنوا ---
  const textNode = new Konva.Text({
    text: initialText,
    x: 0,
    y: 0,
    fontFamily: "IRANSans, Vazirmatn, Arial",
    fontSize: initialSize,
    fill: initialFill,
    align: initialAlign,
    padding: 6,
    listening: true,
    name: "object",
    uniqId,
  });

  // زمینه کم‌رنگ برای انتخاب (دلخواه)
  const bgRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: textNode.width(),
    height: textNode.height(),
    fill: "rgba(255,255,255,0.04)",
    stroke: "white",
    strokeWidth: 1,
    listening: false,
  });

  const group = new Konva.Group({
    x: targetX,
    y: targetY,
    draggable: false,
    id: String(uniqId),
    uniqId,
    rotation,
  });

  group.add(textNode);
  selectedSceneLayer.add(group);

  // بعد از تغییر اندازه متن، بک‌رکت را هماهنگ نگه داریم
  function syncBGNormal() {
    // وقتی زیرنویس خاموشه: زمینه صرفاً هایلایت دور متن است
    bgRect.width(textNode.width());
    bgRect.height(textNode.height());
    bgRect.fill("rgba(255,255,255,0.04)");
    bgRect.stroke("white");
    bgRect.strokeWidth(1);
  }

  syncBGNormal();

  // ترنسفورمر
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
      prev.map((item) => (item.externalId === uniqId ? { ...item, x, y, sceneId: scn.id } : item))
    );
    sendOperation("source", {
      action: "move",
      id: uniqId,
      payload: { x, y },
    });
  });

  transformer.on("transformend", (e) => {
    // برای متن، اسکیل را به اندازه فونت تبدیل نکن؛ همان scale به‌همراه گروه کافیست
    const rotationNow = Math.round(group.rotation());
    const x = group.x();
    const y = group.y();

    setSources((prev) =>
      prev.map((item) =>
        item.externalId === uniqId
          ? {
              ...item,
              x,
              y,
              rotation: rotationNow,
              sceneId: scn.id,
            }
          : item
      )
    );

    sendOperation("source", {
      action: "resize",
      id: uniqId,
      payload: {
        x,
        y,
        // برای سازگاری، ابعاد ظاهری را هم بفرستیم (عرض/ارتفاع محتوای متن در اسکیل فعلی)
        width: textNode.width() * group.scaleX(),
        height: textNode.height() * group.scaleY(),
        rotation: rotationNow,
      },
    });
  });

  // دابل کلیک = ویرایش سریع متن/سایز/رنگ/تراز
  group.on("dblclick dbltap", async () => {
    const { isConfirmed, value } = await openTextEditorModal({
      initial: {
        text: textNode.text(),
        fontSize: textNode.fontSize(),
        fill: textNode.fill(),
        align: textNode.align(),
      },
    });
    if (!isConfirmed) return;

    textNode.text(value.text);
    textNode.fontSize(coerceNumber(value.fontSize, textNode.fontSize()));
    textNode.fill(value.fill);
    textNode.align(value.align);
    syncBGNormal();
    selectedSceneLayer.batchDraw();

    // sync state + server
    sendOperation("source", {
      action: "update",
      id: uniqId,
      payload: {
        content: value.text,
        fontSize: textNode.fontSize(),
        fill: textNode.fill(),
        align: textNode.align(),
      },
    });
    setSources((prev) =>
      prev.map((item) =>
        item.externalId === uniqId
          ? {
              ...item,
              text: value.text,
              fontSize: textNode.fontSize(),
              fill: textNode.fill(),
              align: textNode.align(),
            }
          : item
      )
    );
  });

  // --- راست‌کلیک = منو با گزینه‌های زیرنویس ---
  group.on("contextmenu", async (evt) => {
    evt.evt.preventDefault();
    evt.evt.preventDefault();
    const layer = group.getLayer();
    const tn = group.findOne(".marqueeInner Text") || group.findOne("Text");
    if (!layer || !tn) return;
    showTextContextMenu({ group, textNode: tn, layer, setSources, sendOperation });
    const isMarquee = !!group.getAttr("_marquee");
    const cfg = group.getAttr("_marqueeCfg") || {
      width: 400,
      height: 50,
      speed: 80,
      dir: "rtl",
      bg: "#000000",
    };

    const res = await Swal.fire({
      title: "عملیات متن",
      showCancelButton: true,
      cancelButtonColor: "red",
      cancelButtonText: "بستن",
      showDenyButton: true,
      denyButtonColor: isMarquee ? "#ef4444" : "black",
      denyButtonText: isMarquee ? "خاموش‌کردن زیرنویس" : "روشن‌کردن زیرنویس",
      confirmButtonColor: "black",
      confirmButtonText: "تنظیمات زیرنویس",
      footer: `
      <button id="btn-edit" class="swal2-confirm swal2-styled" style="background:#2563eb;margin-top:6px">
        ویرایش متن/استایل
      </button>
      <button id="btn-del" class="swal2-confirm swal2-styled" style="background:#ef4444;margin-top:6px">
        حذف
      </button>
    `,
      didOpen: () => {
        // دکمه حذف
        const btnDel = document.getElementById("btn-del");
        if (btnDel) {
          btnDel.addEventListener("click", async () => {
            Swal.close();
            group.destroy();
            selectedSceneLayer.draw();
            setSources((prev) => prev.filter((s) => s.externalId !== uniqId));
            sendOperation("source", { action: "remove", id: uniqId, payload: {} });
          });
        }
        // دکمه ویرایش متن/استایل
        const btnEdit = document.getElementById("btn-edit");
        if (btnEdit) {
          btnEdit.addEventListener("click", async () => {
            Swal.close();
            const { isConfirmed: ok, value } = await openTextEditorModal({
              initial: {
                text: textNode.text(),
                fontSize: textNode.fontSize(),
                fill: textNode.fill(),
                align: textNode.align(),
              },
            });
            if (!ok) return;
            textNode.text(value.text);
            textNode.fontSize(coerceNumber(value.fontSize, textNode.fontSize()));
            textNode.fill(value.fill);
            textNode.align(value.align);

            if (group.getAttr("_marquee")) {
              // اگر زیرنویس فعاله، اندازهٔ متن عوض شده؛ لازم است inner را ریست کنیم
              const cfgNow = group.getAttr("_marqueeCfg") || cfg;
              startMarquee(group, textNode, cfgNow);
            } else {
              syncBGNormal();
            }

            selectedSceneLayer.batchDraw();

            sendOperation("source", {
              action: "update",
              id: uniqId,
              payload: {
                content: value.text,
                fontSize: textNode.fontSize(),
                fill: textNode.fill(),
                align: textNode.align(),
              },
            });
            setSources((prev) =>
              prev.map((item) =>
                item.externalId === uniqId
                  ? {
                      ...item,
                      text: value.text,
                      fontSize: textNode.fontSize(),
                      fill: textNode.fill(),
                      align: textNode.align(),
                    }
                  : item
              )
            );
          });
        }
      },
    });

    if (res.isDenied) {
      // toggle marquee
      if (isMarquee) {
        stopMarquee(group);
        syncBGNormal();
      } else {
        // اگر قبلاً تنظیمات ذخیره شده، با همان برو
        startMarquee(group, textNode, cfg);
      }
      selectedSceneLayer.draw();
      return;
    }

    if (res.isConfirmed) {
      // تنظیمات زیرنویس
      const { isConfirmed: ok, value: cfgNew } = await openMarqueeSettingsModal({ initial: cfg });
      if (!ok) return;

      // شروع/بروزرسانی زیرنویس با تنظیمات جدید
      startMarquee(group, textNode, cfgNew);

      // (اختیاری) ارسال به سرور برای ثبت تنظیمات
      sendOperation("source", {
        action: "update",
        id: uniqId,
        payload: {
          marquee: {
            enabled: true,
            ...cfgNew,
          },
        },
      });
    }
  });

  // ثبت در state
  setSources((prev) => [
    ...prev,
    {
      ...textItem,
      type: "TEXT",
      externalId: uniqId,
      sceneId: scn.id,
      x: targetX,
      y: targetY,
      text: initialText,
      fontSize: initialSize,
      fill: initialFill,
      align: initialAlign,
    },
  ]);

  selectedSceneLayer.draw();
};
