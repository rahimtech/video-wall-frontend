// src/components/SecuritySettingsModal.jsx
"use client";
import React, { useMemo, useState, useEffect } from "react";
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
  Avatar,
  Spinner,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { FiShield, FiPlus, FiSave, FiEdit, FiTrash2, FiUserPlus } from "react-icons/fi";
import { useAuth } from "../..";
import axios from "axios";
import { RiForbid2Fill } from "react-icons/ri";

/**
 * SecuritySettingsModal (with: user exceptions + simple hierarchy tree)
 *
 * - User exceptions: per-user deny list (overrides role grants).
 * - HierarchyTree: simple recursive tree UI to manage nodes (add/move/delete).
 *
 * NOTE: network calls are mocked. Replace api* functions with real endpoints.
 */

// ---------------- Mock API placeholders ----------------
const wait = (ms = 300) => new Promise((res) => setTimeout(res, ms));

const API_ROOT = `http://${localStorage.getItem("host")}:4000/api/auth`;
const API_ROOT_USERS = `http://${localStorage.getItem("host")}:4000/api`;
const userAccessToken = localStorage.getItem("accessToken");

async function apiFetchUsers() {
  await wait(200);
  const res = await axios.get(`${API_ROOT_USERS}/users`, {
    headers: {
      Authorization: `Bearer ${userAccessToken}`,
    },
  });
  return res.data.data;
}
async function apiFetchRoles() {
  await wait(160);
  return [
    {
      id: 101,
      name: "مدیر سیستم",
      slug: "admin",
      description: "دسترسی کامل",
      isSystem: true,
      priority: 100,
    },
    {
      id: 102,
      name: "اپراتور",
      slug: "operator",
      description: "دسترسی‌های عملیاتی",
      isSystem: false,
      priority: 10,
    },
  ];
}
async function apiFetchPermissions() {
  await wait(120);
  return [
    {
      id: 1,
      name: "ایجاد صحنه",
      slug: "scenes.create",
      resource: "scenes",
      action: "create",
      scope: "ALL",
    },
    {
      id: 2,
      name: "حذف کاربر",
      slug: "users.delete",
      resource: "users",
      action: "delete",
      scope: "ALL",
    },
    {
      id: 3,
      name: "ویرایش محتوا",
      slug: "content.update",
      resource: "content",
      action: "update",
      scope: "OWN",
    },
  ];
}
async function apiFetchMenuConfig() {
  await wait(90);
  return [
    { id: 1, name: "داشبورد", path: "/dashboard", requiredPermissions: ["*"] },
    { id: 2, name: "مدیریت رسانه", path: "/media", requiredPermissions: ["media.read"] },
    {
      id: 3,
      name: "صحنه‌ها",
      path: "/scenes",
      requiredPermissions: ["scenes.create", "scenes.read"],
    },
  ];
}
async function apiFetchHierarchy() {
  await wait(100);
  return {
    regionInheritance: true,
    nodes: [
      { id: "IR", name: "ایران", parent: null },
      { id: "THR", name: "تهران", parent: "IR" },
      { id: "THR-1", name: "تهران - منطقه ۱", parent: "THR" },
    ],
  };
}
async function apiSaveUser(u) {
  console.log("apiSaveUser", u);
  // const auth = useAuth();

  // setLoading(true);
  try {
    if (u.id) {
      await axios.put(
        `${API_ROOT_USERS}/users/${u.id}`,
        {
          username: u.username,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          isActive: u.isActive,
          isSuperAdmin: u.isSuperAdmin,
        },
        {
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
          },
        }
      );
    } else {
      await axios.post(`${API_ROOT}/signup`, u, {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      });
    }
    // localStorage.setItem("isLoggedIn", "true");
    // onSignupSuccess?.();
  } catch (err) {
    return err;
  } finally {
    // setLoading(false);
  }
  return { ok: true, data: { ...u, id: u.id || Math.floor(Math.random() * 90000) + 1000 } };
}
async function apiDeleteUser(id) {
  try {
    if (id) {
      await axios.delete(`${API_ROOT_USERS}/users/${id}`, {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      });
    }
    // localStorage.setItem("isLoggedIn", "true");
    // onSignupSuccess?.();
  } catch (err) {
    return err;
  } finally {
    // setLoading(false);
  }

  return { ok: true };
}
async function apiSaveRole(r) {
  await wait(180);
  console.log("apiSaveRole", r);
  return { ok: true, data: { ...r, id: r.id || Math.floor(Math.random() * 90000) + 1000 } };
}
async function apiDeleteRole(id) {
  await wait(160);
  console.log("apiDeleteRole", id);
  return { ok: true };
}
async function apiSaveHierarchy(h) {
  await wait(180);
  console.log("apiSaveHierarchy", h);
  return { ok: true, data: h };
}

// ---------------- Helper: build tree from flat nodes ----------------
function buildTree(nodes) {
  const map = {};
  nodes.forEach((n) => (map[n.id] = { ...n, children: [] }));
  const roots = [];
  nodes.forEach((n) => {
    if (n.parent && map[n.parent]) map[n.parent].children.push(map[n.id]);
    else roots.push(map[n.id]);
  });
  return roots;
}

