import React, { useState, useRef, useEffect } from "react";
import { Rect, Text, Transformer } from "react-konva";
import Swal from "sweetalert2";
// کامپوننت برای ویدیو
export const VideoComponent = () => {
  // اینجا ویدیو را قرار می‌دهیم و قابلیت درگ و دراپ، اسکیل و روتیت را اضافه می‌کنیم
  return <Rect width={100} height={100} fill="blue" draggable />;
};

// کامپوننت برای عکس
export const ImageComponent = () => {
  // اینجا تصویر را قرار می‌دهیم
  return <Rect width={100} height={100} fill="red" draggable />;
};

// کامپوننت برای متن
export const TextComponent = () => {
  const [text, setText] = useState("متن نمونه");
  return <Text text={text} draggable />;
};

// کامپوننت برای صفحه وب
export const WebComponent = ({ onAdd }) => {
  const [url, setUrl] = useState(null); // ذخیره لینک صفحه وب
  const shapeRef = useRef();
  const trRef = useRef();
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    // وقتی صفحه وب اضافه می‌شود، لینک آن را از کاربر بگیریم
    Swal.fire({
      title: "لینک صفحه وب را وارد کنید",
      input: "url",
      inputPlaceholder: "https://example.com",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "شما باید یک لینک وارد کنید!";
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setUrl(result.value); // لینک را ذخیره می‌کنیم
      } else {
        // اگر کاربر انصراف داد، تابع onAdd را صدا نمی‌کنیم
        onAdd(false);
      }
    });
  }, []);

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return url ? (
    <>
      <Rect
        ref={shapeRef}
        width={200}
        height={100}
        fill="green"
        draggable
        onClick={() => setIsSelected(!isSelected)}
        onTap={() => setIsSelected(!isSelected)}
      />
      <Transformer ref={trRef} />
      {/* لینک صفحه وب به صورت متنی زیر مستطیل نمایش داده می‌شود */}
      <Text text={url} x={10} y={110} fontSize={15} fill="black" />
    </>
  ) : null;
};
