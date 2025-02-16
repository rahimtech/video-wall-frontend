import { Button, Tooltip } from "@nextui-org/react";

import { MdCollectionsBookmark } from "react-icons/md";
import { BsDatabaseFill, BsDatabaseFillAdd } from "react-icons/bs";
import { RiPagesFill } from "react-icons/ri";
import { useMyContext } from "../../../context/MyContext";

export const IconMenuSidebar = ({ modals, openModal }) => {
  const { darkMode } = useMyContext();

  return (
    <div className="absolute left-[10px] flex flex-col gap-2 top-[50px] z-[100] h-fit">
      <Tooltip showArrow={true} placement="right-start" content="منابع">
        <Button
          className={`${darkMode ? "dark" : "light"} min-w-[35px]  p-1`}
          size="sm"
          variant="solid"
          color="default"
          onPress={() => openModal("resources")}
        >
          <BsDatabaseFill size={17} />
        </Button>
      </Tooltip>
      <Tooltip showArrow={true} placement="right-start" content="صحنه‌ها">
        <Button
          className={`${darkMode ? "dark" : "light"} min-w-[35px]  p-1`}
          size="sm"
          variant="solid"
          color="default"
          onPress={() => openModal("scenes")}
        >
          <RiPagesFill size={17} />
        </Button>
      </Tooltip>
      <Tooltip showArrow={true} placement="right-start" content="برنامه پخش">
        <Button
          className={`${darkMode ? "dark" : "light"} min-w-[35px]  p-1`}
          size="sm"
          variant="solid"
          color="default"
          onPress={() => openModal("collections")}
        >
          <MdCollectionsBookmark size={17} />
        </Button>
      </Tooltip>
      <Tooltip showArrow={true} placement="right-start" content="ورودی و فایل‌های استفاده شده">
        <Button
          className={`${darkMode ? "dark" : "light"} min-w-[35px]  p-1`}
          size="sm"
          variant="solid"
          color="default"
          onPress={() => openModal("UsageSidebar")}
        >
          <BsDatabaseFillAdd size={17} />
        </Button>
      </Tooltip>
    </div>
  );
};
