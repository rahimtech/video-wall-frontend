// src/components/SecuritySettingsModal.jsx
import React, { useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Tooltip,
  Tabs,
  Tab,
  Input,
  Checkbox,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Chip,
} from "@nextui-org/react";
import { FiShield, FiPlus, FiSave } from "react-icons/fi";

export default function SecuritySettingsModal({ darkMode }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [tab, setTab] = useState("roles");

  // ---- Mock data states (بعداً با API جایگزین کن) ----
  const [levels, setLevels] = useState([
    { id: 1, name: "سطح ۱ (Viewer)" },
    { id: 2, name: "سطح ۲ (Editor)" },
    { id: 3, name: "سطح ۳ (Admin)" },
  ]);
  const [newLevel, setNewLevel] = useState("");

  const [permissions, setPermissions] = useState([
    { key: "user.create", label: "ایجاد کاربر", enabled: true },
    { key: "user.delete", label: "حذف کاربر", enabled: false },
    { key: "content.edit", label: "ویرایش محتوا", enabled: true },
    { key: "monitor.assign", label: "تخصیص مانیتور", enabled: false },
  ]);

  const [roles, setRoles] = useState([
    {
      id: 101,
      name: "مدیر سیستم",
      description: "تمام دسترسی‌ها",
      permissions: ["*"],
    },
    {
      id: 102,
      name: "اپراتور",
      description: "دسترسی محدود",
      permissions: ["content.edit", "monitor.assign"],
    },
  ]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const [hierarchy, setHierarchy] = useState({
    regionInheritance: true,
    nodes: [
      { id: "IR", name: "ایران", parent: null },
      { id: "THR", name: "تهران", parent: "IR" },
      { id: "THR-1", name: "تهران - منطقه ۱", parent: "THR" },
    ],
  });
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeParent, setNewNodeParent] = useState("THR");

  const [logs] = useState([
    { id: 1, user: "ali", action: "ورود موفق", at: "۱۴۰۴/۰۵/۱۰ - ۱۲:۳۰" },
    { id: 2, user: "sara", action: "تغییر نقش کاربر x", at: "۱۴۰۴/۰۵/۱۰ - ۱۲:۴۵" },
  ]);

  const containerCls = useMemo(
    () =>
      `${darkMode ? "dark bg-gray-900 text-gray-100" : "bg-white text-gray-800"} ${
        darkMode ? "border border-gray-700" : "border border-gray-200"
      } rounded-lg`,
    [darkMode]
  );

  // ---- Actions (اینجا بعداً API صدا بزن) ----
  const addLevel = () => {
    if (!newLevel.trim()) return;
    setLevels((p) => [...p, { id: Date.now(), name: newLevel.trim() }]);
    setNewLevel("");
    // TODO: await api.post('/roles/levels', { name: newLevel })
  };

  const togglePermission = (key) => {
    setPermissions((p) => p.map((it) => (it.key === key ? { ...it, enabled: !it.enabled } : it)));
    // TODO: await api.post('/permissions/toggle', { key, enabled: !enabled })
  };

  const savePermissions = () => {
    // TODO: await api.post('/permissions', permissions)
    console.log("save permissions ->", permissions);
  };

  const createRole = () => {
    if (!newRoleName.trim()) return;
    const role = {
      id: Date.now(),
      name: newRoleName.trim(),
      description: newRoleDesc.trim(),
      permissions: permissions.filter((p) => p.enabled).map((p) => p.key),
    };
    setRoles((p) => [role, ...p]);
    setNewRoleName("");
    setNewRoleDesc("");
    // TODO: await api.post('/roles', role)
  };

  const addHierarchyNode = () => {
    if (!newNodeName.trim()) return;
    setHierarchy((h) => ({
      ...h,
      nodes: [
        ...h.nodes,
        { id: Date.now().toString(), name: newNodeName.trim(), parent: newNodeParent || null },
      ],
    }));
    setNewNodeName("");
    // TODO: await api.post('/hierarchy/nodes', { name: newNodeName, parent: newNodeParent })
  };

  const toggleRegionInheritance = () => {
    setHierarchy((h) => ({ ...h, regionInheritance: !h.regionInheritance }));
    // TODO: await api.post('/hierarchy/settings', { regionInheritance: !hierarchy.regionInheritance })
  };

  return (
    <>
      <Tooltip content="تنظیمات امنیتی و دسترسی‌ها">
        <Button
          className={`${darkMode ? "dark" : "light"} min-w-[35px] h-[33px] rounded-lg p-1`}
          size="sm"
          variant="solid"
          color="default"
          onPress={onOpen}
          aria-label="security-settings"
        >
          <FiShield size={20} />
          تنظیمات
        </Button>
      </Tooltip>

      <Modal
        dir="rtl"
        scrollBehavior="outside"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-lg font-bold">
                تنظیمات امنیتی و دسترسی‌ها
              </ModalHeader>

              <ModalBody>
                <Tabs
                  fullWidth
                  selectedKey={tab}
                  onSelectionChange={setTab}
                  aria-label="security tabs"
                  className="mb-2"
                >
                  <Tab key="roles" title="نقش‌ها و مقام‌ها">
                    <div className="grid gap-4">
                      <Card className={containerCls}>
                        <CardHeader className="flex items-center justify-between">
                          <span className="font-semibold">ایجاد نقش جدید</span>
                          <Chip color="secondary" variant="flat">
                            سفارشی
                          </Chip>
                        </CardHeader>
                        <Divider />
                        <CardBody className="grid md:grid-cols-2 gap-3">
                          <Input
                            label="نام نقش"
                            placeholder="مثال: مدیر ارشد"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                          />
                          <Input
                            label="توضیح"
                            placeholder="مثال: دسترسی کامل"
                            value={newRoleDesc}
                            onChange={(e) => setNewRoleDesc(e.target.value)}
                          />
                          <div className="md:col-span-2">
                            <div className="mb-2 text-sm opacity-80">
                              انتخاب مجوزها (بر اساس وضعیت فعلی)
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {permissions.map((p) => (
                                <Chip
                                  key={p.key}
                                  color={p.enabled ? "success" : "default"}
                                  variant="bordered"
                                >
                                  {p.label}
                                </Chip>
                              ))}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <Button color="primary" startContent={<FiPlus />} onPress={createRole}>
                              ذخیره نقش
                            </Button>
                          </div>
                        </CardBody>
                      </Card>

                      <Card className={containerCls}>
                        <CardHeader className="font-semibold">لیست نقش‌ها</CardHeader>
                        <Divider />
                        <CardBody>
                          <Table aria-label="roles table" shadow="none">
                            <TableHeader>
                              <TableColumn>نقش</TableColumn>
                              <TableColumn>توضیح</TableColumn>
                              <TableColumn>مجوزها</TableColumn>
                            </TableHeader>
                            <TableBody emptyContent="نقشی موجود نیست">
                              {roles.map((r) => (
                                <TableRow key={r.id}>
                                  <TableCell className="font-semibold">{r.name}</TableCell>
                                  <TableCell>{r.description || "-"}</TableCell>
                                  <TableCell>
                                    {r.permissions.includes("*") ? (
                                      <Chip color="success" variant="flat">
                                        ALL
                                      </Chip>
                                    ) : (
                                      <div className="flex flex-wrap gap-1">
                                        {r.permissions.map((k) => (
                                          <Chip key={k} size="sm" variant="flat">
                                            {k}
                                          </Chip>
                                        ))}
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardBody>
                      </Card>
                    </div>
                  </Tab>

                  <Tab key="permissions" title="مجوزهای دسترسی">
                    <Card className={containerCls}>
                      <CardHeader className="flex items-center justify-between">
                        <span className="font-semibold">تعریف مجوز برای هر اقدام</span>
                        <Button color="primary" startContent={<FiSave />} onPress={savePermissions}>
                          ذخیره تغییرات
                        </Button>
                      </CardHeader>
                      <Divider />
                      <CardBody className="grid md:grid-cols-2 gap-2">
                        {permissions.map((p) => (
                          <Checkbox
                            key={p.key}
                            isSelected={p.enabled}
                            onValueChange={() => togglePermission(p.key)}
                          >
                            {p.label}{" "}
                            <span className="opacity-50 text-xs ltr:ml-2 rtl:mr-2">({p.key})</span>
                          </Checkbox>
                        ))}
                      </CardBody>
                    </Card>
                  </Tab>

                  <Tab key="levels" title="سطوح دسترسی">
                    <Card className={containerCls}>
                      <CardHeader className="font-semibold">تعریف سطح جدید</CardHeader>
                      <Divider />
                      <CardBody className="grid md:grid-cols-3 gap-3">
                        <Input
                          label="نام سطح"
                          placeholder="مثال: سطح ناظر"
                          value={newLevel}
                          onChange={(e) => setNewLevel(e.target.value)}
                        />
                        <Button color="primary" startContent={<FiPlus />} onPress={addLevel}>
                          افزودن
                        </Button>
                        <div className="md:col-span-3 flex flex-wrap gap-2">
                          {levels.map((lv) => (
                            <Chip key={lv.id} variant="flat" color="secondary">
                              {lv.name}
                            </Chip>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  </Tab>

                  <Tab key="hierarchy" title="سلسله‌مراتب / ارث‌بری منطقه‌ای">
                    <div className="grid gap-4">
                      <Card className={containerCls}>
                        <CardHeader className="font-semibold">تنظیم ارث‌بری منطقه‌ای</CardHeader>
                        <Divider />
                        <CardBody className="flex items-center gap-3">
                          <Checkbox
                            isSelected={hierarchy.regionInheritance}
                            onValueChange={toggleRegionInheritance}
                          >
                            ارث‌بری سطح بالاتر برای مناطق زیرمجموعه فعال باشد
                          </Checkbox>
                        </CardBody>
                      </Card>

                      <Card className={containerCls}>
                        <CardHeader className="font-semibold">افزودن گرهٔ جدید</CardHeader>
                        <Divider />
                        <CardBody className="grid md:grid-cols-3 gap-3">
                          <Input
                            label="نام گره/منطقه"
                            placeholder="مثال: مشهد - منطقه ۲"
                            value={newNodeName}
                            onChange={(e) => setNewNodeName(e.target.value)}
                          />
                          <Input
                            label="والد (ID یا کد)"
                            placeholder="مثال: THR"
                            value={newNodeParent}
                            onChange={(e) => setNewNodeParent(e.target.value)}
                          />
                          <Button
                            color="primary"
                            startContent={<FiPlus />}
                            onPress={addHierarchyNode}
                          >
                            افزودن
                          </Button>

                          <div className="md:col-span-3">
                            <Table aria-label="hierarchy table" shadow="none">
                              <TableHeader>
                                <TableColumn>ID/کد</TableColumn>
                                <TableColumn>نام</TableColumn>
                                <TableColumn>والد</TableColumn>
                              </TableHeader>
                              <TableBody emptyContent="گره‌ای ثبت نشده">
                                {hierarchy.nodes.map((n) => (
                                  <TableRow key={n.id}>
                                    <TableCell>{n.id}</TableCell>
                                    <TableCell>{n.name}</TableCell>
                                    <TableCell>{n.parent || "-"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </Tab>

                  <Tab key="logs" title="لاگ‌های امنیتی">
                    <Card className={containerCls}>
                      <CardHeader className="font-semibold">ثبت لاگ امنیتی کاربران</CardHeader>
                      <Divider />
                      <CardBody>
                        <Table aria-label="logs table" shadow="none">
                          <TableHeader>
                            <TableColumn>کاربر</TableColumn>
                            <TableColumn>اقدام</TableColumn>
                            <TableColumn>زمان</TableColumn>
                          </TableHeader>
                          <TableBody emptyContent="لاگی موجود نیست">
                            {logs.map((l) => (
                              <TableRow key={l.id}>
                                <TableCell>{l.user}</TableCell>
                                <TableCell>{l.action}</TableCell>
                                <TableCell>{l.at}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardBody>
                    </Card>
                  </Tab>
                </Tabs>
              </ModalBody>

              <ModalFooter>
                <Button fullWidth color="danger" variant="light" onPress={onClose}>
                  بستن
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
