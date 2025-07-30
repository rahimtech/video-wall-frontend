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
import React, { useRef, useState } from "react";
import { useMyContext } from "../../../../../context/MyContext";
import { getConfigMosaic } from "../../../../../api/configuremosaic";
import api from "../../../../../api/api";

const generateLayoutOptions = (total) => {
  const options = [];
  for (let rows = 1; rows <= total; rows++) {
    for (let cols = 1; cols <= total; cols++) {
      if (rows * cols <= total) {
        options.push(`${rows}x${cols}`);
      }
    }
  }
  return options;
};

export const LayoutDropdownArrMonitor = () => {
  const { videoWalls } = useMyContext();
  const totalMonitors = videoWalls.length;

  const layoutOptions = generateLayoutOptions(totalMonitors);

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
          {layoutOptions.map((layout) => (
            <DropdownItem key={layout}>{layout}</DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export const MonitorLayoutModal = () => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [arrangedMonitors, setArrangedMonitors] = useState([]);
  const [selectedMonitors, setSelectedMonitors] = useState([]);

  const { videoWalls } = useMyContext();

  const handleLayoutSelect = (key) => {
    const [rows, cols] = key.split("x").map(Number);
    arrangeMonitors(rows, cols);
    setSelectedLayout(key);
  };

  const generateLayoutString = () => {
    if (!selectedLayout || arrangedMonitors.length === 0) return "";

    const [rows, cols] = selectedLayout.split("x").map(Number);
    const monitor = arrangedMonitors[0][0];

    const res = `${monitor.width},${monitor.height},60.000`;

    let out = "";
    let gridPos = "";

    arrangedMonitors.forEach((row, rowIndex) => {
      row.forEach((monitor, colIndex) => {
        if (monitor) {
          gridPos += ` gridPos=${colIndex},${rowIndex}`;
          out += ` out=${monitor.position.x},${monitor.position.y}`;
        }
      });
    });

    const result = `rows=${rows} cols=${cols} res=${res}${gridPos} ${out} rotate=0 overlapcol=0 overlaprow=0`;
    return result;
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
    const newArrangedMonitors = arrangedMonitors.map((row) =>
      row.map((cell) => (cell?.id === selectedMonitor.id ? null : cell))
    );

    newArrangedMonitors[rowIndex][colIndex] = {
      ...selectedMonitor,
      position: {
        x: colIndex * (selectedMonitor.width + 10),
        y: rowIndex * (selectedMonitor.height + 10),
      },
    };

    setArrangedMonitors(newArrangedMonitors);

    const allSelectedIds = newArrangedMonitors
      .flat()
      .filter(Boolean)
      .map((m) => m.id);
    setSelectedMonitors(allSelectedIds);
  };

  const { url } = useMyContext();
  const sendDataToServer = () => {
    api.getConfigMosaic(url).then((data) => console.log(data));
    generateLayoutString();
    onClose();
  };

  const availableMonitors = () => videoWalls;

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

      <Modal
        className="min-w-full  min-h-screen !border-none"
        classNames={{
          wrapper: "z-[1000] !border-none",
          body: "!border-none",
        }}
        scrollBehavior="inside"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
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
                    {generateLayoutOptions(videoWalls.length).map((layout) => (
                      <DropdownItem key={layout}>{layout}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>

                {selectedLayout && (
                  <div
                    className="monitor-layout"
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${selectedLayout.split("x")[1]}, 1fr)`,
                      gridTemplateRows: `repeat(${selectedLayout.split("x")[0]}, 1fr)`,
                      gap: "10px",
                      width: "100%",
                    }}
                  >
                    {arrangedMonitors.map((row, rowIndex) =>
                      row.map((monitor, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className="monitor-box"
                          style={{
                            width: "100%",
                            height: "100px",
                            border: "1px solid #ccc",
                            padding: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <p>{monitor ? monitor.name || "خالی" : "خالی"}</p>

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
                      ))
                    )}
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
                <Button color="primary" onPress={sendDataToServer}>
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
    setVideoWalls(updatedVideoWalls);
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