// ---------------- Component ----------------
export default function SecuritySettingsModal({ darkMode }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [tab, setTab] = useState("users");

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [menuConfig, setMenuConfig] = useState([]);
  const [hierarchy, setHierarchy] = useState({ regionInheritance: true, nodes: [] });
  const [userQuery, setUserQuery] = useState("");

  // editors
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [rolePermissionDraft, setRolePermissionDraft] = useState({});
  const [roleMenuDraft, setRoleMenuDraft] = useState({});

  const [selected, setSelected] = useState(""); // مقدار انتخاب‌شده
  const [layouts, setLayouts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tab != "monitor") return;
    const fetchLayouts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_ROOT_LAYOUT}/options`, {
          headers: { Authorization: `Bearer ${userAccessToken}` },
        });
        // فرض کنیم پاسخ سرور به‌صورت آرایه‌ای از layoutهاست:
        // { data: [ { id: "2x2", label: "۲ در ۲" }, { id: "3x3", label: "۳ در ۳" } ] }
        setLayouts(res.data?.data || []);
      } catch (err) {
        console.error("fetchLayouts error:", err);
        alert("❌ خطا در دریافت لیست چیدمان‌ها");
      } finally {
        setLoading(false);
      }
    };
    fetchLayouts();
  }, [tab]);

  const handleSave = async () => {
    if (!selected) {
      alert("لطفاً یک چیدمان انتخاب کنید.");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(
        `${API_ROOT_LAYOUT}/apply`,
        { layout: selected },
        {
          headers: { Authorization: `Bearer ${userAccessToken}` },
        }
      );

      if (res.data?.success) {
        alert(`✅ چیدمان "${selected}" با موفقیت ثبت شد.`);
      } else {
        alert("❌ ثبت چیدمان با خطا مواجه شد.");
      }
    } catch (err) {
      console.error("handleSave error:", err);
      const msg = err?.response?.data?.message || err.message || "خطا در ارتباط با سرور";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const containerCls = useMemo(
    () =>
      `${darkMode ? "dark bg-gray-900 text-gray-100" : "bg-white text-gray-800"} ${
        darkMode ? "border border-gray-700" : "border border-gray-200"
      } rounded-lg`,
    [darkMode]
  );

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    (async () => {
      // console.log("isOpen::: ", isOpen);
      setLoading(true);
      const [u, r, p, m, h] = await Promise.all([
        apiFetchUsers(),
        apiFetchRoles(),
        apiFetchPermissions(),
        apiFetchMenuConfig(),
        apiFetchHierarchy(),
      ]);
      if (!mounted) return;
      setUsers(u);
      setRoles(r);
      setPermissions(p);
      setMenuConfig(m);
      setHierarchy(h || { regionInheritance: true, nodes: [] });

      // init drafts
      const rp = {};
      const rm = {};
      r.forEach((role) => {
        rp[role.id] = {};
        p.forEach((perm) => (rp[role.id][perm.slug] = false));
        rm[role.id] = {};
        m.forEach((mi) => (rm[role.id][mi.id] = false));
      });
      setRolePermissionDraft(rp);
      setRoleMenuDraft(rm);

      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const getRoleById = (id) => roles.find((r) => r.id === id);
  const getUserRoles = (u) => (u?.roles || []).map(getRoleById).filter(Boolean);

  // ------------------ Permission resolution with exceptions ------------------
  // logic: userHasPermission returns true if:
  // - user.isSuperAdmin => true (unless we decide to apply exceptions; we'll allow exceptions to deny even superadmin if explicitly set)
  // - any role grants the permission AND user.exceptions.deny does NOT include the slug
  // For simplicity, role -> permissions mapping is mocked: admin -> '*' ; operator -> content.update
  function roleGrantsPermission(role, permSlug) {
    if (!role) return false;
    if (role.slug === "admin") return true; // admin grants all
    // for demo, role 102 (operator) grants content.update
    if (role.slug === "operator" && permSlug === "content.update") return true;
    return false;
  }

  function userHasPermission(user, permSlug) {
    if (!user) return false;
    const exceptions = user.exceptions || { deny: [] };
    // if explicitly denied -> no
    if (exceptions.deny && exceptions.deny.includes(permSlug)) return false;
    // superadmin -> true unless explicitly denied
    if (user.isSuperAdmin) return true;
    // check roles
    const rs = getUserRoles(user);
    for (const r of rs) {
      if (roleGrantsPermission(r, permSlug)) return true;
    }
    return false;
  }

  // ------------- Users handlers & exceptions UI -------------
  const openCreateUser = () => {
    setEditingUser({
      id: null,
      email: "",
      username: "",
      firstName: "",
      lastName: "",
      password: "",
      isActive: true,
      isSuperAdmin: false,
      roles: [],
      exceptions: { deny: [] },
    });
    setTab("users");
  };
  const openEditUser = (u) => {
    setEditingUser({ ...u, exceptions: u.exceptions || { deny: [] } });
  };
  const saveUser = async (u) => {
    if (!u.email) return alert("ایمیل را وارد کنید.");

    try {
      const res = await apiSaveUser(u);

      if (res.ok) {
        setUsers((prev) => {
          const exists = prev.find((it) => it.id === res.data.id);
          if (exists) return prev.map((it) => (it.id === res.data.id ? res.data : it));
          return [res.data, ...prev];
        });
        setEditingUser(null);
        alert("✅ کاربر با موفقیت ذخیره شد");
        location.reload();
      } else {
        const errors = res?.response?.data?.errors;
        const message = res?.response?.data?.message || "خطا در ثبت کاربر";

        if (errors && typeof errors === "object") {
          // چند خطا را به متن خوانا تبدیل می‌کنیم
          const errorMessages = Object.entries(errors)
            .map(([field, msg]) => `• ${field}: ${msg}`)
            .join("\n");
          alert(`❌ ${message}\n\n${errorMessages}`);
        } else {
          alert(`❌ ${message}`);
        }
      }
    } catch (err) {
      console.error("saveUser error:", err);

      const errors = err?.response?.data?.errors;
      const message = err?.response?.data?.message || err?.message || "خطای ناشناخته‌ای رخ داد.";

      if (errors && typeof errors === "object") {
        const errorMessages = Object.entries(errors)
          .map(([field, msg]) => `• ${field}: ${msg}`)
          .join("\n");
        alert(`❌ ${message}\n\n${errorMessages}`);
      } else {
        alert(`❌ ${message}`);
      }
    }
  };

  const removeUser = async (id) => {
    if (!confirm("آیا از حذف کاربر مطمئن هستید؟")) return;
    const res = await apiDeleteUser(id);
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    // location.reload();
  };
  const toggleUserRole = (userId, roleId) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              roles: u.roles.includes(roleId)
                ? u.roles.filter((r) => r !== roleId)
                : [...u.roles, roleId],
            }
          : u
      )
    );
  };
  const toggleUserActive = async (userId, newIsActive) => {
    if (!userId) return;

    // 1) snapshot برای rollback
    let previous;
    setUsers((prev) => {
      previous = prev;
      return prev.map((u) => (u.id === userId ? { ...u, isActive: newIsActive } : u));
    });

    try {
      const res = await axios.put(
        `${API_ROOT_USERS}/users/${userId}`,
        { isActive: newIsActive },
        { headers: { Authorization: `Bearer ${userAccessToken}` } }
      );

      if (!res?.data?.success) {
        const msg = res?.data?.message || "خطا در به‌روزرسانی وضعیت";
        // rollback
        setUsers(previous);
        alert(msg);
      }
    } catch (err) {
      console.error("toggleUserActive error:", err);
      // rollback
      setUsers(previous);
      const message = err?.response?.data?.message || err?.message || "خطا در ارتباط با سرور";
      alert(`❌ ${message}`);
    }
  };

  // exceptions toggles
  const toggleUserExceptionDeny = (userId, permSlug) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const ex = { ...(u.exceptions || { deny: [] }) };
        ex.deny = ex.deny || [];
        if (ex.deny.includes(permSlug)) ex.deny = ex.deny.filter((s) => s !== permSlug);
        else ex.deny.push(permSlug);
        return { ...u, exceptions: ex };
      })
    );
  };

  // ------------- Roles tab handlers -------------
  const openCreateRole = () =>
    setEditingRole({ id: null, name: "", slug: "", description: "", isSystem: false, priority: 0 });
  const openEditRole = (r) => {
    setEditingRole({ ...r });
    if (!rolePermissionDraft[r.id]) {
      setRolePermissionDraft((prev) => {
        const cp = { ...prev, [r.id]: {} };
        permissions.forEach((p) => (cp[r.id][p.slug] = false));
        return cp;
      });
    }
  };
  const saveRole = async (r) => {
    if (!r.name) return alert("نام نقش را وارد کنید");
    const res = await apiSaveRole(r);
    if (res.ok) {
      setRoles((prev) => {
        const exists = prev.find((it) => it.id === res.data.id);
        if (exists) return prev.map((it) => (it.id === res.data.id ? res.data : it));
        return [res.data, ...prev];
      });
      setEditingRole(null);
    } else alert("خطا در ذخیره نقش");
  };
  const deleteRole = async (id) => {
    if (!confirm("آیا از حذف نقش مطمئن هستید؟")) return;
    const res = await apiDeleteRole(id);
    if (res.ok) {
      setRoles((prev) => prev.filter((r) => r.id !== id));
      setUsers((prev) =>
        prev.map((u) => ({ ...u, roles: (u.roles || []).filter((rid) => rid !== id) }))
      );
    }
  };
  const toggleRolePermissionDraft = (roleId, slug) => {
    setRolePermissionDraft((prev) => ({
      ...prev,
      [roleId]: { ...(prev[roleId] || {}), [slug]: !(prev[roleId] || {})[slug] },
    }));
  };
  const saveRolePermissions = async (roleId) => {
    console.log("saveRolePermissions", roleId, rolePermissionDraft[roleId]);
    alert("ذخیره شد (mock)");
  };
  const toggleRoleMenuDraft = (roleId, menuId) => {
    setRoleMenuDraft((prev) => ({
      ...prev,
      [roleId]: { ...(prev[roleId] || {}), [menuId]: !(prev[roleId] || {})[menuId] },
    }));
  };
  const saveRoleMenuAccess = async (roleId) => {
    console.log("saveRoleMenuAccess", roleId, roleMenuDraft[roleId]);
    alert("ذخیره شد (mock)");
  };

  // ---------------- Hierarchy (tree) handlers ----------------
  // add node: can specify parent (null for root)
  const addHierarchyNode = (name, parent = null) => {
    if (!name || !name.trim()) return;
    const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const node = { id, name: name.trim(), parent: parent || null };
    setHierarchy((h) => ({ ...h, nodes: [...h.nodes, node] }));
    return node;
  };

  const updateHierarchyNode = (id, patch) => {
    setHierarchy((h) => ({
      ...h,
      nodes: h.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
  };

  const deleteHierarchyNode = (id) => {
    if (!confirm("آیا از حذف این گره مطمئن هستید؟ تمام زیرگره‌ها نیز حذف خواهند شد.")) return;
    setHierarchy((h) => ({ ...h, nodes: h.nodes.filter((n) => n.id !== id && n.parent !== id) }));
  };

  const moveNodeToParent = (id, newParentId) => {
    updateHierarchyNode(id, { parent: newParentId || null });
  };

  const toggleRegionInheritance = () => {
    setHierarchy((h) => ({ ...h, regionInheritance: !h.regionInheritance }));
  };

  const saveHierarchy = async () => {
    const res = await apiSaveHierarchy(hierarchy);
    if (res.ok) alert("سلسله‌مراتب ذخیره شد (mock).");
  };

  // ---------------- UI helpers ----------------
  const filteredUsers = users.filter((u) => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.id).includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(q)
    );
  });

  // ---------------- HierarchyTree: recursive renderer ----------------
  const HierarchyTree = ({ nodesFlat, parent = null }) => {
    const roots = nodesFlat.filter((n) => (n.parent || null) === parent);
    return (
      <ul className="pl-4">
        {roots.map((node) => (
          <li key={node.id} className="mb-2">
            <div className="flex items-center gap-2">
              <div className="font-medium">{node.name}</div>
              <div className="text-xs opacity-60">({node.id})</div>
              <div className="flex gap-1 mr-auto">
                <button
                  className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700"
                  onClick={() => {
                    const newName = prompt("نام جدید گره را وارد کنید:", node.name);
                    if (newName) updateHierarchyNode(node.id, { name: newName });
                  }}
                >
                  ویرایش
                </button>
                <button
                  className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700"
                  onClick={() => {
                    const childName = prompt("نام گره فرزند جدید را وارد کنید:");
                    if (childName) addHierarchyNode(childName, node.id);
                  }}
                >
                  افزودن فرزند
                </button>
                <button
                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-700"
                  onClick={() => deleteHierarchyNode(node.id)}
                >
                  حذف
                </button>
              </div>
              <div>
                <select
                  className="text-xs border rounded px-2 py-1"
                  value={node.parent || ""}
                  onChange={(e) => moveNodeToParent(node.id, e.target.value || null)}
                >
                  <option value="">ریشه</option>
                  {hierarchy.nodes
                    .filter((n) => n.id !== node.id)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* recursive children */}
            <HierarchyTree nodesFlat={nodesFlat} parent={node.id} />
          </li>
        ))}
      </ul>
    );
  };

  // ---------------- Render ----------------
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
          <FiShield size={18} /> تنظیمات
        </Button>
      </Tooltip>

      <Modal
        dir="rtl"
        scrollBehavior="outside"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="7xl"
      >
        <ModalContent className="min-w-[70%]">
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-bold">تنظیمات امنیتی و مدیریت کاربران</div>
                  <div className="text-sm opacity-70">نمایش، ویرایش و مدیریت نقش‌ها و مجوزها</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<FiUserPlus />}
                    onPress={openCreateUser}
                  >
                    کاربر جدید
                  </Button>
                  {/* <Button
                    size="sm"
                    color="primary"
                    startContent={<FiPlus />}
                    onPress={openCreateRole}
                  >
                    نقش جدید
                  </Button> */}
                </div>
              </ModalHeader>

              <ModalBody>
                {loading ? (
                  <div className="w-full h-56 flex items-center justify-center">
                    <Spinner />
                  </div>
                ) : (
                  <Tabs
                    fullWidth
                    selectedKey={tab}
                    onSelectionChange={setTab}
                    aria-label="security tabs"
                    className="mb-2"
                  >
                    {/* Users */}
                    <Tab key="users" title="کاربران">
                      <div className="grid gap-4">
                        <Card className={containerCls}>
                          <CardHeader className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold">مدیریت کاربران</div>
                              <Badge color="default">{users.length}</Badge>
                            </div>

                            <Input
                              placeholder="جستجو در کاربران..."
                              value={userQuery}
                              onChange={(e) => setUserQuery(e.target.value)}
                              clearable
                              size="sm"
                            />
                          </CardHeader>
                          <Divider />
                          <CardBody>
                            <Table aria-label="users table" shadow="none">
                              <TableHeader>
                                <TableColumn>کاربر</TableColumn>
                                <TableColumn>ایمیل</TableColumn>
                                <TableColumn>نقش‌ها</TableColumn>
                                <TableColumn>وضعیت</TableColumn>
                                <TableColumn>عملیات</TableColumn>
                              </TableHeader>
                              <TableBody emptyContent="کاربری یافت نشد">
                                {filteredUsers.map((u) => (
                                  <TableRow key={u.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Avatar
                                          text={u.firstName ? u.firstName[0] : (u.email || "")[0]}
                                          size="sm"
                                        />
                                        <div>
                                          <div className="font-semibold">
                                            {u.firstName || u.username || u.email}
                                          </div>
                                          <div className="text-xs opacity-60">
                                            @{u.username || "—"}
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>

                                    <TableCell>
                                      <div className="text-sm">{u.email}</div>
                                    </TableCell>

                                    <TableCell>
                                      <div className="flex gap-2 flex-wrap">
                                        {getUserRoles(u).length === 0 ? (
                                          <div className="text-xs opacity-60">
                                            {u.isSuperAdmin ? "مدیر" : "کاربر"}
                                          </div>
                                        ) : (
                                          getUserRoles(u).map((r) => (
                                            <Chip key={r.id} size="sm" variant="flat">
                                              {r.name}
                                            </Chip>
                                          ))
                                        )}
                                      </div>
                                    </TableCell>

                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        {u.isSuperAdmin ? (
                                          <Badge color="success">Super</Badge>
                                        ) : u.isActive ? (
                                          <Badge color="primary">فعال</Badge>
                                        ) : (
                                          <Badge color="neutral">غیرفعال</Badge>
                                        )}
                                      </div>
                                    </TableCell>

                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="light"
                                          onPress={() => openEditUser(u)}
                                          startContent={<FiEdit />}
                                        >
                                          ویرایش
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="light"
                                          color="danger"
                                          onPress={() => removeUser(u.id)}
                                          startContent={<FiTrash2 />}
                                        >
                                          حذف
                                        </Button>
                                        <Button
                                          size="sm"
                                          color={u.isActive ? "danger" : "success"}
                                          variant="light"
                                          startContent={<RiForbid2Fill />}
                                          onPress={() => {
                                            let isActive = !u.isActive;
                                            toggleUserActive(u.id, isActive);
                                          }}
                                        >
                                          {u.isActive ? "تعلیق" : "فعال‌سازی"}
                                        </Button>

                                        {/* <Dropdown>
                                          <DropdownTrigger>
                                            <Button size="sm" variant="bordered">
                                              نقش
                                            </Button>
                                          </DropdownTrigger>
                                          <DropdownMenu
                                            aria-label="assign-role"
                                            onAction={(key) => toggleUserRole(u.id, Number(key))}
                                          >
                                            {roles.map((r) => (
                                              <DropdownItem
                                                key={r.id}
                                                startContent={
                                                  <Checkbox isSelected={u.roles?.includes(r.id)} />
                                                }
                                              >
                                                {r.name}
                                              </DropdownItem>
                                            ))}
                                          </DropdownMenu>
                                        </Dropdown> */}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardBody>
                        </Card>

                        {/* user editor */}
                        {editingUser && (
                          <Card className={containerCls}>
                            <CardHeader className="font-semibold">
                              {editingUser.id ? "ویرایش کاربر" : "کاربر جدید"}
                            </CardHeader>
                            <Divider />
                            <CardBody className="grid md:grid-cols-2 gap-3">
                              <Input
                                label="ایمیل"
                                value={editingUser.email}
                                onChange={(e) =>
                                  setEditingUser((s) => ({ ...s, email: e.target.value }))
                                }
                              />
                              <Input
                                label="نام کاربری"
                                value={editingUser.username}
                                onChange={(e) =>
                                  setEditingUser((s) => ({ ...s, username: e.target.value }))
                                }
                              />
                              <Input
                                label="نام"
                                value={editingUser.firstName}
                                onChange={(e) =>
                                  setEditingUser((s) => ({ ...s, firstName: e.target.value }))
                                }
                              />
                              <Input
                                label="نام خانوادگی"
                                value={editingUser.lastName}
                                onChange={(e) =>
                                  setEditingUser((s) => ({ ...s, lastName: e.target.value }))
                                }
                              />
                              <Input
                                label="پسوورد"
                                type="password"
                                value={editingUser.password}
                                onChange={(e) =>
                                  setEditingUser((s) => ({ ...s, password: e.target.value }))
                                }
                              />
                              <div className="md:col-span-2 flex items-center gap-3">
                                <Checkbox
                                  isSelected={editingUser.isActive}
                                  onChange={() =>
                                    setEditingUser((s) => ({ ...s, isActive: !s.isActive }))
                                  }
                                >
                                  فعال
                                </Checkbox>
                                <Checkbox
                                  isSelected={editingUser.isSuperAdmin}
                                  onChange={() =>
                                    setEditingUser((s) => ({ ...s, isSuperAdmin: !s.isSuperAdmin }))
                                  }
                                >
                                  Super Admin
                                </Checkbox>
                              </div>

                              {/* <div className="md:col-span-2">
                                <div className="mb-2 text-sm opacity-80">اختصاص نقش‌ها</div>
                                <div className="flex flex-wrap gap-2">
                                  {roles.map((r) => (
                                    <Chip
                                      key={r.id}
                                      color={
                                        editingUser.roles?.includes(r.id) ? "success" : "default"
                                      }
                                      variant="flat"
                                      onClick={() =>
                                        setEditingUser((s) => ({
                                          ...s,
                                          roles: s.roles.includes(r.id)
                                            ? s.roles.filter((x) => x !== r.id)
                                            : [...s.roles, r.id],
                                        }))
                                      }
                                    >
                                      {r.name}
                                    </Chip>
                                  ))}
                                </div>
                              </div> */}

                              {/* ---- Exceptions UI ---- */}
                              {/* <div className="md:col-span-2">
                                <Divider />
                                <div className="mt-2 mb-2 text-sm font-medium">
                                  استثناهای این کاربر (deny)
                                </div>
                                <div className="text-xs opacity-70 mb-2">
                                  اگر مجوزی در لیست deny قرار بگیرد، حتی اگر نقش کاربر آن مجوز را
                                  بدهد، برای این کاربر غیرفعال خواهد شد.
                                </div>
                                <div className="grid gap-2">
                                  {permissions.map((p) => {
                                    const isDenied = (editingUser.exceptions?.deny || []).includes(
                                      p.slug
                                    );
                                    return (
                                      <div
                                        key={p.id}
                                        className="flex items-center justify-between gap-3"
                                      >
                                        <div>
                                          <div className="font-medium">{p.name}</div>
                                          <div className="text-xs opacity-60">{p.slug}</div>
                                        </div>
                                        <div>
                                          <Checkbox
                                            isSelected={isDenied}
                                            onChange={() => {
                                              // toggle in editingUser first
                                              setEditingUser((s) => {
                                                const ex = { ...(s.exceptions || { deny: [] }) };
                                                ex.deny = ex.deny || [];
                                                if (ex.deny.includes(p.slug))
                                                  ex.deny = ex.deny.filter((x) => x !== p.slug);
                                                else ex.deny.push(p.slug);
                                                return { ...s, exceptions: ex };
                                              });
                                            }}
                                          >
                                            Deny
                                          </Checkbox>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div> */}

                              <div className="md:col-span-2 flex gap-2">
                                <Button
                                  color="primary"
                                  onPress={() => saveUser(editingUser)}
                                  startContent={<FiSave />}
                                >
                                  ذخیره
                                </Button>
                                <Button
                                  variant="light"
                                  color="danger"
                                  onPress={() => setEditingUser(null)}
                                >
                                  انصراف
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    </Tab>

                    {/* Roles */}
                    {/* <Tab key="roles" title="نقش‌ها">
                      <div className="grid gap-4">
                        <Card className={containerCls}>
                          <CardHeader className="flex items-center justify-between">
                            <div className="font-semibold">نقش‌ها</div>
                            <div className="flex items-center gap-2">
                              <Badge color="default">{roles.length}</Badge>
                              <Button
                                size="sm"
                                color="primary"
                                startContent={<FiPlus />}
                                onPress={openCreateRole}
                              >
                                نقش جدید
                              </Button>
                            </div>
                          </CardHeader>
                          <Divider />
                          <CardBody>
                            <Table aria-label="roles table" shadow="none">
                              <TableHeader>
                                <TableColumn>نام</TableColumn>
                                <TableColumn>توضیح</TableColumn>
                                <TableColumn>سیستمی</TableColumn>
                                <TableColumn>عملیات</TableColumn>
                              </TableHeader>
                              <TableBody emptyContent="نقشی ثبت نشده">
                                {roles.map((r) => (
                                  <TableRow key={r.id}>
                                    <TableCell>{r.name}</TableCell>
                                    <TableCell>{r.description || "-"}</TableCell>
                                    <TableCell>
                                      {r.isSystem ? (
                                        <Badge color="success">سیستمی</Badge>
                                      ) : (
                                        <Badge color="primary">کاربری</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="light"
                                          onPress={() => openEditRole(r)}
                                          startContent={<FiEdit />}
                                        >
                                          ویرایش
                                        </Button>
                                        {!r.isSystem && (
                                          <Button
                                            size="sm"
                                            variant="light"
                                            color="danger"
                                            onPress={() => deleteRole(r.id)}
                                            startContent={<FiTrash2 />}
                                          >
                                            حذف
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="bordered"
                                          onPress={() => {
                                            setEditingRole(r);
                                            setTab("roles");
                                          }}
                                        >
                                          مجوزها
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardBody>
                        </Card>

                        {editingRole && (
                          <Card className={containerCls}>
                            <CardHeader className="flex items-center justify-between">
                              <div className="font-semibold">
                                {editingRole.id ? "ویرایش نقش" : "نقش جدید"}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  color="primary"
                                  onPress={() => saveRole(editingRole)}
                                  startContent={<FiSave />}
                                >
                                  ذخیره
                                </Button>
                                <Button
                                  size="sm"
                                  variant="light"
                                  onPress={() => setEditingRole(null)}
                                >
                                  انصراف
                                </Button>
                              </div>
                            </CardHeader>
                            <Divider />
                            <CardBody className="grid md:grid-cols-2 gap-3">
                              <Input
                                value={editingRole.name}
                                label="نام نقش"
                                onChange={(e) =>
                                  setEditingRole((s) => ({ ...s, name: e.target.value }))
                                }
                              />
                              <Input
                                value={editingRole.slug}
                                label="slug"
                                onChange={(e) =>
                                  setEditingRole((s) => ({ ...s, slug: e.target.value }))
                                }
                              />
                              <Input
                                value={editingRole.description}
                                label="توضیح"
                                onChange={(e) =>
                                  setEditingRole((s) => ({ ...s, description: e.target.value }))
                                }
                              />
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  isSelected={editingRole.isSystem}
                                  onChange={() =>
                                    setEditingRole((s) => ({ ...s, isSystem: !s.isSystem }))
                                  }
                                >
                                  سیستمی
                                </Checkbox>
                                <Input
                                  type="number"
                                  value={editingRole.priority}
                                  label="اولویت"
                                  onChange={(e) =>
                                    setEditingRole((s) => ({
                                      ...s,
                                      priority: Number(e.target.value),
                                    }))
                                  }
                                />
                              </div>

                              <div className="md:col-span-2">
                                <div className="mb-2 text-sm opacity-80">مجوزهای نقش</div>
                                <div className="grid gap-2">
                                  {permissions.map((p) => (
                                    <div
                                      key={p.id}
                                      className="flex items-center justify-between gap-3"
                                    >
                                      <div>
                                        <div className="font-medium">{p.name}</div>
                                        <div className="text-xs opacity-60">
                                          {p.slug} — {p.resource}/{p.action}
                                        </div>
                                      </div>
                                      <div>
                                        <Checkbox
                                          isSelected={
                                            !!(
                                              rolePermissionDraft[editingRole.id] &&
                                              rolePermissionDraft[editingRole.id][p.slug]
                                            )
                                          }
                                          onChange={() =>
                                            toggleRolePermissionDraft(editingRole.id, p.slug)
                                          }
                                        >
                                          اجازه
                                        </Checkbox>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-3 flex gap-2">
                                  <Button
                                    color="primary"
                                    onPress={() => saveRolePermissions(editingRole.id)}
                                  >
                                    ذخیره مجوزها
                                  </Button>
                                  <Button
                                    variant="light"
                                    onPress={() =>
                                      setRolePermissionDraft((d) => ({
                                        ...d,
                                        [editingRole.id]: {},
                                      }))
                                    }
                                  >
                                    بازنشانی
                                  </Button>
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                <Divider />
                                <div className="mt-2 mb-2 text-sm opacity-80">
                                  دسترسی منو/بخش‌ها
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {menuConfig.map((m) => (
                                    <Chip
                                      key={m.id}
                                      color={
                                        roleMenuDraft[editingRole.id] &&
                                        roleMenuDraft[editingRole.id][m.id]
                                          ? "success"
                                          : "default"
                                      }
                                      variant="flat"
                                      onClick={() => toggleRoleMenuDraft(editingRole.id, m.id)}
                                    >
                                      {m.name}
                                    </Chip>
                                  ))}
                                </div>
                                <div className="mt-3">
                                  <Button
                                    color="primary"
                                    onPress={() => saveRoleMenuAccess(editingRole.id)}
                                  >
                                    ذخیره دسترسی منو
                                  </Button>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    </Tab> */}

                    {/* Permissions */}
                    {/* <Tab key="permissions" title="مجوزها">
                      <Card className={containerCls}>
                        <CardHeader className="flex items-center justify-between">
                          <div className="font-semibold">تعریف مجوزها</div>
                          <Button
                            size="sm"
                            color="primary"
                            startContent={<FiSave />}
                            onPress={() => alert("ذخیره (mock)")}
                          >
                            ذخیره
                          </Button>
                        </CardHeader>
                        <Divider />
                        <CardBody className="grid gap-3">
                          {permissions.map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs opacity-60">
                                  {p.slug} — {p.resource}/{p.action}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="light"
                                  onPress={() => alert("ویرایش مجوز (mock)")}
                                >
                                  ویرایش
                                </Button>
                                <Button
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  onPress={() => alert("حذف مجوز (mock)")}
                                >
                                  حذف
                                </Button>
                              </div>
                            </div>
                          ))}
                        </CardBody>
                      </Card>
                    </Tab> */}

                    {/* Menu / Hierarchy */}
                    {/* <Tab key="menu" title="منوها / سلسله‌مراتب">
                      <div className="grid gap-4">
                        <Card className={containerCls}>
                          <CardHeader className="font-semibold">پیکربندی منوها</CardHeader>
                          <Divider />
                          <CardBody>
                            <Table aria-label="menu table" shadow="none">
                              <TableHeader>
                                <TableColumn>نام</TableColumn>
                                <TableColumn>مسیر</TableColumn>
                                <TableColumn>نیازمندی مجوزها</TableColumn>
                              </TableHeader>
                              <TableBody emptyContent="موردی ثبت نشده">
                                {menuConfig.map((m) => (
                                  <TableRow key={m.id}>
                                    <TableCell>{m.name}</TableCell>
                                    <TableCell>{m.path}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-2 flex-wrap">
                                        {(m.requiredPermissions || []).length === 0 ? (
                                          <div className="text-xs opacity-60">هیچ</div>
                                        ) : (
                                          (m.requiredPermissions || []).map((rp, idx) => (
                                            <Chip key={idx} size="sm">
                                              {rp}
                                            </Chip>
                                          ))
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardBody>
                        </Card>

                        <Card className={containerCls}>
                          <CardHeader className="font-semibold">
                            سلسله‌مراتب مناطق (درخت ساده)
                          </CardHeader>
                          <Divider />
                          <CardBody>
                            <div className="mb-3 flex gap-2">
                              <Input placeholder="نام گره جدید" size="sm" id="newRegionName" />
                              <Button
                                size="sm"
                                onPress={() => {
                                  const el = document.getElementById("newRegionName");
                                  if (!el) return;
                                  const nm = el.value;
                                  if (!nm.trim()) return alert("نام را وارد کنید");
                                  addHierarchyNode(nm.trim(), null);
                                  el.value = "";
                                }}
                              >
                                افزودن ریشه
                              </Button>
                              <Button size="sm" variant="light" onPress={saveHierarchy}>
                                ذخیره
                              </Button>
                            </div>

                            <div className="text-sm mb-2 opacity-70">
                              برای افزودن فرزند یا ویرایش از دکمه‌های کنار هر گره استفاده کنید.
                            </div>

                            <div className="max-h-96 overflow-auto pr-2">
                              <HierarchyTree nodesFlat={hierarchy.nodes} parent={null} />
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    </Tab> */}

                    {/* Monitor */}
                    <Tab key="monitor" title="تنظیمات چیدمان">
                      <Card className="p-3">
                        <CardHeader className="font-semibold">چیدمان</CardHeader>
                        <Divider />
                        <CardBody className="flex flex-col gap-4">
                          {/* SelectBox */}

                          <Select
                            label="انتخاب چیدمان"
                            placeholder={loading ? "در حال بارگذاری..." : "انتخاب کنید"}
                            selectedKeys={selected ? [selected] : []}
                            onChange={(e) => setSelected(e.target.value)}
                            // disabled={loading}
                          >
                            {layouts.map((layout) => (
                              <SelectItem key={layout.id} value={layout.id}>
                                {layout.label}
                              </SelectItem>
                            ))}
                          </Select>

                          {/* دکمه ثبت */}
                          <Button
                            color="primary"
                            onPress={handleSave}
                            isLoading={saving}
                            disabled={!selected || saving}
                          >
                            ثبت چیدمان
                          </Button>
                        </CardBody>
                      </Card>
                    </Tab>

                    {/* Logs */}
                    {/* <Tab key="logs" title="لاگ‌ها">
                      <Card className={containerCls}>
                        <CardHeader className="font-semibold">
                          لاگ‌های امنیتی (آخرین رویدادها)
                        </CardHeader>
                        <Divider />
                        <CardBody>
                          <Table aria-label="logs table" shadow="none">
                            <TableHeader>
                              <TableColumn>کاربر</TableColumn>
                              <TableColumn>اقدام</TableColumn>
                              <TableColumn>زمان</TableColumn>
                            </TableHeader>
                            <TableBody emptyContent="لاگی موجود نیست">
                              <TableRow key="1">
                                <TableCell>ali</TableCell>
                                <TableCell>ورود موفق</TableCell>
                                <TableCell>۱۴۰۴/۰۵/۱۰ - ۱۲:۳۰</TableCell>
                              </TableRow>
                              <TableRow key="2">
                                <TableCell>sara</TableCell>
                                <TableCell>تغییر نقش کاربر x</TableCell>
                                <TableCell>۱۴۰۴/۰۵/۱۰ - ۱۲:۴۵</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardBody>
                      </Card>
                    </Tab> */}
                  </Tabs>
                )}
              </ModalBody>

              <ModalFooter>
                <div className="w-full flex justify-between items-center">
                  <div className="text-xs opacity-60">1.0v</div>
                  <div className="flex gap-2">
                    <Button color="danger" variant="light" onPress={onClose}>
                      بستن
                    </Button>
                  </div>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
