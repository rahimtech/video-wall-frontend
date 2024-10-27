import React, { useEffect } from "react";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
  Button,
  User,
  Switch,
  VisuallyHidden,
  useSwitch,
} from "@nextui-org/react";
import { MoonIcon } from "../MoonIcon";
import { SunIcon } from "../SunIcon";

export default function Setting() {
  return (
    <Dropdown
      radius="sm"
      classNames={{
        base: "before:bg-default-200", // change arrow background
        content: "p-0 border-small border-divider bg-background",
      }}
    >
      <DropdownTrigger>
        <Button
          className="light !p-0 min-w-0 w-[35px] bg-white h-[35px] mx-2"
          startContent={
            <span className="">
              <svg
                width={25}
                height={25}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                  <path
                    d="M15.5699 18.5001V14.6001"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                  <path
                    d="M15.5699 7.45V5.5"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                  <path
                    d="M15.57 12.65C17.0059 12.65 18.17 11.4859 18.17 10.05C18.17 8.61401 17.0059 7.44995 15.57 7.44995C14.134 7.44995 12.97 8.61401 12.97 10.05C12.97 11.4859 14.134 12.65 15.57 12.65Z"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                  <path
                    d="M8.43005 18.5V16.55"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                  <path
                    d="M8.43005 9.4V5.5"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                  <path
                    d="M8.42996 16.5501C9.8659 16.5501 11.03 15.386 11.03 13.9501C11.03 12.5142 9.8659 11.3501 8.42996 11.3501C6.99402 11.3501 5.82996 12.5142 5.82996 13.9501C5.82996 15.386 6.99402 16.5501 8.42996 16.5501Z"
                    stroke="#000000"
                    stroke-width="1.5"
                    stroke-miterlimit="10"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>{" "}
                </g>
              </svg>
            </span>
          }
          variant="solid"
          disableRipple
        ></Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Custom item styles"
        disabledKeys={["profile"]}
        className="p-3"
        itemClasses={{
          base: [
            "rounded-md",
            "text-default-900",
            "transition-opacity",
            "data-[hover=true]:text-foreground",
            "data-[hover=true]:bg-default-100",
            "dark:data-[hover=true]:bg-default-50",
            "data-[selectable=true]:focus:bg-default-50",
            "data-[pressed=true]:opacity-70",
            "data-[focus-visible=true]:ring-default-500",
          ],
        }}
      >
        <DropdownSection aria-label="Profile & Actions" showDivider>
          <DropdownItem isReadOnly key="profile" className="h-14 gap-2">
            <User
              name="Junior Garcia"
              description="@jrgarciadev"
              classNames={{
                name: "text-default-600",
                description: "text-default-500",
              }}
              avatarProps={{
                size: "sm",
                src: "https://avatars.githubusercontent.com/u/30373425?v=4",
              }}
            />
          </DropdownItem>
          <DropdownItem key="dashboard">Dashboard</DropdownItem>
          <DropdownItem key="settings">Settings</DropdownItem>
          <DropdownItem key="new_project">New Project</DropdownItem>
        </DropdownSection>

        <DropdownSection aria-label="Preferences" showDivider>
          <DropdownItem key="quick_search" shortcut="⌘K">
            Quick search
          </DropdownItem>
        </DropdownSection>

        <DropdownSection aria-label="Help & Feedback">
          <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
          <DropdownItem key="logout">Log Out</DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
