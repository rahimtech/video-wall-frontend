import React, { useEffect } from "react";
import { Button } from "@nextui-org/react";
import { BsMoon, BsSun } from "react-icons/bs";

export default function SwitchCustom({ setDarkMode, darkMode }) {
  return (
    <Button
      size="sm"
      className={` min-w-fit px-2 shadow-md  cursor-pointer `}
      variant="solid"
      color={darkMode ? "default" : "primary"}
      onPress={() => {
        localStorage.setItem("darkMode", !darkMode);
        setDarkMode(!darkMode);
      }}
    >
      {darkMode ? <BsMoon size={16} /> : <BsSun size={16} />}
    </Button>
  );
}
