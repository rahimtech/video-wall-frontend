import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  useDisclosure,
  Tooltip,
} from "@nextui-org/react";
import { FaWatchmanMonitoring } from "react-icons/fa";
import { MdWindow } from "react-icons/md";
import Toolbar from "react-multi-date-picker/plugins/toolbar";

const ModalMonitorSelection = ({ videoName, monitors, fitToMonitors, darkMode, item }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedMonitors, setSelectedMonitors] = useState([]);

  const handleMonitorSelection = (index) => {
    setSelectedMonitors((prevSelected) =>
      prevSelected.includes(index)
        ? prevSelected.filter((i) => i !== index)
        : [...prevSelected, index]
    );
  };

  const handleApplySelection = () => {
    fitToMonitors(videoName, selectedMonitors, item);
    onOpenChange(false); // Close the modal after applying
  };

  return (
    <>
      <Tooltip content="همسایز کردن با مانیتور">
        <Button
          className={`${darkMode ? "text-white" : "text-black"} min-w-fit h-fit p-1`}
          size="md"
          variant="light"
          color="default"
          onPress={onOpen}
        >
          <MdWindow size={15} />
        </Button>
      </Tooltip>
      <Modal scrollBehavior="outside" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>انتخاب مانیتور</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-2">
                  {monitors.map((monitor, index) => (
                    <div key={index} className="flex items-center">
                      <Checkbox
                        isSelected={selectedMonitors.includes(index)}
                        onChange={() => handleMonitorSelection(index)}
                      >
                        {`Monitor ${monitor.numberMonitor} (${monitor.width}x${monitor.height})`}
                      </Checkbox>
                    </div>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  لغو
                </Button>
                <Button color="primary" onPress={handleApplySelection}>
                  اعمال
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ModalMonitorSelection;
