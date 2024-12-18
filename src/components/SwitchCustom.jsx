"use client";

import React, { useEffect } from "react";
import { Switch, VisuallyHidden, useSwitch } from "@nextui-org/react";
import { MoonIcon } from "./MoonIcon";
import { SunIcon } from "./SunIcon";

const ThemeSwitch = (props) => {
  const { Component, slots, isSelected, getBaseProps, getInputProps, getWrapperProps } =
    useSwitch(props);

  useEffect(() => {
    props.setDarkMode(!isSelected);
  }, [isSelected]);

  return (
    <div className="flex flex-col gap-2">
      <Component {...getBaseProps()}>
        <VisuallyHidden>
          <input {...getInputProps()} />
        </VisuallyHidden>
        <div
          {...getWrapperProps()}
          className={slots.wrapper({
            class: ["w-8 h-8 dark", "flex items-center justify-center", "rounded-lg  "],
          })}
        >
          {isSelected ? <SunIcon /> : <MoonIcon />}
        </div>
      </Component>
    </div>
  );
};

export default function SwitchCustom({ setDarkMode, darkMode }) {
  return <ThemeSwitch setDarkMode={setDarkMode} />;
}
