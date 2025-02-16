import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
  useDraggable,
} from "@nextui-org/react";

export const LayoutDropdownArrMonitor = () => {
  return (
    <div className="relative left-0 top-[200px] z-[100]">
      <Dropdown>
        <DropdownTrigger>
          <Button size="sm" fullWidth variant="solid" color="primary">
            چیدمان مانیتورها
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="تنظیم چیدمان"
          color="secondary"
          onAction={(key) => {
            const [rows, cols] = key.split("x").map(Number);
            arrangeMonitors(rows, cols);
          }}
        >
          <DropdownItem key="2x2">۲×۲</DropdownItem>
          <DropdownItem key="3x3">۳×۳</DropdownItem>
          <DropdownItem key="4x4">۴×۴</DropdownItem>
          <DropdownItem key="5x5">۵×۵</DropdownItem>
          <DropdownItem key="6x6">۶×۶</DropdownItem>
          <DropdownItem key="7x7">۷×۷</DropdownItem>
          <DropdownItem key="8x8">۸×۸</DropdownItem>
          <DropdownItem key="9x9">۹×۹</DropdownItem>
          <DropdownItem key="10x10">۱۰×۱۰</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export const MonitorLayoutModal = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [arrangedMonitors, setArrangedMonitors] = useState([]);
  const [selectedMonitors, setSelectedMonitors] = useState([]);

  const handleLayoutSelect = (key) => {
    const [rows, cols] = key.split("x").map(Number);
    arrangeMonitors(rows, cols);
    setSelectedLayout(key);
  };

  const arrangeMonitors = (rows, cols) => {
    let monitorIndex = 0;
    const gap = 10;
    const monitorWidth = videoWalls[0].width;
    const monitorHeight = videoWalls[0].height;

    const updatedMonitors = [];

    const newArrangedMonitors = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => {
        if (monitorIndex >= videoWalls.length) return null;

        const x = col * (monitorWidth + gap);
        const y = row * (monitorHeight + gap);

        const monitor = videoWalls[monitorIndex];

        updatedMonitors.push({
          monitorId: monitor.id,
          position: { x, y },
        });

        monitorIndex++;
        return {
          ...monitor,
          position: { x, y },
        };
      })
    );

    setArrangedMonitors(newArrangedMonitors);
  };

  const handleMonitorSelect = (rowIndex, colIndex, selectedMonitor) => {
    const newArrangedMonitors = [...arrangedMonitors];
    newArrangedMonitors[rowIndex][colIndex] = selectedMonitor;
    setArrangedMonitors(newArrangedMonitors);

    // بروزرسانی selectedMonitors
    setSelectedMonitors((prevSelected) => [...prevSelected, selectedMonitor.id]);
  };

  const availableMonitors = (rowIndex, colIndex) => {
    // فیلتر کردن مانیتورهای قابل انتخاب (آنهایی که هنوز انتخاب نشده‌اند)
    return videoWalls.filter((wall) => !selectedMonitors.includes(wall.id));
  };

  const resetSelections = () => {
    setArrangedMonitors([]);
    setSelectedMonitors([]);
    setSelectedLayout(null);
  };

  return (
    <>
      <Button className="z-[1000]" onPress={onOpen}>
        چیدمان مانیتورها
      </Button>

      <Modal scrollBehavior="outside" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className="w-full">
          {(onClose) => (
            <>
              <ModalHeader>انتخاب چیدمان</ModalHeader>
              <ModalBody>
                <Dropdown>
                  <DropdownTrigger>
                    <Button size="sm" fullWidth variant="solid" color="primary">
                      چیدمان مانیتورها
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="تنظیم چیدمان"
                    color="secondary"
                    onAction={handleLayoutSelect}
                  >
                    <DropdownItem key="2x2">۲×۲</DropdownItem>
                    <DropdownItem key="3x3">۳×۳</DropdownItem>
                    <DropdownItem key="4x4">۴×۴</DropdownItem>
                    <DropdownItem key="5x5">۵×۵</DropdownItem>
                    <DropdownItem key="6x6">۶×۶</DropdownItem>
                    <DropdownItem key="7x7">۷×۷</DropdownItem>
                    <DropdownItem key="8x8">۸×۸</DropdownItem>
                    <DropdownItem key="9x9">۹×۹</DropdownItem>
                    <DropdownItem key="10x10">۱۰×۱۰</DropdownItem>
                  </DropdownMenu>
                </Dropdown>

                {selectedLayout && (
                  <div className="monitor-layout">
                    <h3>چیدمان {selectedLayout}</h3>
                    <div
                      className="grid-layout"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${selectedLayout.split("x")[1]}, 1fr)`,
                        gap: "10px",
                        width: "100%", // استفاده از 100% عرض برای سازگاری
                      }}
                    >
                      {arrangedMonitors.map((row, rowIndex) => (
                        <div
                          key={rowIndex}
                          className="row"
                          style={{ display: "flex", flexDirection: "row" }}
                        >
                          {row.map((monitor, colIndex) => (
                            <div
                              key={colIndex}
                              className="monitor-box"
                              style={{
                                width: "100%",
                                height: "100px",
                                border: "1px solid #ccc",
                                padding: "10px",
                              }}
                            >
                              <p>{monitor ? monitor.name : "خالی"}</p>
                              <Dropdown>
                                <DropdownTrigger>
                                  <Button size="sm" variant="solid">
                                    انتخاب مانیتور
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu>
                                  {availableMonitors(rowIndex, colIndex).map((wall) => (
                                    <DropdownItem
                                      key={wall.id}
                                      onPress={() => handleMonitorSelect(rowIndex, colIndex, wall)}
                                    >
                                      {wall.name}
                                    </DropdownItem>
                                  ))}
                                </DropdownMenu>
                              </Dropdown>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  color="danger"
                  variant="outline"
                  onPress={resetSelections}
                  style={{ marginTop: "20px" }}
                >
                  ریست کردن انتخاب‌ها
                </Button>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  بستن
                </Button>
                <Button color="primary" onPress={onClose}>
                  ذخیره
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export const MonitorPositionEditor = ({ monitors, updateMonitorPosition }) => {
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const targetRef = React.useRef(null);
  const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });

  const openModal = (monitor) => {
    setSelectedMonitor(monitor);
    setX(monitor.x);
    setY(monitor.y);
    onOpen();
  };

  const handleUpdatePosition = () => {
    if (selectedMonitor) {
      updateMonitorPosition(selectedMonitor.id, x, y);
      setSelectedMonitor(null);
      onClose();
    }
  };

  return (
    <div className="relative left-0 top-[200px] z-[100] h-[200px] overflow-y-scroll">
      <div className="flex flex-col  gap-2 bg-gray-700 rounded  overflow-scroll">
        {monitors.map((monitor) => (
          // <Tooltip content={`تغییر مانیتور ${monitor.name}`} key={monitor.id}>
          <Button size="sm" color="primary" onPress={() => openModal(monitor)} className="m-1">
            مانیتور {monitor.id}
          </Button>
          // </Tooltip>
        ))}
      </div>

      <Modal ref={targetRef} isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader {...moveProps} className="flex flex-col gap-1">
                تنظیم موقعیت مانیتور
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <Input
                    type="number"
                    label="مقدار X"
                    value={x}
                    onChange={(e) => setX(Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    label="مقدار Y"
                    value={y}
                    onChange={(e) => setY(Number(e.target.value))}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  بستن
                </Button>
                <Button color="primary" onPress={handleUpdatePosition}>
                  تنظیم
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export const updateMonitorPosition = (id, newX, newY) => {
  let hasCollision = false;

  const updatedVideoWalls = videoWalls.map((monitor) => {
    if (monitor.id === id) {
      const targetRect = { x: newX, y: newY, width: monitor.width, height: monitor.height };

      videoWalls.forEach((otherMonitor) => {
        if (otherMonitor.id === id) return;

        const otherRect = {
          x: otherMonitor.x,
          y: otherMonitor.y,
          width: otherMonitor.width,
          height: otherMonitor.height,
        };

        if (
          !(
            targetRect.x + targetRect.width <= otherRect.x ||
            targetRect.x >= otherRect.x + otherRect.width ||
            targetRect.y + targetRect.height <= otherRect.y ||
            targetRect.y >= otherRect.y + otherRect.height
          )
        ) {
          hasCollision = true;
        }
      });

      if (hasCollision) return monitor;

      updateKonvaMonitorPosition(getSelectedScene()?.layer, id, newX, newY);

      return { ...monitor, x: newX, y: newY };
    }
    return monitor;
  });

  if (hasCollision) {
    Swal.fire({
      title: "خطا",
      text: "موقعیت جدید باعث برخورد مانیتورها می‌شود.",
      icon: "error",
      confirmButtonText: "باشه",
    });
  } else {
    arrangeMForScenes(updatedVideoWalls);
    setVideoWalls(updatedVideoWalls); // به‌روزرسانی state اگر برخوردی وجود نداشت
  }
};

export const updateKonvaMonitorPosition = (layer, id, newX, newY) => {
  const monitorGroup = layer.findOne(`#monitor-group-${id}`);
  if (monitorGroup) {
    monitorGroup.position({ x: newX, y: newY });

    const text = monitorGroup.findOne(".monitorText");
    if (text) {
      text.text(`Monitor ${id}\nX: ${newX}, Y: ${newY}`);
    }

    layer.draw();
  }
};
