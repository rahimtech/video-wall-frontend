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
      <div style="text-align:right;">
        <div style="display:flex; flex-direction:column; gap:8px">
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
        <div style="display:flex; flex-direction: column; gap:8px">
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
          <input id="mq-bg" class="swal2-input" type="color" value="${initial.bg ?? "#ffffff"}">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonColor: "green",
    confirmButtonText: "اعمال",
    cancelButtonColor: "red",
    cancelButtonText: "انصراف",
    focusConfirm: false,
    preConfirm: (e) => {
      const w = Number(document.getElementById("mq-w").value);
      const h = Number(document.getElementById("mq-h").value);
      const speed = Number(document.getElementById("mq-speed").value);
      const dir = document.getElementById("mq-dir").value || "rtl";
      const bg = document.getElementById("mq-bg").value || "#ffffff";
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

// helper — امن آپدیت کردن متن از مقدار ورودی modal
async function applyTextEdit({ group, textNode, layer, value }) {
  // مقدار ورودی را نرمال کن (اختیاری — اگر می‌خوای \n حذف بشه)
  const { normalized } = normalizeForMarquee(value.text || "");
  const newText = normalized;

  // ۱) اعمال متن و استایل‌ها
  textNode.text(newText);
  textNode.fontSize(coerceNumber(value.fontSize, textNode.fontSize()));
  textNode.fill(value.fill);
  textNode.align(value.align);
  textNode.direction(value.dir);

  // ۲) اگر node کش‌شده بود، کش را پاک کن تا متن جدید رندر شود
  // (اگر از cache استفاده نشده هم safe است)
  if (typeof textNode.clearCache === "function") {
    try {
      textNode.clearCache();
    } catch (e) {
      /* ignore */
    }
  }

  // ۳) اگر گروهِ مارکوئی فعال است، فونت/متن تغییر کرده — باید marquee را ری‌استارت کنیم
  const isMarquee = !!group.getAttr("_marquee");
  if (isMarquee) {
    // نگه‌داری cfg فعلی یا محاسبه از متن
    const cfgNow = group.getAttr("_marqueeCfg") ||
      computeMarqueeCfgFromText(group, textNode) || {
        width: 400,
        height: 50,
        speed: 80,
        dir: "rtl",
        bg: "#000000",
      };

    // مهم: بعضی اوقات textNode هنوز parent صحیح نیست — صبر کوتاه و سپس ری‌استارت امن
    // stopMarquee و سپس startMarquee با متن جدید
    stopMarquee(group);

    // کمی تاخیر کوچک برای جلوگیری از race (معمولاً لازم نیست، اما ایمن‌تر است)
    setTimeout(() => {
      startMarquee(group, textNode, cfgNow);
      // redraw layer
      layer && layer.batchDraw();
    }, 8);
  } else {
    // ۴) اگر مارکوئی خاموشه: ممکنه اندازهٔ پس‌زمینه/باکس نیاز به آپدیت داشته باشه
    // فرض می‌کنیم syncBGNormal در scope بالاتر موجوده؛ اگر نه، سینک کوچک انجام بده:
    const bgRect = group.findOne(".marqueeBG") || group.findOne("Rect");
    if (bgRect) {
      bgRect.width(textNode.width());
      bgRect.height(textNode.height());
    } else {
      // اگر بک‌رکت جداست که syncBGNormal باید آن را هندل کند
      // یا در نبود bg فقط چی میخوای انجام بدی
    }
    // و در پایان redraw
    layer && layer.batchDraw();
  }

  // ۵) در نهایت کلاینت را هماهنگ کن (اگر لازم است sendOperation و setSources را صدا بزن)
  // این بخش را آنجا که در کدت sendOperation می‌زنی اضافه کن؛ مثال:
  // sendOperation("source", { action: "update", id: uniqId, payload: { content: newText, metadata: { style: ... } }});
}

async function showTextContextMenu({ group, textNode, layer, setSources, sendOperation }) {
  const isMarquee = !!group.getAttr("_marquee");
  const cfg = group.getAttr("_marqueeCfg") || {
    width: 400,
    height: 50,
    speed: 80,
    dir: "rtl",
    bg: "#ffffff",
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

      // جایگزین listener دکمه ویرایش در didOpen
      const btnEdit = document.getElementById("btn-edit");
      if (btnEdit) {
        btnEdit.addEventListener("click", async () => {
          Swal.close();

          // وضعیت فعلی مارکوئی را نگه دار
          const wasMarquee = !!group.getAttr("_marquee");
          const prevCfg = group.getAttr("_marqueeCfg") || null;

          // اگر مارکوئی فعال است، آن را متوقف کن تا ویرایش پایدار باشد
          if (wasMarquee) {
            try {
              stopMarquee(group);
            } catch (e) {
              console.warn("stopMarquee error:", e);
            }
            // رندر سریع تا UI ثابت شود
            layer && layer.batchDraw();
          }

          // پیدا کردن نود متنی موجود (بعد از stopMarquee متن باید در group باشد)
          let currentTextNode = group.findOne("Text") || group.findOne(".marqueeInner Text");
          if (!currentTextNode) {
            // اگر متن پیدا نشد، یک بار تلاش کن با inner
            currentTextNode = group.findOne(".marqueeInner Text");
          }
          if (!currentTextNode) {
            console.warn("No text node to edit");
            // در صورت نیاز مارکوئی را دوباره فعال کن
            if (wasMarquee && prevCfg)
              startMarquee(group, group.findOne("Text") || currentTextNode, prevCfg);
            return;
          }

          // باز کردن modal با مقادیر فعلی (امن)
          const { isConfirmed: ok, value } = await openTextEditorModal({
            initial: {
              text: currentTextNode.text(),
              fontSize: currentTextNode.fontSize(),
              fill: currentTextNode.fill(),
              align: currentTextNode.align(),
              dir: currentTextNode.direction ? currentTextNode.direction() : "rtl",
            },
          });

          if (!ok) {
            // اگر کاربر انصراف داد، اگر قبلاً مارکوئی بود آن را برگردان
            if (wasMarquee && prevCfg) {
              // کمی تاخیر کوتاه برای جلوگیری از race
              setTimeout(() => {
                startMarquee(group, group.findOne("Text") || currentTextNode, prevCfg);
                layer && layer.batchDraw();
              }, 8);
            }
            return;
          }

          // اعمال تغییرات امن روی text node
          try {
            const newText = value.text ?? "";
            currentTextNode.text(newText);
            currentTextNode.fontSize(coerceNumber(value.fontSize, currentTextNode.fontSize()));
            currentTextNode.fill(value.fill);
            currentTextNode.align(value.align);
            if (typeof currentTextNode.direction === "function") {
              currentTextNode.direction(value.dir);
            }

            // پاک کردن cache در صورت وجود
            if (typeof currentTextNode.clearCache === "function") {
              try {
                currentTextNode.clearCache();
              } catch (e) {
                /* ignore */
              }
            }

            // اگر نیاز به همگام‌سازی پس‌زمینه/باکس داری، اینجا انجام بده
            const bg = group.findOne(".marqueeBG") || group.findOne("Rect");
            if (bg) {
              // اگر مارکوئی خاموش است، اندازهٔ bg را به متن جدید بچسبان
              bg.width(currentTextNode.width());
              bg.height(currentTextNode.height());
            }

            // رندر تغییرات سریع
            layer && layer.batchDraw();

            // اگر قبلاً مارکوئی روشن بوده — آن را با cfg قبلی دوباره فعال کن
            if (wasMarquee && prevCfg) {
              // delay خیلی کوتاه تا همه چیز پایدار باشه
              setTimeout(() => {
                startMarquee(group, currentTextNode, prevCfg);
                layer && layer.batchDraw();
              }, 8);
            }

            // ارسال آپدیت به سرور / state
            const uniqId = group.id();
            sendOperation("source", {
              action: "update",
              id: uniqId,
              payload: {
                content: newText,
                metadata: {
                  style: {
                    color: currentTextNode.fill(),
                    fontSize: currentTextNode.fontSize(),
                    dir: value.dir,
                    align: value.align,
                  },
                },
              },
            });
            // همچنین بروز رسانی local state (setSources) در صورت نیاز
          } catch (err) {
            console.error("apply edit error:", err);
          }
        });
      }
    },
  });

  if (res.isDenied) {
    if (isMarquee) {
      stopMarquee(group);
      const { x, y } = group.position();
      sendOperation("source", {
        action: "update",
        id: uniqId,
        payload: {
          x,
          y,
          metadata: {
            bgColor: "transparent",
            marquee: { enabled: false },
          },
          width: "fit-content",
          height: "auto",
        },
      });
      // syncBGNormal();
    } else {
      startMarquee(group, textNode, cfg);
      const cfgOn = group.getAttr("_marqueeCfg") || computeMarqueeCfgFromText(group, textNode);
      group.setAttr("_marqueeCfg", cfgOn);
      startMarquee(group, textNode, cfgOn);
      const { x, y } = group.position();
      sendOperation("source", {
        action: "update",
        id: uniqId,
        payload: {
          x,
          y,
          metadata: {
            bgColor: cfgOn.bg,
            marquee: { enabled: true },
          },
          width: cfgOn.width,
          height: cfgOn.height,
        },
      });
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
      payload: {
        width: cfgNew.width,
        height: cfgNew.height,
        metadata: {
          bgColor: cfgNew.bg,
          marquee: { enabled: true, dir: cfgNew.dir, speed: cfgNew.speed },
        },
      },
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
         <div style="margin-top:8px">
          <label>راستچین/چپ‌چین:</label>
          <select id="txt-dir" class="swal2-select">
            <option value="rtl" >rtl</option>
            <option value="ltr" >ltr</option>
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
      const dir = document.getElementById("txt-dir").value || "rtl";
      return { text, fontSize, fill, align, dir };
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

function normalizeForMarquee(raw) {
  if (typeof raw !== "string") return { normalized: raw, changed: false };
  // \r و \n و فاصله‌های تکراری را تبدیل به یک فاصله کن
  const normalized = raw
    .replace(/[\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { normalized, changed: normalized !== raw };
}

function bindSelectionRelay(group, ...nodes) {
  nodes.forEach((n) => {
    if (!n) return;

    n.listening(true); // قابل کلیک/درگ
    n.off(".marquee"); // جلوگیری از دوبل‌بایند

    // شروع درگ از روی هر بخش باکس
    n.on("mousedown.marquee touchstart.marquee", (e) => {
      e.cancelBubble = true;

      // مطمئن شو گروه درگ‌ابل شده
      group.draggable(true);

      // همون لحظه ترنسفورمر وصل بشه (مثل کلیک روی خود گروه)
      group.fire("click", { evt: e.evt });

      // درگ را از خود گروه شروع کن
      group.startDrag();
    });

    // برای انتخاب بدون درگ (مثلاً فقط سِلکت کردن)
    n.on("click.marquee tap.marquee", (e) => {
      e.cancelBubble = true;
      group.fire("click", { evt: e.evt });
    });
  });
}

function startMarquee(group, textNode, cfg) {
  console.log("group::: ", group);
  // تمیزکاری وضعیت قبلی
  stopMarquee(group);

  const layer = group.getLayer();
  if (!layer || !textNode) return;

  // نرمال‌سازی کانفیگ
  const width = Number.isFinite(cfg?.width) ? cfg.width : 400;
  const height = Number.isFinite(cfg?.height) ? cfg.height : 50;
  const speed = Number.isFinite(cfg?.speed) ? cfg.speed : 80;
  const dir = cfg?.dir === "ltr" ? "ltr" : "rtl";
  const bgCol = cfg?.bg || "#000000";

  // --- ذخیره‌ی وضعیت قبلِ مارکوئی ---
  const hadExplicitWidth = textNode.getAttr("width") != null;
  const prevWrap = typeof textNode.wrap === "function" ? textNode.wrap() : "word";
  const prevText = textNode.text();

  group.setAttr("_textPrev", {
    x: textNode.x(),
    y: textNode.y(),
    wrap: prevWrap,
    hadExplicitWidth,
    width: hadExplicitWidth ? textNode.width() : null,
    rawText: prevText, // برای بازگردانی بعد از stop
  });

  // --- یک‌خطی‌سازی متن (حذف \n) + nowrap ---
  const { normalized, changed } = normalizeForMarquee(prevText);
  if (changed) textNode.text(normalized);

  if (typeof textNode.wrap === "function") textNode.wrap("none"); // معادل white-space:nowrap
  if (typeof textNode.ellipsis === "function") textNode.ellipsis(false);

  // اگر قبلاً width صریح داشت، برای اندازه‌ی واقعی متن در مارکوئی موقتاً بردار
  if (hadExplicitWidth) textNode.setAttr("width", undefined);

  // --- viewport با کلیپ ---
  let viewport = group.findOne(".marqueeViewport");
  if (!viewport) {
    viewport = new Konva.Group({
      name: "marqueeViewport",
      clip: { x: 0, y: 0, width, height },
      listening: false,
    });
    group.add(viewport);
  } else {
    viewport.clip({ x: 0, y: 0, width, height });
  }

  // --- پس‌زمینه ---
  let bg = group.findOne(".marqueeBG");
  if (!bg) {
    bg = new Konva.Rect({
      name: "marqueeBG",
      x: 0,
      y: 0,
      width,
      height,
      fill: hexToRgba(bgCol, 1),
      stroke: "white",
      strokeWidth: 1,
      listening: true,
    });
    group.add(bg);
    bg.moveToBottom();
  } else {
    bg.width(width);
    bg.height(height);
    bg.fill(hexToRgba(bgCol, 1));
  }

  // --- گروه داخلی متحرک ---
  let inner = viewport.findOne(".marqueeInner");
  if (!inner) {
    inner = new Konva.Group({ name: "marqueeInner", listening: false });
    viewport.add(inner);
  } else {
    inner.removeChildren();
  }

  // انتقال متن به inner و هم‌ترازی عمودی
  inner.add(textNode);
  textNode.y((height - textNode.height()) / 2);

  // نقطه شروع
  if (dir === "rtl") {
    inner.x(width);
  } else {
    inner.x(-textNode.width());
  }
  inner.y(0);

  // --- انیمیشن ---
  const anim = new Konva.Animation((frame) => {
    const dt = (frame?.timeDiff ?? 16) / 1000;
    const step = speed * dt;

    if (dir === "rtl") {
      inner.x(inner.x() - step);
      if (inner.x() + textNode.width() < 0) inner.x(width);
    } else {
      inner.x(inner.x() + step);
      if (inner.x() > width) inner.x(-textNode.width());
    }
  }, layer);
  anim.start();

  group.setAttr("_marqueeAnim", anim);
  group.setAttr("_marquee", true);
  group.setAttr("_marqueeCfg", { width, height, speed, dir, bg: bgCol });

  layer.batchDraw();
  bindSelectionRelay(group, bg, viewport, inner, textNode);
}

function stopMarquee(group) {
  if (!group) return;

  // توقف انیمیشن
  const anim = group.getAttr("_marqueeAnim");
  if (anim && anim.stop) anim.stop();

  // نودها
  const viewport = group.findOne(".marqueeViewport");
  const inner = viewport?.findOne(".marqueeInner");
  const bg = group.findOne(".marqueeBG");

  // متن را پیدا کن
  let textNode = inner?.findOne("Text") || group.findOne("Text");

  // برگرداندن متن به والد اصلی
  if (textNode && inner) {
    textNode.remove();
    group.add(textNode);
  }

  // بازگردانی وضعیت اولیه (wrap/width/x/y/متن)
  const prev = group.getAttr("_textPrev") || {};
  if (textNode) {
    // متن اصلی با \n برگردد
    if (typeof prev.rawText === "string") textNode.text(prev.rawText);

    // مختصات
    const px = Number.isFinite(prev.x) ? prev.x : 0;
    const py = Number.isFinite(prev.y) ? prev.y : 0;
    textNode.position({ x: px, y: py });

    // white-space: inherit  ⇠ همان wrap قبلی
    if (typeof textNode.wrap === "function") {
      textNode.wrap(prev.wrap ?? "word");
    }

    // width به حالت قبل
    if (prev.hadExplicitWidth) {
      textNode.width(prev.width);
    } else {
      textNode.setAttr("width", undefined);
    }
  }

  // تخریب UI مارکوئی
  if (bg) bg.destroy();
  if (viewport) viewport.destroy();

  // پاکسازی فلگ‌ها
  group.setAttr("_marqueeAnim", null);
  group.setAttr("_marquee", false);
  group.setAttr("_marqueeCfg", null);
  group.setAttr("_textPrev", null);

  // رندر
  const layer = group.getLayer();
  if (layer) layer.batchDraw();
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
  let initialText = "";
  if (textItem.type === "TEXT") {
    initialText = textItem.text ?? textItem.content ?? "متن جدید";
  } else if (textItem.type === "RSS") {
    initialText = textItem.metadata.rssContent ?? textItem.text ?? textItem.content ?? "متن جدید";
  }

  const initialFill = textItem.metadata.style.color ?? "#ffffff";
  const initialSize = coerceNumber(textItem.metadata.style.fontSize, 40);
  const initialAlign = textItem.metadata.style.align ?? "left";
  const rotation = textItem.rotation || 0;

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

  // --- ارسال به سرور (در حالت آنلاین) ---
  if (mode) {
    sendOperation("source", {
      action: "add",
      id: String(uniqId),
      payload: {
        type: textItem.type,
        name: textItem.name ?? textItem.type,
        x: targetX,
        y: targetY,
        width: textNode.width() ?? textItem.width ?? undefined,
        height: textNode.height() ?? textItem.height ?? undefined,
        rotation,
        sceneId: scn.id,
        mediaId: textItem.id,
        externalId: uniqId,
        content: initialText,
        z: 0,
        source: `${textItem.type.toLowerCase()}:${textItem.content}`,
        metadata: {
          rssContent: textItem.metadata.rssContent || [],
          bgColor: textItem.metadata?.bgColor ?? "#ffffff",
          style: {
            dir: textItem.metadata.style.dir || "rtl",
            fontFamily: textItem.metadata.style.fontFamily || "Vazirmatn, IRANSans, Arial",
            fontSize: textItem.metadata.style.fontSize || 20,
            color: textItem.metadata.style.color || "#000000",
          },
          marquee: {
            enabled: textItem.metadata.marquee.enabled || false,
            scrollDirection: textItem.metadata.marquee.scrollDirection || "rtl",
            speed: textItem.metadata?.marquee?.speed ?? 90,
          },
        },
      },
    });
  }

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

  if (textItem.metadata.marquee.enabled == true) {
    startMarquee(group, textNode, {
      bg: textItem.metadata?.bgColor ?? "#ffffff",
      dir: textItem.metadata.marquee.scrollDirection || "rtl",
      speed: textItem.metadata?.marquee?.speed ?? 90,
      width: textItem.width ?? 100,
      height: textItem.height ?? 50,
    });
  }

  const transformer = new Konva.Transformer({
    nodes: [group],
    enabledAnchors: [],
    rotateEnabled: true,
    keepRatio: true,
    id: String(uniqId),
  });
  transformer.flipEnabled(false);

  // const attachTransformerFor = () => {
  //   selectedSceneLayer.add(transformer);
  //   transformer.moveToTop();
  //   selectedSceneLayer.draw();
  // };

  group.on("click", () => {
    const marqueeOn = !!group.getAttr("_marquee");

    group.draggable(true);
    selectedSceneLayer.add(transformer);
    transformer.attachTo(group);
    selectedSceneLayer.draw();

    // attachTransformerFor();
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
    const nodes = transformer.nodes();
    const node = nodes && nodes[0] ? nodes[0] : group;

    const sx = group.scaleX();
    const sy = group.scaleY();

    const scale = Number.isFinite(sy) && sy > 0 ? sy : Number.isFinite(sx) && sx > 0 ? sx : 1;

    const prevFont = textNode.fontSize();
    const newFont = Math.max(8, Math.round(prevFont * scale)); // حداقل ۸؛ دلخواه

    textNode.fontSize(newFont);

    group.scale({ x: 1, y: 1 });
    group.rotation(e.target.attrs.rotation);

    const rotationNow = Math.round(group.rotation());
    const { x, y } = group.position();

    setSources((prev) =>
      prev.map((item) =>
        item.externalId === uniqId
          ? {
              ...item,
              x,
              y,
              rotation: rotationNow,
              metadata: { style: { fontSize: newFont } },
              sceneId: scn.id,
            }
          : item
      )
    );

    sendOperation("source", {
      action: "update",
      id: uniqId,
      payload: {
        x,
        y,
        rotation: rotationNow,
        width: textNode.width() * group.scaleX(),
        height: textNode.height() * group.scaleY(),
        metadata: {
          style: {
            fontSize: newFont,
          },
        },
      },
    });

    selectedSceneLayer.batchDraw();
  });

  // --- راست‌کلیک = منو با گزینه‌های زیرنویس ---
  group.on("contextmenu", async (evt) => {
    evt.evt.preventDefault();

    // جلوگیری حتمی از دنبال کردن موس
    group.stopDrag();
    group.draggable(false);

    const layer = group.getLayer();
    const tn = group.findOne(".marqueeInner Text") || group.findOne("Text");
    if (!layer || !tn) return;

    showTextContextMenu({ group, textNode: tn, layer, setSources, sendOperation });
  });

  // ثبت در state
  if (mode)
    setSources((prev) => [
      ...prev,
      {
        ...textItem,
        type: textItem.type,
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
