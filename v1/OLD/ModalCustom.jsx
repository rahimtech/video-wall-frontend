import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import { useMyContext } from "../../context/MyContext";
import { Input } from "@nextui-org/react";

export default function ModalCustom() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleHeightChange = (e) => {
    const newHeight = e.target.value;
    con.setHeight(newHeight);
  };

  const handleWeightChange = (e) => {
    const newWeight = e.target.value;
    con.setWeight(newWeight);
  };

  const con = useMyContext();
  return (
    <span className="z-10">
      {/* <Button className="bg-slate-700 text-white" onPress={onOpen}>
        افزودن قاب
      </Button> */}

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-black justify-center items-center">
                این ویژگی بزودی اضافه خواهد شد
              </ModalHeader>
              <ModalBody className="flex justify-center flex-col items-center">
                <Input
                  type="number"
                  label="عرض قاب"
                  placeholder="1920"
                  className="max-w-[220px]"
                  onChange={handleWeightChange}
                />
                <Input
                  type="number"
                  label="ارتفاع قاب"
                  placeholder="1080"
                  className="max-w-[220px]"
                  onChange={handleHeightChange}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  بستن
                </Button>
                <Button color="primary" onPress={onClose}>
                  اعمال تغییرات
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </span>
  );
}
