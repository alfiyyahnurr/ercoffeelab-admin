import React, { useState, useMemo, useCallback } from "react";
import {
    LayoutDashboard,
    Coffee,
    Tags,
    Store,
    Ticket,
    Gift,
    Search,
    Plus,
    Pencil,
    Trash2,
    X,
    Star,
    ArrowUpDown,
    MapPin,
    Clock,
    Sparkles,
    Award,
    CheckCircle2,
    AlertTriangle,
    ChevronDown,
    Package,
    TrendingUp,
    TrendingDown,
    Building2,
    PanelLeftClose,
    PanelLeftOpen,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    KeyRound,
    LogOut,
    ChevronRight,
    UserCog,
    Globe,
    AppWindow,
    BadgeCheck,
} from "lucide-react";

/* ============================================================================
   ER COFFEE LAB — ADMIN PANEL (CMS)
   Single-file interactive TSX artifact. Desktop admin layout: sidebar + content.
   All data lives in React state for this session (no backend, no localStorage).
   ========================================================================== */

/* -------------------------------- Brand tokens -------------------------------- */
const NAVY = "#181F4B";
const NAVY_DEEP = "#0E1230";
const NAVY_SOFT = "#3B4B8C";
const GOLD = "#C9A876";
const CREAM = "#F6F3EC";
const MIST = "#F4F5F9";
const LINE = "#E7E8F0";
const INK_2 = "#6B7088";
const GREEN = "#3E8A5A";
const RED = "#C9576B";

/* -------------------------------- Types -------------------------------- */
type ProductType = "beverage" | "food";

type Product = {
    id: string | number;
    name: string;
    category: string;
    type: ProductType;
    price: number;
    desc: string;
    gradient: [string, string];
    bestseller?: boolean;
    isNew?: boolean;
    rating: number;
    ratingCount: number;
};

type Category = { name: string; type: ProductType };

type Outlet = {
    id: string | number;
    name: string;
    address: string;
    open: boolean;
    hours: string;
    latitude?: number;
    longitude?: number;
};

type VoucherPack = {
    id: string | number;
    title: string;
    description: string;
    originalValue: number;
    price: number;
    savePercent: number;
    voucherCount: number;
};

type Reward = {
    id: string | number;
    name: string;
    pointCost: number;
    description: string;
};

type ModuleKey = "dashboard" | "products" | "categories" | "outlets" | "vouchers" | "rewards";

type UserRole = "superadmin" | "outlet";
type AuthMode = "login" | "register";

/* Mock unique code required to register as super_admin (demo only). */
const SUPERADMIN_UNIQUE_CODE = "ERLAB-SA-2025";

/* -------------------------------- Helpers -------------------------------- */
const formatRupiah = (n: number) => "Rp" + Math.max(0, Math.round(n || 0)).toLocaleString("id-ID");

const getCategoryGradient = (category: string, name = ""): [string, string] => {
    const cat = (category || "").toLowerCase();
    const n = name.toLowerCase();
    if (n.includes("matcha")) return ["#4B6350", "#8CAE8A"];
    if (n.includes("chocolate")) return ["#4A3226", "#8A5A3E"];
    if (n.includes("taro")) return ["#5A3E6E", "#9C7FC9"];
    if (n.includes("yuzu") || n.includes("lychee")) return [GOLD, "#E8D5B0"];
    if (n.includes("strawberry")) return ["#B85C6B", "#E8A0A8"];
    if (n.includes("aren")) return [NAVY, "#7A5C3E"];
    if (cat.includes("coffee")) return [NAVY, NAVY_SOFT];
    if (cat.includes("milk")) return ["#3B4B8C", "#6B7FC9"];
    if (cat.includes("fruit")) return [GOLD, "#E8D5B0"];
    if (cat.includes("tea")) return ["#5A4632", "#8A6E4E"];
    if (
        cat.includes("food") ||
        cat.includes("pastry") ||
        cat.includes("lite") ||
        cat.includes("pasta") ||
        cat.includes("indonesian") ||
        cat.includes("rice") ||
        cat.includes("meat") ||
        cat.includes("soup") ||
        cat.includes("salad")
    )
        return ["#8A7A3E", "#D6C97A"];
    return [NAVY, NAVY_SOFT];
};

let idCounter = 1000;
const nextId = () => ++idCounter;

/* -------------------------------- Seed data -------------------------------- */
const initialCategories: Category[] = [
    { name: "Coffee", type: "beverage" },
    { name: "Milk Based", type: "beverage" },
    { name: "Fruit Based", type: "beverage" },
    { name: "Tea", type: "beverage" },
    { name: "Others", type: "beverage" },
    { name: "Lite Bite", type: "food" },
    { name: "Soup", type: "food" },
    { name: "Pasta", type: "food" },
    { name: "Indonesian", type: "food" },
    { name: "Rice Bowl", type: "food" },
    { name: "Meat", type: "food" },
    { name: "Pastry", type: "food" },
    { name: "Salad", type: "food" },
    { name: "Add On", type: "food" },
];

const rawProducts: Omit<Product, "gradient">[] = [
    { id: 1, name: "Americano", category: "Coffee", type: "beverage", price: 22000, desc: "Bold double-shot espresso, slow-poured over water for a clean, smooth finish.", bestseller: true, isNew: false, rating: 4.8, ratingCount: 312 },
    { id: 2, name: "Cafe Latte", category: "Coffee", type: "beverage", price: 28000, desc: "Espresso balanced with silky steamed milk and a whisper of microfoam.", bestseller: true, isNew: false, rating: 4.9, ratingCount: 480 },
    { id: 3, name: "Kopi Susu Gula Aren", category: "Coffee", type: "beverage", price: 25000, desc: "House signature: robust coffee, fresh milk, and real palm sugar.", bestseller: true, isNew: false, rating: 4.9, ratingCount: 560 },
    { id: 4, name: "Matcha Latte", category: "Milk Based", type: "beverage", price: 30000, desc: "Ceremonial-grade matcha whisked with fresh milk for a smooth, earthy cup.", bestseller: true, isNew: false, rating: 4.8, ratingCount: 276 },
    { id: 5, name: "Taro Milk", category: "Milk Based", type: "beverage", price: 27000, desc: "Creamy taro blended with fresh milk, lightly sweet and nutty.", bestseller: false, isNew: true, rating: 4.6, ratingCount: 98 },
    { id: 6, name: "Yuzu Tea", category: "Fruit Based", type: "beverage", price: 24000, desc: "Bright citrus yuzu steeped with black tea, served over ice.", bestseller: false, isNew: true, rating: 4.5, ratingCount: 64 },
    { id: 7, name: "Lychee Fizz", category: "Fruit Based", type: "beverage", price: 23000, desc: "Sparkling lychee soda with a splash of lime.", bestseller: false, isNew: false, rating: 4.4, ratingCount: 51 },
    { id: 8, name: "Thai Tea", category: "Tea", type: "beverage", price: 22000, desc: "Classic Thai-style black tea with condensed milk.", bestseller: false, isNew: false, rating: 4.6, ratingCount: 140 },
    { id: 9, name: "Nasi Goreng ER Lab", category: "Indonesian", type: "food", price: 32000, desc: "House fried rice with shredded chicken, egg, and pickles on the side.", bestseller: true, isNew: false, rating: 4.8, ratingCount: 244 },
    { id: 10, name: "Butter Croissant", category: "Pastry", type: "food", price: 22000, desc: "Flaky, all-butter croissant baked fresh every morning.", bestseller: false, isNew: false, rating: 4.7, ratingCount: 140 },
    { id: 11, name: "Chicken Pesto Pasta", category: "Pasta", type: "food", price: 38000, desc: "Fettuccine tossed in basil pesto with grilled chicken strips.", bestseller: false, isNew: true, rating: 4.5, ratingCount: 39 },
    { id: 12, name: "Beef Rice Bowl", category: "Rice Bowl", type: "food", price: 36000, desc: "Sliced beef, sautéed vegetables, and steamed rice with house sauce.", bestseller: false, isNew: false, rating: 4.6, ratingCount: 87 },
];

const initialProducts: Product[] = rawProducts.map((p) => ({
    ...p,
    gradient: getCategoryGradient(p.category, p.name),
}));

const initialOutlets: Outlet[] = [
    { id: 1, name: "ER Coffee Lab Summarecon", address: "Jl. Summarecon Raya No. 8, Bekasi", open: true, hours: "07.00 – 22.00", latitude: -6.2412, longitude: 106.9878 },
    { id: 2, name: "ER Coffee Lab Soekarno Hatta", address: "Jl. Soekarno Hatta No. 45, Bandung", open: true, hours: "07.00 – 22.00", latitude: -6.9344, longitude: 107.6871 },
    { id: 3, name: "ER Coffee Lab Turangga", address: "Jl. Turangga No. 12, Bandung", open: true, hours: "08.00 – 21.00", latitude: -6.9339, longitude: 107.6222 },
    { id: 4, name: "ER Coffee Lab Cianjur", address: "Jl. Raya Cianjur No. 3, Cianjur", open: false, hours: "08.00 – 20.00", latitude: -6.8168, longitude: 107.1425 },
];

const initialVoucherPacks: VoucherPack[] = [
    { id: 1, title: "Paket Hemat Rp10.500", description: "3 voucher diskon Rp10.000 untuk pembelian minimum Rp30.000.", originalValue: 30000, price: 10500, savePercent: 65, voucherCount: 3 },
    { id: 2, title: "Paket Ngopi Seru", description: "5 voucher gratis ongkos kirim untuk order Delivery berikutnya.", originalValue: 50000, price: 15000, savePercent: 70, voucherCount: 5 },
    { id: 3, title: "Paket Sultan Sobat Lab", description: "2 voucher gratis upgrade Size Large untuk minuman favoritmu.", originalValue: 20000, price: 5000, savePercent: 75, voucherCount: 2 },
];

const initialRewards: Reward[] = [
    { id: 1, name: "Free Coffee", pointCost: 500, description: "Tukar poin dengan satu minuman kopi gratis." },
    { id: 2, name: "20% Off Any Food", pointCost: 300, description: "Diskon 20% untuk semua menu makanan." },
    { id: 3, name: "Free Size Upgrade", pointCost: 150, description: "Upgrade gratis ke Size Large untuk minuman apa saja." },
];

/* -------------------------------- Small UI atoms -------------------------------- */

function IconBadge({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: MIST, color: NAVY }}
        >
            {children}
        </div>
    );
}

function Toast({ message, tone }: { message: string; tone: "success" | "error" }) {
    return (
        <div
            className="flex items-center gap-2 rounded-full px-4 py-2.5 shadow-[0_8px_24px_rgba(14,18,48,0.25)] animate-[fadeUp_0.25s_ease_both]"
            style={{ background: NAVY, color: "white" }}
        >
            {tone === "success" ? (
                <CheckCircle2 size={16} color={GOLD} />
            ) : (
                <AlertTriangle size={16} color="#E8A0A8" />
            )}
            <span className="text-[13px] font-medium">{message}</span>
        </div>
    );
}

function PrimaryButton({
    onClick,
    children,
    icon,
    full,
    type = "button",
}: {
    onClick?: () => void;
    children: React.ReactNode;
    icon?: React.ReactNode;
    full?: boolean;
    type?: "button" | "submit";
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98] ${full ? "w-full" : ""
                }`}
            style={{ background: NAVY }}
        >
            {icon}
            {children}
        </button>
    );
}

function GhostButton({
    onClick,
    children,
    icon,
    danger,
}: {
    onClick?: () => void;
    children: React.ReactNode;
    icon?: React.ReactNode;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.98]"
            style={{
                background: danger ? "rgba(201,87,107,0.08)" : MIST,
                color: danger ? RED : NAVY,
            }}
        >
            {icon}
            {children}
        </button>
    );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={`rounded-2xl bg-white p-4 ${className}`}
            style={{ border: `1px solid ${LINE}`, boxShadow: "0 2px 10px rgba(24,31,75,0.05)" }}
        >
            {children}
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: NAVY }}>
            {children}
        </label>
    );
}

const inputBase =
    "w-full rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none transition focus:ring-2";
function inputStyle(hasError?: boolean) {
    return {
        background: MIST,
        border: `1px solid ${hasError ? RED : LINE}`,
        color: NAVY,
    } as React.CSSProperties;
}

/* -------------------------------- Drawer (slide-over) -------------------------------- */
function Drawer({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="absolute inset-0 bg-black/30 animate-[fadeIn_0.15s_ease_both]"
                onClick={onClose}
            />
            <div
                className="relative flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl animate-[slideIn_0.2s_ease_both]"
            >
                <div
                    className="flex items-center justify-between px-6 py-5"
                    style={{ borderBottom: `1px solid ${LINE}` }}
                >
                    <h2 className="font-serif text-[18px] font-semibold" style={{ color: NAVY }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{ background: MIST, color: NAVY }}
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

/* -------------------------------- Confirm dialog -------------------------------- */
function ConfirmDialog({
    open,
    title,
    message,
    onCancel,
    onConfirm,
}: {
    open: boolean;
    title: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/35" onClick={onCancel} />
            <div className="relative w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl">
                <div
                    className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: "rgba(201,87,107,0.1)" }}
                >
                    <AlertTriangle size={20} color={RED} />
                </div>
                <h3 className="font-serif text-[16px] font-semibold" style={{ color: NAVY }}>
                    {title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: INK_2 }}>
                    {message}
                </p>
                <div className="mt-5 flex gap-2.5">
                    <GhostButton onClick={onCancel}>Batal</GhostButton>
                    <button
                        onClick={onConfirm}
                        className="flex-1 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98]"
                        style={{ background: RED }}
                    >
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================================
   AUTH — Login / Register (email+password, SSO with role, superadmin code gate)
   Purely presentational + client-side mock validation. No backend calls.
   ========================================================================== */

function AuthField({
    icon,
    type = "text",
    value,
    onChange,
    placeholder,
    error,
    toggle,
    onToggle,
    autoComplete,
}: {
    icon: React.ReactNode;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    error?: string;
    toggle?: React.ReactNode;
    onToggle?: () => void;
    autoComplete?: string;
}) {
    return (
        <div>
            <div className="relative">
                <span
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: INK_2 }}
                >
                    {icon}
                </span>
                <input
                    type={type}
                    value={value}
                    autoComplete={autoComplete}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`${inputBase} pl-10 ${toggle ? "pr-10" : ""}`}
                    style={inputStyle(!!error)}
                />
                {toggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                        style={{ color: INK_2 }}
                    >
                        {toggle}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                    {error}
                </p>
            )}
        </div>
    );
}

function RoleOptionCard({
    active,
    icon,
    title,
    description,
    onClick,
}: {
    active: boolean;
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="relative flex flex-1 flex-col items-start gap-2 rounded-xl px-3.5 py-3 text-left transition active:scale-[0.98]"
            style={{
                background: active ? "rgba(24,31,75,0.05)" : MIST,
                border: `1.5px solid ${active ? NAVY : LINE}`,
            }}
        >
            {active && (
                <span
                    className="absolute right-2.5 top-2.5 flex h-[18px] w-[18px] items-center justify-center rounded-full"
                    style={{ background: NAVY }}
                >
                    <BadgeCheck size={12} color={GOLD} />
                </span>
            )}
            <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: active ? NAVY : "white", color: active ? GOLD : NAVY }}
            >
                {icon}
            </span>
            <div>
                <p className="text-[13px] font-semibold" style={{ color: NAVY }}>
                    {title}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug" style={{ color: INK_2 }}>
                    {description}
                </p>
            </div>
        </button>
    );
}

function RoleSegment({ value, onChange }: { value: UserRole; onChange: (r: UserRole) => void }) {
    const opts: { key: UserRole; label: string; icon: React.ReactNode }[] = [
        { key: "superadmin", label: "Super Admin", icon: <ShieldCheck size={13} /> },
        { key: "outlet", label: "Outlet", icon: <Store size={13} /> },
    ];
    return (
        <div className="flex rounded-xl p-1" style={{ background: MIST }}>
            {opts.map((o) => {
                const active = value === o.key;
                return (
                    <button
                        key={o.key}
                        type="button"
                        onClick={() => onChange(o.key)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-semibold transition"
                        style={{
                            background: active ? "white" : "transparent",
                            color: active ? NAVY : INK_2,
                            boxShadow: active ? "0 1px 4px rgba(24,31,75,0.12)" : "none",
                        }}
                    >
                        {o.icon}
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

function SsoButton({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-semibold transition active:scale-[0.98]"
            style={{ background: "white", border: `1px solid ${LINE}`, color: NAVY }}
        >
            {icon}
            {label}
        </button>
    );
}

function AuthBrandPanel({ mode }: { mode: AuthMode }) {
    const points: { icon: React.ReactNode; text: string }[] = [
        { icon: <Coffee size={14} />, text: "Kelola menu, kategori & harga real-time" },
        { icon: <Store size={14} />, text: "Pantau seluruh outlet dalam satu dashboard" },
        { icon: <Ticket size={14} />, text: "Atur voucher & rewards member dengan mudah" },
    ];
    return (
        <div
            className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden px-8 py-9 sm:flex"
            style={{ background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)` }}
        >
            <div
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
                style={{ background: "rgba(201,168,118,0.12)" }}
            />
            <div
                className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full"
                style={{ background: "rgba(255,255,255,0.04)" }}
            />
            <div className="relative">
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: "rgba(201,168,118,0.18)" }}
                    >
                        <Coffee size={19} color={GOLD} />
                    </div>
                    <div>
                        <p className="font-serif text-[15px] font-semibold leading-tight text-white">ER Coffee Lab</p>
                        <p className="text-[10.5px] font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
                            ADMIN PANEL
                        </p>
                    </div>
                </div>
                <h2 className="mt-9 font-serif text-[21px] font-semibold leading-snug text-white">
                    {mode === "login"
                        ? "Selamat datang kembali di dapur digital ER Lab."
                        : "Satu akun untuk mengelola seluruh operasional ER Lab."}
                </h2>
                <p className="mt-2.5 text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {mode === "login"
                        ? "Masuk untuk mengelola menu, outlet, voucher, dan rewards dari satu panel admin yang sama."
                        : "Pilih peran yang sesuai, super admin butuh kode registrasi khusus agar akses tetap terjaga."}
                </p>
            </div>
            <div className="relative flex flex-col gap-3">
                {points.map((p, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                        <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: "rgba(255,255,255,0.08)", color: GOLD }}
                        >
                            {p.icon}
                        </span>
                        <span className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.72)" }}>
                            {p.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LoginScreen({
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    errors,
    onSubmit,
    ssoRole,
    setSsoRole,
    onSso,
    onSwitchToRegister,
}: {
    email: string;
    setEmail: (v: string) => void;
    password: string;
    setPassword: (v: string) => void;
    showPassword: boolean;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    errors: Record<string, string>;
    onSubmit: () => void;
    ssoRole: UserRole;
    setSsoRole: (r: UserRole) => void;
    onSso: (provider: "Google" | "Microsoft") => void;
    onSwitchToRegister: () => void;
}) {
    return (
        <div className="flex h-full w-full">
            <AuthBrandPanel mode="login" />
            <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8 sm:px-10">
                <div className="w-full max-w-[360px] animate-[fadeUp_0.25s_ease_both]">
                    <h1 className="font-serif text-[20px] font-semibold" style={{ color: NAVY }}>
                        Masuk ke Admin Panel
                    </h1>
                    <p className="mt-1 text-[12.5px]" style={{ color: INK_2 }}>
                        Gunakan email &amp; password akun admin ER Coffee Lab kamu.
                    </p>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                        className="mt-6 flex flex-col gap-3.5"
                    >
                        <div>
                            <FieldLabel>Email</FieldLabel>
                            <AuthField
                                icon={<Mail size={15} />}
                                type="email"
                                value={email}
                                onChange={setEmail}
                                placeholder="nama@ercoffeelab.com"
                                error={errors.email}
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <FieldLabel>Password</FieldLabel>
                            <AuthField
                                icon={<Lock size={15} />}
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={setPassword}
                                placeholder="Masukkan password"
                                error={errors.password}
                                toggle={showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                onToggle={() => setShowPassword((s) => !s)}
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-[11.5px]" style={{ color: INK_2 }}>
                                <input type="checkbox" className="h-3.5 w-3.5 rounded" style={{ accentColor: NAVY }} />
                                Ingat saya
                            </label>
                            <button type="button" className="text-[11.5px] font-semibold" style={{ color: NAVY }}>
                                Lupa password?
                            </button>
                        </div>

                        <PrimaryButton type="submit" full icon={<ChevronRight size={16} />}>
                            Masuk
                        </PrimaryButton>
                    </form>

                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1" style={{ background: LINE }} />
                        <span className="text-[11px] font-medium" style={{ color: INK_2 }}>
                            atau masuk dengan SSO
                        </span>
                        <div className="h-px flex-1" style={{ background: LINE }} />
                    </div>

                    <div>
                        <FieldLabel>Masuk sebagai</FieldLabel>
                        <RoleSegment value={ssoRole} onChange={setSsoRole} />
                        <div className="mt-3 flex gap-2.5">
                            <SsoButton icon={<Globe size={15} />} label="Google" onClick={() => onSso("Google")} />
                            <SsoButton icon={<AppWindow size={15} />} label="Microsoft" onClick={() => onSso("Microsoft")} />
                        </div>
                    </div>

                    <p className="mt-7 text-center text-[12.5px]" style={{ color: INK_2 }}>
                        Belum punya akun?{" "}
                        <button type="button" onClick={onSwitchToRegister} className="font-semibold" style={{ color: NAVY }}>
                            Daftar di sini
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

function RegisterScreen({
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    role,
    setRole,
    superadminCode,
    setSuperadminCode,
    errors,
    onSubmit,
    onSwitchToLogin,
}: {
    name: string;
    setName: (v: string) => void;
    email: string;
    setEmail: (v: string) => void;
    password: string;
    setPassword: (v: string) => void;
    confirmPassword: string;
    setConfirmPassword: (v: string) => void;
    showPassword: boolean;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    showConfirm: boolean;
    setShowConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    role: UserRole;
    setRole: (r: UserRole) => void;
    superadminCode: string;
    setSuperadminCode: (v: string) => void;
    errors: Record<string, string>;
    onSubmit: () => void;
    onSwitchToLogin: () => void;
}) {
    return (
        <div className="flex h-full w-full">
            <AuthBrandPanel mode="register" />
            <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8 sm:px-10">
                <div className="w-full max-w-[380px] animate-[fadeUp_0.25s_ease_both]">
                    <h1 className="font-serif text-[20px] font-semibold" style={{ color: NAVY }}>
                        Buat Akun Admin
                    </h1>
                    <p className="mt-1 text-[12.5px]" style={{ color: INK_2 }}>
                        Daftar sebagai Super Admin atau Admin Outlet.
                    </p>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                        className="mt-6 flex flex-col gap-3.5"
                    >
                        <div>
                            <FieldLabel>Daftar sebagai</FieldLabel>
                            <div className="flex gap-2.5">
                                <RoleOptionCard
                                    active={role === "superadmin"}
                                    icon={<ShieldCheck size={16} />}
                                    title="Super Admin"
                                    description="Akses penuh ke semua outlet & pengaturan"
                                    onClick={() => setRole("superadmin")}
                                />
                                <RoleOptionCard
                                    active={role === "outlet"}
                                    icon={<Store size={16} />}
                                    title="Outlet"
                                    description="Kelola satu outlet yang ditugaskan"
                                    onClick={() => setRole("outlet")}
                                />
                            </div>
                        </div>

                        {role === "superadmin" && (
                            <div className="animate-[fadeUp_0.2s_ease_both]">
                                <FieldLabel>Kode Unik Super Admin</FieldLabel>
                                <AuthField
                                    icon={<KeyRound size={15} />}
                                    value={superadminCode}
                                    onChange={setSuperadminCode}
                                    placeholder="Masukkan kode registrasi"
                                    error={errors.superadminCode}
                                />
                                <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug" style={{ color: INK_2 }}>
                                    <ShieldCheck size={12} className="mt-[1px] shrink-0" />
                                    Kode ini hanya dibagikan oleh pemilik lembaga/owner, supaya akses super admin tidak sembarangan.
                                </p>
                            </div>
                        )}

                        <div>
                            <FieldLabel>Nama Lengkap</FieldLabel>
                            <AuthField
                                icon={<UserCog size={15} />}
                                value={name}
                                onChange={setName}
                                placeholder="Nama sesuai identitas"
                                error={errors.name}
                            />
                        </div>
                        <div>
                            <FieldLabel>Email</FieldLabel>
                            <AuthField
                                icon={<Mail size={15} />}
                                type="email"
                                value={email}
                                onChange={setEmail}
                                placeholder="nama@ercoffeelab.com"
                                error={errors.email}
                                autoComplete="email"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <FieldLabel>Password</FieldLabel>
                                <AuthField
                                    icon={<Lock size={15} />}
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={setPassword}
                                    placeholder="Min. 8 karakter"
                                    error={errors.password}
                                    toggle={showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    onToggle={() => setShowPassword((s) => !s)}
                                    autoComplete="new-password"
                                />
                            </div>
                            <div>
                                <FieldLabel>Konfirmasi</FieldLabel>
                                <AuthField
                                    icon={<Lock size={15} />}
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={setConfirmPassword}
                                    placeholder="Ulangi password"
                                    error={errors.confirmPassword}
                                    toggle={showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                                    onToggle={() => setShowConfirm((s) => !s)}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <PrimaryButton type="submit" full icon={<ChevronRight size={16} />}>
                            Daftar
                        </PrimaryButton>
                    </form>

                    <p className="mt-6 text-center text-[12.5px]" style={{ color: INK_2 }}>
                        Sudah punya akun?{" "}
                        <button type="button" onClick={onSwitchToLogin} className="font-semibold" style={{ color: NAVY }}>
                            Masuk di sini
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ============================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function ERCoffeeLabAdmin() {
    /* ==================== AUTH (login / register) ==================== */
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>("login");
    const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: UserRole } | null>(null);

    // Login form
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
    const [ssoRole, setSsoRole] = useState<UserRole>("outlet");

    // Register form
    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regConfirmPassword, setRegConfirmPassword] = useState("");
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showRegConfirm, setShowRegConfirm] = useState(false);
    const [regRole, setRegRole] = useState<UserRole>("outlet");
    const [regSuperadminCode, setRegSuperadminCode] = useState("");
    const [regErrors, setRegErrors] = useState<Record<string, string>>({});

    const resetAuthForms = () => {
        setLoginEmail("");
        setLoginPassword("");
        setShowLoginPassword(false);
        setLoginErrors({});
        setSsoRole("outlet");
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setRegConfirmPassword("");
        setShowRegPassword(false);
        setShowRegConfirm(false);
        setRegRole("outlet");
        setRegSuperadminCode("");
        setRegErrors({});
    };

    const roleLabel = (r: UserRole) => (r === "superadmin" ? "Super Admin" : "Admin Outlet");

    const handleLogin = () => {
        const errs: Record<string, string> = {};
        if (!loginEmail.trim()) errs.email = "Email wajib diisi";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) errs.email = "Format email tidak valid";
        if (!loginPassword) errs.password = "Password wajib diisi";
        else if (loginPassword.length < 6) errs.password = "Password minimal 6 karakter";
        setLoginErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setCurrentUser({ name: loginEmail.split("@")[0] || "Admin", email: loginEmail.trim(), role: "superadmin" });
        setIsAuthenticated(true);
        pushToast(`Selamat datang kembali, ${loginEmail.split("@")[0]}!`);
    };

    const handleSsoLogin = (provider: "Google" | "Microsoft") => {
        setCurrentUser({ name: `${roleLabel(ssoRole)} (${provider})`, email: `sso@${provider.toLowerCase()}.com`, role: ssoRole });
        setIsAuthenticated(true);
        pushToast(`Berhasil masuk via ${provider} SSO sebagai ${roleLabel(ssoRole)}`);
    };

    const handleRegister = () => {
        const errs: Record<string, string> = {};
        if (!regName.trim()) errs.name = "Nama wajib diisi";
        if (!regEmail.trim()) errs.email = "Email wajib diisi";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) errs.email = "Format email tidak valid";
        if (!regPassword) errs.password = "Password wajib diisi";
        else if (regPassword.length < 6) errs.password = "Password minimal 6 karakter";
        if (regConfirmPassword !== regPassword) errs.confirmPassword = "Konfirmasi password tidak cocok";
        if (regRole === "superadmin") {
            if (!regSuperadminCode.trim()) errs.superadminCode = "Kode unik super admin wajib diisi";
            else if (regSuperadminCode.trim() !== SUPERADMIN_UNIQUE_CODE)
                errs.superadminCode = "Kode unik tidak valid, hubungi pemilik lembaga";
        }
        setRegErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setCurrentUser({ name: regName.trim(), email: regEmail.trim(), role: regRole });
        setIsAuthenticated(true);
        pushToast(`Akun ${roleLabel(regRole)} berhasil dibuat. Selamat datang, ${regName.trim()}!`);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setAuthMode("login");
        resetAuthForms();
    };

    /* ---- Core data state ---- */
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [outlets, setOutlets] = useState<Outlet[]>(initialOutlets);
    const [voucherPacks, setVoucherPacks] = useState<VoucherPack[]>(initialVoucherPacks);
    const [rewards, setRewards] = useState<Reward[]>(initialRewards);

    /* ---- Navigation ---- */
    const [activeModule, setActiveModule] = useState<ModuleKey>("dashboard");
    const [dashboardQuery, setDashboardQuery] = useState("");
    const [dashboardPeriod, setDashboardPeriod] = useState("Bulan ini");

    /* ---- Sidebar: visible by default on every screen, only toggled by its own button ---- */
    const [sidebarOpen, setSidebarOpen] = useState(true);

    /* ---- Toasts ---- */
    const [toasts, setToasts] = useState<{ id: number; message: string; tone: "success" | "error" }[]>([]);
    const pushToast = useCallback((message: string, tone: "success" | "error" = "success") => {
        const id = nextId();
        setToasts((t) => [...t, { id, message, tone }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
    }, []);

    /* ---- Confirm-delete state (generic) ---- */
    const [confirmState, setConfirmState] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    /* ==================== PRODUCTS ==================== */
    const [productSearch, setProductSearch] = useState("");
    const [productCategoryFilter, setProductCategoryFilter] = useState<string>("all");
    const [productTypeFilter, setProductTypeFilter] = useState<"all" | ProductType>("all");
    const [productSort, setProductSort] = useState<{ key: "name" | "price" | "rating"; dir: "asc" | "desc" }>({
        key: "name",
        dir: "asc",
    });
    const [productDrawerOpen, setProductDrawerOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState({
        name: "",
        type: "beverage" as ProductType,
        category: categories.find((c) => c.type === "beverage")?.name || "",
        price: "",
        desc: "",
        rating: "4.5",
    });
    const [productFormErrors, setProductFormErrors] = useState<Record<string, string>>({});

    const openAddProduct = () => {
        setEditingProduct(null);
        setProductForm({
            name: "",
            type: "beverage",
            category: categories.find((c) => c.type === "beverage")?.name || "",
            price: "",
            desc: "",
            rating: "4.5",
        });
        setProductFormErrors({});
        setProductDrawerOpen(true);
    };

    const openEditProduct = (p: Product) => {
        setEditingProduct(p);
        setProductForm({
            name: p.name,
            type: p.type,
            category: p.category,
            price: String(p.price),
            desc: p.desc,
            rating: String(p.rating),
        });
        setProductFormErrors({});
        setProductDrawerOpen(true);
    };

    const validateProductForm = () => {
        const errs: Record<string, string> = {};
        if (!productForm.name.trim()) errs.name = "Nama produk wajib diisi";
        if (!productForm.category) errs.category = "Kategori wajib dipilih";
        const priceNum = Number(productForm.price);
        if (!productForm.price || isNaN(priceNum) || priceNum <= 0)
            errs.price = "Harga harus berupa angka positif";
        const ratingNum = Number(productForm.rating);
        if (productForm.rating && (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5))
            errs.rating = "Rating harus antara 0 dan 5";
        setProductFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleAddProduct = () => {
        if (!validateProductForm()) return;
        const priceNum = Number(productForm.price);
        const newProduct: Product = {
            id: nextId(),
            name: productForm.name.trim(),
            category: productForm.category,
            type: productForm.type,
            price: priceNum,
            desc: productForm.desc.trim(),
            gradient: getCategoryGradient(productForm.category, productForm.name),
            bestseller: false,
            isNew: true,
            rating: Number(productForm.rating) || 0,
            ratingCount: 0,
        };
        setProducts((prev) => [newProduct, ...prev]);
        setProductDrawerOpen(false);
        pushToast(`"${newProduct.name}" ditambahkan ke menu`);
    };

    const handleUpdateProduct = () => {
        if (!editingProduct) return;
        if (!validateProductForm()) return;
        const priceNum = Number(productForm.price);
        setProducts((prev) =>
            prev.map((p) =>
                p.id === editingProduct.id
                    ? {
                        ...p,
                        name: productForm.name.trim(),
                        category: productForm.category,
                        type: productForm.type,
                        price: priceNum,
                        desc: productForm.desc.trim(),
                        gradient: getCategoryGradient(productForm.category, productForm.name),
                        rating: Number(productForm.rating) || 0,
                    }
                    : p
            )
        );
        setProductDrawerOpen(false);
        pushToast(`"${productForm.name.trim()}" berhasil diperbarui`);
    };

    const handleDeleteProduct = (p: Product) => {
        setConfirmState({
            title: "Hapus produk?",
            message: `"${p.name}" akan dihapus permanen dari menu. Tindakan ini tidak dapat dibatalkan.`,
            onConfirm: () => {
                setProducts((prev) => prev.filter((x) => x.id !== p.id));
                setConfirmState(null);
                pushToast(`"${p.name}" dihapus dari menu`);
            },
        });
    };

    const toggleBestseller = (p: Product) => {
        setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, bestseller: !x.bestseller } : x)));
    };
    const toggleIsNew = (p: Product) => {
        setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, isNew: !x.isNew } : x)));
    };

    const filteredSortedProducts = useMemo(() => {
        let list = products.filter((p) => {
            const matchSearch =
                !productSearch.trim() ||
                p.name.toLowerCase().includes(productSearch.trim().toLowerCase()) ||
                p.desc.toLowerCase().includes(productSearch.trim().toLowerCase());
            const matchCategory = productCategoryFilter === "all" || p.category === productCategoryFilter;
            const matchType = productTypeFilter === "all" || p.type === productTypeFilter;
            return matchSearch && matchCategory && matchType;
        });
        list = [...list].sort((a, b) => {
            const dir = productSort.dir === "asc" ? 1 : -1;
            if (productSort.key === "name") return a.name.localeCompare(b.name) * dir;
            if (productSort.key === "price") return (a.price - b.price) * dir;
            return (a.rating - b.rating) * dir;
        });
        return list;
    }, [products, productSearch, productCategoryFilter, productTypeFilter, productSort]);

    const toggleSort = (key: "name" | "price" | "rating") => {
        setProductSort((prev) =>
            prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
        );
    };

    /* ==================== CATEGORIES ==================== */
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryType, setNewCategoryType] = useState<ProductType>("beverage");
    const [categoryError, setCategoryError] = useState("");

    const handleAddCategory = () => {
        const name = newCategoryName.trim();
        if (!name) {
            setCategoryError("Nama kategori wajib diisi");
            return;
        }
        if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.type === newCategoryType)) {
            setCategoryError("Kategori dengan nama ini sudah ada");
            return;
        }
        setCategories((prev) => [...prev, { name, type: newCategoryType }]);
        setNewCategoryName("");
        setCategoryError("");
        pushToast(`Kategori "${name}" ditambahkan`);
    };

    const handleDeleteCategory = (cat: Category) => {
        const inUse = products.some((p) => p.category === cat.name);
        if (inUse) {
            pushToast(`Kategori "${cat.name}" masih dipakai produk, tidak bisa dihapus`, "error");
            return;
        }
        setConfirmState({
            title: "Hapus kategori?",
            message: `Kategori "${cat.name}" akan dihapus permanen.`,
            onConfirm: () => {
                setCategories((prev) => prev.filter((c) => !(c.name === cat.name && c.type === cat.type)));
                setConfirmState(null);
                pushToast(`Kategori "${cat.name}" dihapus`);
            },
        });
    };

    /* ==================== OUTLETS ==================== */
    const [outletDrawerOpen, setOutletDrawerOpen] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
    const [outletForm, setOutletForm] = useState({ name: "", address: "", hours: "", open: true });
    const [outletFormErrors, setOutletFormErrors] = useState<Record<string, string>>({});

    const openAddOutlet = () => {
        setEditingOutlet(null);
        setOutletForm({ name: "", address: "", hours: "07.00 – 22.00", open: true });
        setOutletFormErrors({});
        setOutletDrawerOpen(true);
    };

    const openEditOutlet = (o: Outlet) => {
        setEditingOutlet(o);
        setOutletForm({ name: o.name, address: o.address, hours: o.hours, open: o.open });
        setOutletFormErrors({});
        setOutletDrawerOpen(true);
    };

    const validateOutletForm = () => {
        const errs: Record<string, string> = {};
        if (!outletForm.name.trim()) errs.name = "Nama outlet wajib diisi";
        if (!outletForm.address.trim()) errs.address = "Alamat wajib diisi";
        if (!outletForm.hours.trim()) errs.hours = "Jam operasional wajib diisi";
        setOutletFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleAddOutlet = () => {
        if (!validateOutletForm()) return;
        const newOutlet: Outlet = {
            id: nextId(),
            name: outletForm.name.trim(),
            address: outletForm.address.trim(),
            hours: outletForm.hours.trim(),
            open: outletForm.open,
        };
        setOutlets((prev) => [newOutlet, ...prev]);
        setOutletDrawerOpen(false);
        pushToast(`Outlet "${newOutlet.name}" ditambahkan`);
    };

    const handleUpdateOutlet = () => {
        if (!editingOutlet) return;
        if (!validateOutletForm()) return;
        setOutlets((prev) =>
            prev.map((o) =>
                o.id === editingOutlet.id
                    ? { ...o, name: outletForm.name.trim(), address: outletForm.address.trim(), hours: outletForm.hours.trim(), open: outletForm.open }
                    : o
            )
        );
        setOutletDrawerOpen(false);
        pushToast(`Outlet "${outletForm.name.trim()}" diperbarui`);
    };

    const handleDeleteOutlet = (o: Outlet) => {
        setConfirmState({
            title: "Hapus outlet?",
            message: `"${o.name}" akan dihapus permanen dari daftar outlet.`,
            onConfirm: () => {
                setOutlets((prev) => prev.filter((x) => x.id !== o.id));
                setConfirmState(null);
                pushToast(`Outlet "${o.name}" dihapus`);
            },
        });
    };

    const toggleOutletOpen = (o: Outlet) => {
        setOutlets((prev) => prev.map((x) => (x.id === o.id ? { ...x, open: !x.open } : x)));
    };

    /* ==================== VOUCHER PACKS ==================== */
    const [voucherDrawerOpen, setVoucherDrawerOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<VoucherPack | null>(null);
    const [voucherForm, setVoucherForm] = useState({
        title: "",
        description: "",
        originalValue: "",
        price: "",
        voucherCount: "",
    });
    const [voucherFormErrors, setVoucherFormErrors] = useState<Record<string, string>>({});

    const computedSavePercent = useMemo(() => {
        const ov = Number(voucherForm.originalValue);
        const pr = Number(voucherForm.price);
        if (!ov || ov <= 0 || isNaN(pr)) return 0;
        return Math.max(0, Math.round(((ov - pr) / ov) * 100));
    }, [voucherForm.originalValue, voucherForm.price]);

    const openAddVoucher = () => {
        setEditingVoucher(null);
        setVoucherForm({ title: "", description: "", originalValue: "", price: "", voucherCount: "" });
        setVoucherFormErrors({});
        setVoucherDrawerOpen(true);
    };

    const openEditVoucher = (v: VoucherPack) => {
        setEditingVoucher(v);
        setVoucherForm({
            title: v.title,
            description: v.description,
            originalValue: String(v.originalValue),
            price: String(v.price),
            voucherCount: String(v.voucherCount),
        });
        setVoucherFormErrors({});
        setVoucherDrawerOpen(true);
    };

    const validateVoucherForm = () => {
        const errs: Record<string, string> = {};
        if (!voucherForm.title.trim()) errs.title = "Judul paket wajib diisi";
        const ov = Number(voucherForm.originalValue);
        if (!voucherForm.originalValue || isNaN(ov) || ov <= 0) errs.originalValue = "Harga asli harus angka positif";
        const pr = Number(voucherForm.price);
        if (!voucherForm.price || isNaN(pr) || pr <= 0) errs.price = "Harga jual harus angka positif";
        if (!isNaN(ov) && !isNaN(pr) && pr >= ov) errs.price = "Harga jual harus lebih kecil dari harga asli";
        const vc = Number(voucherForm.voucherCount);
        if (!voucherForm.voucherCount || isNaN(vc) || vc <= 0 || !Number.isInteger(vc))
            errs.voucherCount = "Jumlah voucher harus bilangan bulat positif";
        setVoucherFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleAddVoucher = () => {
        if (!validateVoucherForm()) return;
        const newVoucher: VoucherPack = {
            id: nextId(),
            title: voucherForm.title.trim(),
            description: voucherForm.description.trim(),
            originalValue: Number(voucherForm.originalValue),
            price: Number(voucherForm.price),
            savePercent: computedSavePercent,
            voucherCount: Number(voucherForm.voucherCount),
        };
        setVoucherPacks((prev) => [newVoucher, ...prev]);
        setVoucherDrawerOpen(false);
        pushToast(`Paket "${newVoucher.title}" ditambahkan`);
    };

    const handleUpdateVoucher = () => {
        if (!editingVoucher) return;
        if (!validateVoucherForm()) return;
        setVoucherPacks((prev) =>
            prev.map((v) =>
                v.id === editingVoucher.id
                    ? {
                        ...v,
                        title: voucherForm.title.trim(),
                        description: voucherForm.description.trim(),
                        originalValue: Number(voucherForm.originalValue),
                        price: Number(voucherForm.price),
                        savePercent: computedSavePercent,
                        voucherCount: Number(voucherForm.voucherCount),
                    }
                    : v
            )
        );
        setVoucherDrawerOpen(false);
        pushToast(`Paket "${voucherForm.title.trim()}" diperbarui`);
    };

    const handleDeleteVoucher = (v: VoucherPack) => {
        setConfirmState({
            title: "Hapus paket voucher?",
            message: `"${v.title}" akan dihapus permanen.`,
            onConfirm: () => {
                setVoucherPacks((prev) => prev.filter((x) => x.id !== v.id));
                setConfirmState(null);
                pushToast(`Paket "${v.title}" dihapus`);
            },
        });
    };

    /* ==================== REWARDS ==================== */
    const [rewardDrawerOpen, setRewardDrawerOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [rewardForm, setRewardForm] = useState({ name: "", pointCost: "", description: "" });
    const [rewardFormErrors, setRewardFormErrors] = useState<Record<string, string>>({});

    const openAddReward = () => {
        setEditingReward(null);
        setRewardForm({ name: "", pointCost: "", description: "" });
        setRewardFormErrors({});
        setRewardDrawerOpen(true);
    };

    const openEditReward = (r: Reward) => {
        setEditingReward(r);
        setRewardForm({ name: r.name, pointCost: String(r.pointCost), description: r.description });
        setRewardFormErrors({});
        setRewardDrawerOpen(true);
    };

    const validateRewardForm = () => {
        const errs: Record<string, string> = {};
        if (!rewardForm.name.trim()) errs.name = "Nama reward wajib diisi";
        const pc = Number(rewardForm.pointCost);
        if (!rewardForm.pointCost || isNaN(pc) || pc <= 0) errs.pointCost = "Poin harus angka positif";
        setRewardFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleAddReward = () => {
        if (!validateRewardForm()) return;
        const newReward: Reward = {
            id: nextId(),
            name: rewardForm.name.trim(),
            pointCost: Number(rewardForm.pointCost),
            description: rewardForm.description.trim(),
        };
        setRewards((prev) => [newReward, ...prev]);
        setRewardDrawerOpen(false);
        pushToast(`Reward "${newReward.name}" ditambahkan`);
    };

    const handleUpdateReward = () => {
        if (!editingReward) return;
        if (!validateRewardForm()) return;
        setRewards((prev) =>
            prev.map((r) =>
                r.id === editingReward.id
                    ? { ...r, name: rewardForm.name.trim(), pointCost: Number(rewardForm.pointCost), description: rewardForm.description.trim() }
                    : r
            )
        );
        setRewardDrawerOpen(false);
        pushToast(`Reward "${rewardForm.name.trim()}" diperbarui`);
    };

    const handleDeleteReward = (r: Reward) => {
        setConfirmState({
            title: "Hapus reward?",
            message: `"${r.name}" akan dihapus permanen dari daftar reward.`,
            onConfirm: () => {
                setRewards((prev) => prev.filter((x) => x.id !== r.id));
                setConfirmState(null);
                pushToast(`Reward "${r.name}" dihapus`);
            },
        });
    };

    /* ==================== DASHBOARD STATS ==================== */
    const stats = useMemo(() => {
        const totalProducts = products.length;
        const totalOutlets = outlets.length;
        const bestsellerCount = products.filter((p) => p.bestseller).length;
        const avgRating =
            products.length > 0 ? products.reduce((sum, p) => sum + p.rating, 0) / products.length : 0;
        return { totalProducts, totalOutlets, bestsellerCount, avgRating };
    }, [products, outlets]);

    /* -------------------------------- Nav config -------------------------------- */
    const navItems: { key: ModuleKey; label: string; icon: React.ReactNode }[] = [
        { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { key: "products", label: "Menu / Produk", icon: <Coffee size={18} /> },
        { key: "categories", label: "Kategori", icon: <Tags size={18} /> },
        { key: "outlets", label: "Outlet", icon: <Store size={18} /> },
        { key: "vouchers", label: "Voucher Pack", icon: <Ticket size={18} /> },
        { key: "rewards", label: "Rewards", icon: <Gift size={18} /> },
    ];

    const moduleTitleMap: Record<ModuleKey, { title: string; subtitle: string }> = {
        dashboard: { title: "Dashboard", subtitle: "Ringkasan performa aplikasi ER Coffee Lab" },
        products: { title: "Menu / Produk", subtitle: "Kelola daftar menu, harga, dan status produk" },
        categories: { title: "Kategori", subtitle: "Atur kategori minuman dan makanan" },
        outlets: { title: "Outlet", subtitle: "Kelola lokasi dan jam operasional outlet" },
        vouchers: { title: "Voucher Pack", subtitle: "Kelola paket voucher yang tersedia untuk dibeli" },
        rewards: { title: "Rewards", subtitle: "Kelola reward penukaran poin member" },
    };

    const beverageCats = categories.filter((c) => c.type === "beverage");
    const foodCats = categories.filter((c) => c.type === "food");
    const availableCatsForForm = categories.filter((c) => c.type === productForm.type);

    return (
        <div
            className="relative flex h-[78vh] max-h-[720px] min-h-[480px] w-full overflow-hidden rounded-2xl"
            style={{ background: MIST, fontFamily: "'Source Sans 3', sans-serif" }}
        >
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideIn { from { transform: translateX(24px); opacity: 0.6 } to { transform: translateX(0); opacity: 1 } }
        .font-serif { font-family: 'Albert Sans', sans-serif; }
        * { font-family: 'Source Sans 3', sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${LINE}; border-radius: 8px; }
      `}</style>

            {!isAuthenticated ? (
                authMode === "login" ? (
                    <LoginScreen
                        email={loginEmail}
                        setEmail={setLoginEmail}
                        password={loginPassword}
                        setPassword={setLoginPassword}
                        showPassword={showLoginPassword}
                        setShowPassword={setShowLoginPassword}
                        errors={loginErrors}
                        onSubmit={handleLogin}
                        ssoRole={ssoRole}
                        setSsoRole={setSsoRole}
                        onSso={handleSsoLogin}
                        onSwitchToRegister={() => {
                            setAuthMode("register");
                            setLoginErrors({});
                        }}
                    />
                ) : (
                    <RegisterScreen
                        name={regName}
                        setName={setRegName}
                        email={regEmail}
                        setEmail={setRegEmail}
                        password={regPassword}
                        setPassword={setRegPassword}
                        confirmPassword={regConfirmPassword}
                        setConfirmPassword={setRegConfirmPassword}
                        showPassword={showRegPassword}
                        setShowPassword={setShowRegPassword}
                        showConfirm={showRegConfirm}
                        setShowConfirm={setShowRegConfirm}
                        role={regRole}
                        setRole={setRegRole}
                        superadminCode={regSuperadminCode}
                        setSuperadminCode={setRegSuperadminCode}
                        errors={regErrors}
                        onSubmit={handleRegister}
                        onSwitchToLogin={() => {
                            setAuthMode("login");
                            setRegErrors({});
                        }}
                    />
                )
            ) : (
                <>
                    {/* ---------------- Sidebar (always in-flow, only hides when the toggle is clicked) ---------------- */}
                    <aside
                        className={`flex shrink-0 flex-col justify-between overflow-hidden py-5 transition-all duration-300 ease-in-out ${sidebarOpen ? "w-[188px] px-3" : "w-[60px] px-2"
                            }`}
                        style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)` }}
                    >
                        <div className="min-w-0">
                            <div className={`mb-1 flex items-center ${sidebarOpen ? "justify-between px-1" : "justify-center"}`}>
                                <div className="flex min-w-0 items-center gap-2">
                                    <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                        style={{ background: "rgba(201,168,118,0.18)" }}
                                    >
                                        <Coffee size={16} color={GOLD} />
                                    </div>
                                    {sidebarOpen && (
                                        <div className="min-w-0">
                                            <p className="truncate font-serif text-[13.5px] font-semibold leading-tight text-white">ER Coffee Lab</p>
                                            <p className="truncate text-[10px] font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
                                                ADMIN PANEL
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {sidebarOpen && (
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        title="Tutup sidebar"
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition"
                                        style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }}
                                    >
                                        <PanelLeftClose size={14} />
                                    </button>
                                )}
                            </div>

                            {!sidebarOpen && (
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    title="Buka sidebar"
                                    className="mb-6 mt-2 flex w-full items-center justify-center rounded-lg py-2 transition"
                                    style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }}
                                >
                                    <PanelLeftOpen size={16} />
                                </button>
                            )}
                            <div
                                className={`mb-5 flex items-center gap-2.5 rounded-xl ${sidebarOpen ? "px-2.5 py-2.5" : "justify-center py-2"
                                    }`}
                                style={{ background: "rgba(255,255,255,0.06)" }}
                            >
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                                    style={{ background: "rgba(201,168,118,0.22)", color: GOLD }}
                                >
                                    {(currentUser?.name || "A").trim().charAt(0).toUpperCase()}
                                </div>
                                {sidebarOpen && (
                                    <div className="min-w-0">
                                        <p className="truncate text-[12px] font-semibold text-white">{currentUser?.name || "Admin"}</p>
                                        <p className="truncate text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                                            {currentUser ? roleLabel(currentUser.role) : ""}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <nav className="flex flex-col gap-1">
                                {navItems.map((item) => {
                                    const active = activeModule === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => setActiveModule(item.key)}
                                            title={!sidebarOpen ? item.label : undefined}
                                            className={`flex items-center gap-2.5 rounded-xl py-2.5 text-left text-[12.5px] font-medium transition ${sidebarOpen ? "px-2.5" : "justify-center px-0"
                                                }`}
                                            style={{
                                                background: active ? "rgba(255,255,255,0.1)" : "transparent",
                                                color: active ? "white" : "rgba(255,255,255,0.62)",
                                                boxShadow: active ? "0 4px 12px rgba(0,0,0,0.18)" : "none",
                                            }}
                                        >
                                            <span className="shrink-0" style={{ color: active ? GOLD : "rgba(255,255,255,0.55)" }}>
                                                {item.icon}
                                            </span>
                                            {sidebarOpen && <span className="truncate">{item.label}</span>}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="flex flex-col gap-2">
                            {sidebarOpen && (
                                <div
                                    className="rounded-lg px-3 py-3"
                                    style={{ background: "rgba(255,255,255,0.06)" }}
                                >
                                    <p className="text-[10.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                                        Semua perubahan tersimpan selama sesi ini.
                                    </p>
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                title={!sidebarOpen ? "Keluar" : undefined}
                                className={`flex items-center gap-2.5 rounded-lg py-2.5 text-left text-[12.5px] font-medium transition ${sidebarOpen ? "px-2.5" : "justify-center px-0"
                                    }`}
                                style={{ background: "rgba(201,87,107,0.14)", color: "#E8A0A8" }}
                            >
                                <LogOut size={16} className="shrink-0" />
                                {sidebarOpen && <span>Keluar</span>}
                            </button>
                        </div>
                    </aside>

                    {/* ---------------- Content ---------------- */}
                    <main className="min-w-0 flex-1 overflow-y-auto">
                        <header
                            className="sticky top-0 z-10 flex flex-col gap-3 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-8 sm:flex-row sm:items-center sm:justify-between"
                            style={{ borderBottom: `1px solid ${LINE}` }}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="min-w-0">
                                    <h1 className="truncate font-serif text-[15.5px] font-semibold sm:text-[16.5px] lg:text-[17.5px]" style={{ color: NAVY }}>
                                        {moduleTitleMap[activeModule].title}
                                    </h1>
                                    <p className="mt-0.5 truncate text-[11px] sm:text-[12px]" style={{ color: INK_2 }}>
                                        {moduleTitleMap[activeModule].subtitle}
                                    </p>
                                </div>
                            </div>
                            {activeModule === "products" && (
                                <PrimaryButton onClick={openAddProduct} icon={<Plus size={16} />}>
                                    Tambah Produk
                                </PrimaryButton>
                            )}
                            {activeModule === "outlets" && (
                                <PrimaryButton onClick={openAddOutlet} icon={<Plus size={16} />}>
                                    Tambah Outlet
                                </PrimaryButton>
                            )}
                            {activeModule === "vouchers" && (
                                <PrimaryButton onClick={openAddVoucher} icon={<Plus size={16} />}>
                                    Tambah Paket
                                </PrimaryButton>
                            )}
                            {activeModule === "rewards" && (
                                <PrimaryButton onClick={openAddReward} icon={<Plus size={16} />}>
                                    Tambah Reward
                                </PrimaryButton>
                            )}
                        </header>

                        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
                            {/* ==================== DASHBOARD ==================== */}
                            {activeModule === "dashboard" && (
                                <div>
                                    {/* ---- Search & period filter bar ---- */}
                                    <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                                        <div className="relative flex-1">
                                            <Search
                                                size={15}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                                                style={{ color: INK_2 }}
                                            />
                                            <input
                                                value={dashboardQuery}
                                                onChange={(e) => setDashboardQuery(e.target.value)}
                                                placeholder="Cari produk, kategori, atau outlet"
                                                className={`${inputBase} pl-10`}
                                                style={inputStyle()}
                                            />
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={dashboardPeriod}
                                                onChange={(e) => setDashboardPeriod(e.target.value)}
                                                className="w-full appearance-none rounded-xl py-2.5 pl-3.5 pr-9 text-[13px] font-medium outline-none sm:w-[150px]"
                                                style={{ background: "white", border: `1px solid ${LINE}`, color: NAVY }}
                                            >
                                                <option>Hari ini</option>
                                                <option>Minggu ini</option>
                                                <option>Bulan ini</option>
                                                <option>6 bulan</option>
                                            </select>
                                            <ChevronDown
                                                size={14}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                                                style={{ color: INK_2 }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                                        {[
                                            {
                                                label: "Total Produk",
                                                value: stats.totalProducts,
                                                icon: <Package size={18} />,
                                                gradient: [NAVY, NAVY_SOFT] as [string, string],
                                                trendUp: true,
                                                trendLabel: "vs periode sebelumnya",
                                                trendValue: "12.5%",
                                            },
                                            {
                                                label: "Total Outlet",
                                                value: stats.totalOutlets,
                                                icon: <Building2 size={18} />,
                                                gradient: [GOLD, "#E8D5B0"] as [string, string],
                                                trendUp: true,
                                                trendLabel: "outlet aktif beroperasi",
                                                trendValue: `${outlets.filter((o) => o.open).length}/${outlets.length}`,
                                            },
                                            {
                                                label: "Produk Bestseller",
                                                value: stats.bestsellerCount,
                                                icon: <TrendingUp size={18} />,
                                                gradient: [GREEN, "#8CAE8A"] as [string, string],
                                                trendUp: true,
                                                trendLabel: "dari total menu",
                                                trendValue: `${Math.round((stats.bestsellerCount / Math.max(1, stats.totalProducts)) * 100)}%`,
                                            },
                                            {
                                                label: "Rating Rata-rata",
                                                value: stats.avgRating.toFixed(1),
                                                icon: <Star size={18} />,
                                                gradient: [NAVY, "#7A5C3E"] as [string, string],
                                                trendUp: stats.avgRating >= 4.5,
                                                trendLabel: "dari 5.0 rating maksimal",
                                                trendValue: `${((stats.avgRating / 5) * 100).toFixed(0)}%`,
                                            },
                                        ].map((s) => (
                                            <div
                                                key={s.label}
                                                className="relative overflow-hidden rounded-2xl p-4"
                                                style={{
                                                    background: `linear-gradient(135deg, ${s.gradient[0]}, ${s.gradient[1]})`,
                                                    boxShadow: "0 8px 20px rgba(24,31,75,0.16)",
                                                }}
                                            >
                                                <div
                                                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full"
                                                    style={{ background: "rgba(255,255,255,0.08)" }}
                                                />
                                                <div className="relative flex items-start justify-between">
                                                    <p className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>
                                                        {s.label}
                                                    </p>
                                                    <span
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                                        style={{ background: "rgba(255,255,255,0.16)", color: "white" }}
                                                    >
                                                        {s.icon}
                                                    </span>
                                                </div>
                                                <p className="relative mt-2.5 font-serif text-[26px] font-semibold text-white">{s.value}</p>
                                                <div className="relative mt-2 flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.78)" }}>
                                                    {s.trendUp ? (
                                                        <TrendingUp size={12} color={GOLD} />
                                                    ) : (
                                                        <TrendingDown size={12} color="#E8A0A8" />
                                                    )}
                                                    <span className="font-semibold" style={{ color: "white" }}>
                                                        {s.trendValue}
                                                    </span>
                                                    <span className="truncate">{s.trendLabel}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                        <SectionCard>
                                            <p className="font-serif text-[15px] font-semibold" style={{ color: NAVY }}>
                                                Produk Terbaru
                                            </p>
                                            <div className="mt-3 flex flex-col gap-2.5">
                                                {products
                                                    .filter(
                                                        (p) =>
                                                            !dashboardQuery.trim() ||
                                                            p.name.toLowerCase().includes(dashboardQuery.trim().toLowerCase()) ||
                                                            p.category.toLowerCase().includes(dashboardQuery.trim().toLowerCase())
                                                    )
                                                    .slice(0, 5)
                                                    .map((p) => (
                                                        <div key={p.id} className="flex items-center gap-3">
                                                            <div
                                                                className="h-9 w-9 shrink-0 rounded-lg"
                                                                style={{ background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})` }}
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-[13px] font-medium" style={{ color: NAVY }}>
                                                                    {p.name}
                                                                </p>
                                                                <p className="text-[11.5px]" style={{ color: INK_2 }}>
                                                                    {p.category}
                                                                </p>
                                                            </div>
                                                            <p className="text-[12.5px] font-semibold" style={{ color: NAVY }}>
                                                                {formatRupiah(p.price)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                {products.filter(
                                                    (p) =>
                                                        !dashboardQuery.trim() ||
                                                        p.name.toLowerCase().includes(dashboardQuery.trim().toLowerCase()) ||
                                                        p.category.toLowerCase().includes(dashboardQuery.trim().toLowerCase())
                                                ).length === 0 && (
                                                        <p className="py-2 text-center text-[12px]" style={{ color: INK_2 }}>
                                                            Tidak ada produk yang cocok dengan pencarian.
                                                        </p>
                                                    )}
                                            </div>
                                        </SectionCard>

                                        <SectionCard>
                                            <p className="font-serif text-[15px] font-semibold" style={{ color: NAVY }}>
                                                Status Outlet
                                            </p>
                                            <div className="mt-3 flex flex-col gap-2.5">
                                                {outlets.map((o) => (
                                                    <div key={o.id} className="flex items-center justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-[13px] font-medium" style={{ color: NAVY }}>
                                                                {o.name}
                                                            </p>
                                                            <p className="text-[11.5px]" style={{ color: INK_2 }}>
                                                                {o.hours}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                                                            style={{
                                                                background: o.open ? "rgba(62,138,90,0.1)" : "rgba(201,87,107,0.1)",
                                                                color: o.open ? GREEN : RED,
                                                            }}
                                                        >
                                                            {o.open ? "Buka" : "Tutup"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </SectionCard>
                                    </div>
                                </div>
                            )}

                            {/* ==================== PRODUCTS ==================== */}
                            {activeModule === "products" && (
                                <div>
                                    <SectionCard className="mb-4 !p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                            <div className="relative w-full flex-1 sm:min-w-[200px]">
                                                <Search
                                                    size={15}
                                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                                                    color={INK_2}
                                                />
                                                <input
                                                    value={productSearch}
                                                    onChange={(e) => setProductSearch(e.target.value)}
                                                    placeholder="Cari produk..."
                                                    className={inputBase}
                                                    style={{ ...inputStyle(), paddingLeft: 34 }}
                                                />
                                            </div>
                                            <div className="flex gap-3">
                                                <select
                                                    value={productTypeFilter}
                                                    onChange={(e) => setProductTypeFilter(e.target.value as any)}
                                                    className="flex-1 rounded-xl px-3 py-2.5 text-[13px] sm:flex-none"
                                                    style={inputStyle()}
                                                >
                                                    <option value="all">Semua Tipe</option>
                                                    <option value="beverage">Beverage</option>
                                                    <option value="food">Food</option>
                                                </select>
                                                <select
                                                    value={productCategoryFilter}
                                                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                                                    className="flex-1 rounded-xl px-3 py-2.5 text-[13px] sm:flex-none"
                                                    style={inputStyle()}
                                                >
                                                    <option value="all">Semua Kategori</option>
                                                    {categories.map((c) => (
                                                        <option key={c.name} value={c.name}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </SectionCard>

                                    <SectionCard className="!p-0 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[720px] border-collapse text-left">
                                                <thead>
                                                    <tr style={{ background: MIST }}>
                                                        <th className="px-5 py-3 text-[11.5px] font-semibold" style={{ color: INK_2 }}>
                                                            <button
                                                                onClick={() => toggleSort("name")}
                                                                className="flex items-center gap-1 uppercase tracking-wide"
                                                            >
                                                                Produk <ArrowUpDown size={12} />
                                                            </button>
                                                        </th>
                                                        <th className="px-3 py-3 text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: INK_2 }}>
                                                            Kategori
                                                        </th>
                                                        <th className="px-3 py-3 text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: INK_2 }}>
                                                            <button onClick={() => toggleSort("price")} className="flex items-center gap-1">
                                                                Harga <ArrowUpDown size={12} />
                                                            </button>
                                                        </th>
                                                        <th className="px-3 py-3 text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: INK_2 }}>
                                                            <button onClick={() => toggleSort("rating")} className="flex items-center gap-1">
                                                                Rating <ArrowUpDown size={12} />
                                                            </button>
                                                        </th>
                                                        <th className="px-3 py-3 text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: INK_2 }}>
                                                            Status
                                                        </th>
                                                        <th className="px-5 py-3 text-right text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: INK_2 }}>
                                                            Aksi
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredSortedProducts.map((p) => (
                                                        <tr key={p.id} style={{ borderTop: `1px solid ${LINE}` }}>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                                                        style={{ background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})` }}
                                                                    >
                                                                        <Coffee size={16} color="white" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="truncate text-[13.5px] font-semibold" style={{ color: NAVY }}>
                                                                            {p.name}
                                                                        </p>
                                                                        <p className="max-w-[220px] truncate text-[11.5px]" style={{ color: INK_2 }}>
                                                                            {p.desc}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 text-[12.5px]" style={{ color: INK_2 }}>
                                                                {p.category}
                                                                <div className="mt-0.5 text-[10.5px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                                                                    {p.type}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 text-[13px] font-semibold" style={{ color: NAVY }}>
                                                                {formatRupiah(p.price)}
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex items-center gap-1 text-[12.5px] font-medium" style={{ color: NAVY }}>
                                                                    <Star size={13} fill={GOLD} color={GOLD} />
                                                                    {p.rating.toFixed(1)}
                                                                    <span style={{ color: INK_2 }}>({p.ratingCount})</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    <button
                                                                        onClick={() => toggleBestseller(p)}
                                                                        className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition"
                                                                        style={{
                                                                            background: p.bestseller ? "rgba(201,168,118,0.18)" : MIST,
                                                                            color: p.bestseller ? "#8A6E3E" : "#9CA3AF",
                                                                        }}
                                                                    >
                                                                        Best Seller
                                                                    </button>
                                                                    <button
                                                                        onClick={() => toggleIsNew(p)}
                                                                        className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition"
                                                                        style={{
                                                                            background: p.isNew ? "rgba(62,138,90,0.12)" : MIST,
                                                                            color: p.isNew ? GREEN : "#9CA3AF",
                                                                        }}
                                                                    >
                                                                        New
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        onClick={() => openEditProduct(p)}
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition"
                                                                        style={{ background: MIST, color: NAVY }}
                                                                    >
                                                                        <Pencil size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteProduct(p)}
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg transition"
                                                                        style={{ background: "rgba(201,87,107,0.08)", color: RED }}
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {filteredSortedProducts.length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="px-5 py-10 text-center text-[13px]" style={{ color: INK_2 }}>
                                                                Tidak ada produk yang cocok dengan pencarian/filter.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </SectionCard>
                                </div>
                            )}

                            {/* ==================== CATEGORIES ==================== */}
                            {activeModule === "categories" && (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <SectionCard className="col-span-1 h-fit">
                                        <p className="font-serif text-[15px] font-semibold" style={{ color: NAVY }}>
                                            Tambah Kategori
                                        </p>
                                        <div className="mt-4">
                                            <FieldLabel>Tipe</FieldLabel>
                                            <div className="mb-3 flex gap-2">
                                                {(["beverage", "food"] as ProductType[]).map((t) => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setNewCategoryType(t)}
                                                        className="flex-1 rounded-xl py-2 text-[12.5px] font-semibold transition"
                                                        style={{
                                                            background: newCategoryType === t ? NAVY : MIST,
                                                            color: newCategoryType === t ? "white" : NAVY,
                                                        }}
                                                    >
                                                        {t === "beverage" ? "Beverage" : "Food"}
                                                    </button>
                                                ))}
                                            </div>
                                            <FieldLabel>Nama Kategori</FieldLabel>
                                            <input
                                                value={newCategoryName}
                                                onChange={(e) => {
                                                    setNewCategoryName(e.target.value);
                                                    setCategoryError("");
                                                }}
                                                placeholder="mis. Signature Series"
                                                className={inputBase}
                                                style={inputStyle(!!categoryError)}
                                            />
                                            {categoryError && (
                                                <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                                    {categoryError}
                                                </p>
                                            )}
                                            <div className="mt-3">
                                                <PrimaryButton onClick={handleAddCategory} icon={<Plus size={15} />} full>
                                                    Tambah Kategori
                                                </PrimaryButton>
                                            </div>
                                        </div>
                                    </SectionCard>

                                    <SectionCard className="col-span-1">
                                        <p className="mb-3 font-serif text-[15px] font-semibold" style={{ color: NAVY }}>
                                            Kategori Beverage
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {beverageCats.map((c) => (
                                                <div
                                                    key={c.name}
                                                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                                                    style={{ background: MIST }}
                                                >
                                                    <span className="text-[13px] font-medium" style={{ color: NAVY }}>
                                                        {c.name}
                                                    </span>
                                                    <button onClick={() => handleDeleteCategory(c)} style={{ color: RED }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {beverageCats.length === 0 && (
                                                <p className="text-[12.5px]" style={{ color: INK_2 }}>
                                                    Belum ada kategori beverage.
                                                </p>
                                            )}
                                        </div>
                                    </SectionCard>

                                    <SectionCard className="col-span-1">
                                        <p className="mb-3 font-serif text-[15px] font-semibold" style={{ color: NAVY }}>
                                            Kategori Food
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {foodCats.map((c) => (
                                                <div
                                                    key={c.name}
                                                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                                                    style={{ background: MIST }}
                                                >
                                                    <span className="text-[13px] font-medium" style={{ color: NAVY }}>
                                                        {c.name}
                                                    </span>
                                                    <button onClick={() => handleDeleteCategory(c)} style={{ color: RED }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {foodCats.length === 0 && (
                                                <p className="text-[12.5px]" style={{ color: INK_2 }}>
                                                    Belum ada kategori food.
                                                </p>
                                            )}
                                        </div>
                                    </SectionCard>
                                </div>
                            )}

                            {/* ==================== OUTLETS ==================== */}
                            {activeModule === "outlets" && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {outlets.map((o) => (
                                        <SectionCard key={o.id}>
                                            <div className="flex items-start justify-between">
                                                <div
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                                                    style={{ background: MIST, color: NAVY }}
                                                >
                                                    <Store size={17} />
                                                </div>
                                                <button
                                                    onClick={() => toggleOutletOpen(o)}
                                                    className="rounded-full px-2.5 py-1 text-[10.5px] font-semibold"
                                                    style={{
                                                        background: o.open ? "rgba(62,138,90,0.1)" : "rgba(201,87,107,0.1)",
                                                        color: o.open ? GREEN : RED,
                                                    }}
                                                >
                                                    {o.open ? "Buka" : "Tutup"}
                                                </button>
                                            </div>
                                            <p className="mt-3 font-serif text-[15px] font-semibold" style={{ color: NAVY }}>
                                                {o.name}
                                            </p>
                                            <p className="mt-1 flex items-start gap-1.5 text-[12.5px] leading-relaxed" style={{ color: INK_2 }}>
                                                <MapPin size={13} className="mt-0.5 shrink-0" />
                                                {o.address}
                                            </p>
                                            <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px]" style={{ color: INK_2 }}>
                                                <Clock size={13} />
                                                {o.hours}
                                            </p>
                                            <div className="mt-4 flex gap-2">
                                                <GhostButton onClick={() => openEditOutlet(o)} icon={<Pencil size={13} />}>
                                                    Edit
                                                </GhostButton>
                                                <GhostButton onClick={() => handleDeleteOutlet(o)} icon={<Trash2 size={13} />} danger>
                                                    Hapus
                                                </GhostButton>
                                            </div>
                                        </SectionCard>
                                    ))}
                                </div>
                            )}

                            {/* ==================== VOUCHER PACKS ==================== */}
                            {activeModule === "vouchers" && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {voucherPacks.map((v) => (
                                        <SectionCard key={v.id}>
                                            <div className="flex items-start justify-between">
                                                <div
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                                                    style={{ background: "rgba(201,168,118,0.15)", color: GOLD }}
                                                >
                                                    <Ticket size={17} />
                                                </div>
                                                <span
                                                    className="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                                                    style={{ background: "rgba(201,168,118,0.18)", color: "#8A6E3E" }}
                                                >
                                                    Hemat {v.savePercent}%
                                                </span>
                                            </div>
                                            <p className="mt-3 font-serif text-[15px] font-semibold" style={{ color: NAVY }}>
                                                {v.title}
                                            </p>
                                            <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: INK_2 }}>
                                                {v.description}
                                            </p>
                                            <div className="mt-3 flex items-baseline gap-2">
                                                <span className="font-serif text-[18px] font-semibold" style={{ color: NAVY }}>
                                                    {formatRupiah(v.price)}
                                                </span>
                                                <span className="text-[12px] line-through" style={{ color: "#9CA3AF" }}>
                                                    {formatRupiah(v.originalValue)}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[11.5px]" style={{ color: INK_2 }}>
                                                {v.voucherCount} voucher per paket
                                            </p>
                                            <div className="mt-4 flex gap-2">
                                                <GhostButton onClick={() => openEditVoucher(v)} icon={<Pencil size={13} />}>
                                                    Edit
                                                </GhostButton>
                                                <GhostButton onClick={() => handleDeleteVoucher(v)} icon={<Trash2 size={13} />} danger>
                                                    Hapus
                                                </GhostButton>
                                            </div>
                                        </SectionCard>
                                    ))}
                                </div>
                            )}

                            {/* ==================== REWARDS ==================== */}
                            {activeModule === "rewards" && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {rewards.map((r) => (
                                        <SectionCard key={r.id}>
                                            <div className="flex items-start justify-between">
                                                <div
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                                                    style={{ background: "rgba(201,168,118,0.15)", color: GOLD }}
                                                >
                                                    <Award size={17} />
                                                </div>
                                                <span
                                                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                                                    style={{ background: MIST, color: NAVY }}
                                                >
                                                    <Sparkles size={11} color={GOLD} />
                                                    {r.pointCost} pts
                                                </span>
                                            </div>
                                            <p className="mt-3 font-serif text-[15px] font-semibold" style={{ color: NAVY }}>
                                                {r.name}
                                            </p>
                                            <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: INK_2 }}>
                                                {r.description}
                                            </p>
                                            <div className="mt-4 flex gap-2">
                                                <GhostButton onClick={() => openEditReward(r)} icon={<Pencil size={13} />}>
                                                    Edit
                                                </GhostButton>
                                                <GhostButton onClick={() => handleDeleteReward(r)} icon={<Trash2 size={13} />} danger>
                                                    Hapus
                                                </GhostButton>
                                            </div>
                                        </SectionCard>
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>

                    {/* ---------------- Product Drawer ---------------- */}
                    <Drawer
                        open={productDrawerOpen}
                        onClose={() => setProductDrawerOpen(false)}
                        title={editingProduct ? "Edit Produk" : "Tambah Produk"}
                    >
                        <div className="flex flex-col gap-4">
                            <div>
                                <FieldLabel>Tipe</FieldLabel>
                                <div className="flex gap-2">
                                    {(["beverage", "food"] as ProductType[]).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() =>
                                                setProductForm((f) => ({
                                                    ...f,
                                                    type: t,
                                                    category: categories.find((c) => c.type === t)?.name || "",
                                                }))
                                            }
                                            className="flex-1 rounded-xl py-2 text-[12.5px] font-semibold transition"
                                            style={{
                                                background: productForm.type === t ? NAVY : MIST,
                                                color: productForm.type === t ? "white" : NAVY,
                                            }}
                                        >
                                            {t === "beverage" ? "Beverage" : "Food"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <FieldLabel>Nama Produk</FieldLabel>
                                <input
                                    value={productForm.name}
                                    onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="mis. Es Kopi Susu"
                                    className={inputBase}
                                    style={inputStyle(!!productFormErrors.name)}
                                />
                                {productFormErrors.name && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                        {productFormErrors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>Kategori</FieldLabel>
                                <div className="relative">
                                    <select
                                        value={productForm.category}
                                        onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))}
                                        className={`${inputBase} appearance-none`}
                                        style={inputStyle(!!productFormErrors.category)}
                                    >
                                        <option value="">Pilih kategori</option>
                                        {availableCatsForForm.map((c) => (
                                            <option key={c.name} value={c.name}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        size={15}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                                        color={INK_2}
                                    />
                                </div>
                                {productFormErrors.category && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                        {productFormErrors.category}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>Harga (Rp)</FieldLabel>
                                <input
                                    value={productForm.price}
                                    onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value.replace(/[^0-9]/g, "") }))}
                                    placeholder="mis. 25000"
                                    inputMode="numeric"
                                    className={inputBase}
                                    style={inputStyle(!!productFormErrors.price)}
                                />
                                {productForm.price && !productFormErrors.price && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: INK_2 }}>
                                        {formatRupiah(Number(productForm.price))}
                                    </p>
                                )}
                                {productFormErrors.price && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                        {productFormErrors.price}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>Rating Awal (0–5)</FieldLabel>
                                <input
                                    value={productForm.rating}
                                    onChange={(e) => setProductForm((f) => ({ ...f, rating: e.target.value }))}
                                    placeholder="mis. 4.5"
                                    className={inputBase}
                                    style={inputStyle(!!productFormErrors.rating)}
                                />
                                {productFormErrors.rating && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                        {productFormErrors.rating}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>Deskripsi</FieldLabel>
                                <textarea
                                    value={productForm.desc}
                                    onChange={(e) => setProductForm((f) => ({ ...f, desc: e.target.value }))}
                                    placeholder="Deskripsi singkat produk..."
                                    rows={3}
                                    className={inputBase}
                                    style={inputStyle()}
                                />
                            </div>
                            <div className="mt-2 flex gap-2.5">
                                <GhostButton onClick={() => setProductDrawerOpen(false)}>Batal</GhostButton>
                                <PrimaryButton onClick={editingProduct ? handleUpdateProduct : handleAddProduct} full>
                                    {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
                                </PrimaryButton>
                            </div>
                        </div>
                    </Drawer>

                    {/* ---------------- Outlet Drawer ---------------- */}
                    <Drawer
                        open={outletDrawerOpen}
                        onClose={() => setOutletDrawerOpen(false)}
                        title={editingOutlet ? "Edit Outlet" : "Tambah Outlet"}
                    >
                        <div className="flex flex-col gap-4">
                            <div>
                                <FieldLabel>Nama Outlet</FieldLabel>
                                <input
                                    value={outletForm.name}
                                    onChange={(e) => setOutletForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="mis. ER Coffee Lab Kemang"
                                    className={inputBase}
                                    style={inputStyle(!!outletFormErrors.name)}
                                />
                                {outletFormErrors.name && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                        {outletFormErrors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>Alamat</FieldLabel>
                                <textarea
                                    value={outletForm.address}
                                    onChange={(e) => setOutletForm((f) => ({ ...f, address: e.target.value }))}
                                    placeholder="Jl. ..."
                                    rows={2}
                                    className={inputBase}
                                    style={inputStyle(!!outletFormErrors.address)}
                                />
                                {outletFormErrors.address && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                        {outletFormErrors.address}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>Jam Operasional</FieldLabel>
                                <input
                                    value={outletForm.hours}
                                    onChange={(e) => setOutletForm((f) => ({ ...f, hours: e.target.value }))}
                                    placeholder="mis. 07.00 – 22.00"
                                    className={inputBase}
                                    style={inputStyle(!!outletFormErrors.hours)}
                                />
                                {outletFormErrors.hours && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                        {outletFormErrors.hours}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-between rounded-xl px-3.5 py-3" style={{ background: MIST }}>
                                <span className="text-[13px] font-medium" style={{ color: NAVY }}>
                                    Status Buka
                                </span>
                                <button
                                    onClick={() => setOutletForm((f) => ({ ...f, open: !f.open }))}
                                    className="relative h-6 w-11 rounded-full transition"
                                    style={{ background: outletForm.open ? GREEN : "#C7CAD9" }}
                                >
                                    <span
                                        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                                        style={{ left: outletForm.open ? 22 : 2 }}
                                    />
                                </button>
                            </div>
                            <div className="mt-2 flex gap-2.5">
                                <GhostButton onClick={() => setOutletDrawerOpen(false)}>Batal</GhostButton>
                                <PrimaryButton onClick={editingOutlet ? handleUpdateOutlet : handleAddOutlet} full>
                                    {editingOutlet ? "Simpan Perubahan" : "Tambah Outlet"}
                                </PrimaryButton>
                            </div>
                        </div>
                    </Drawer>

                    {/* ---------------- Voucher Drawer ---------------- */}
                    <Drawer
                        open={voucherDrawerOpen}
                        onClose={() => setVoucherDrawerOpen(false)}
                        title={editingVoucher ? "Edit Paket Voucher" : "Tambah Paket Voucher"}
                    >
                        <div className="flex flex-col gap-4">
                            <div>
                                <FieldLabel>Judul Paket</FieldLabel>
                                <input
                                    value={voucherForm.title}
                                    onChange={(e) => setVoucherForm((f) => ({ ...f, title: e.target.value }))}
                                    placeholder="mis. Paket Hemat Rp10.500"
                                    className={inputBase}
                                    style={inputStyle(!!voucherFormErrors.title)}
                                />
                                {voucherFormErrors.title && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                        {voucherFormErrors.title}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>Deskripsi</FieldLabel>
                                <textarea
                                    value={voucherForm.description}
                                    onChange={(e) => setVoucherForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Jelaskan isi paket voucher..."
                                    rows={2}
                                    className={inputBase}
                                    style={inputStyle()}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <FieldLabel>Harga Asli (Rp)</FieldLabel>
                                    <input
                                        value={voucherForm.originalValue}
                                        onChange={(e) => setVoucherForm((f) => ({ ...f, originalValue: e.target.value.replace(/[^0-9]/g, "") }))}
                                        placeholder="30000"
                                        inputMode="numeric"
                                        className={inputBase}
                                        style={inputStyle(!!voucherFormErrors.originalValue)}
                                    />
                                    {voucherFormErrors.originalValue && (
                                        <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                            {voucherFormErrors.originalValue}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <FieldLabel>Harga Jual (Rp)</FieldLabel>
                                    <input
                                        value={voucherForm.price}
                                        onChange={(e) => setVoucherForm((f) => ({ ...f, price: e.target.value.replace(/[^0-9]/g, "") }))}
                                        placeholder="10500"
                                        inputMode="numeric"
                                        className={inputBase}
                                        style={inputStyle(!!voucherFormErrors.price)}
                                    />
                                    {voucherFormErrors.price && (
                                        <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                            {voucherFormErrors.price}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div
                                className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                                style={{ background: "rgba(201,168,118,0.12)" }}
                            >
                                <span className="text-[12.5px] font-medium" style={{ color: "#8A6E3E" }}>
                                    Persentase hemat (otomatis)
                                </span>
                                <span className="text-[14px] font-bold" style={{ color: "#8A6E3E" }}>
                                    {computedSavePercent}%
                                </span>
                            </div>
                            <div>
                                <FieldLabel>Jumlah Voucher</FieldLabel>
                                <input
                                    value={voucherForm.voucherCount}
                                    onChange={(e) => setVoucherForm((f) => ({ ...f, voucherCount: e.target.value.replace(/[^0-9]/g, "") }))}
                                    placeholder="mis. 3"
                                    inputMode="numeric"
                                    className={inputBase}
                                    style={inputStyle(!!voucherFormErrors.voucherCount)}
                                />
                                {voucherFormErrors.voucherCount && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                        {voucherFormErrors.voucherCount}
                                    </p>
                                )}
                            </div>
                            <div className="mt-2 flex gap-2.5">
                                <GhostButton onClick={() => setVoucherDrawerOpen(false)}>Batal</GhostButton>
                                <PrimaryButton onClick={editingVoucher ? handleUpdateVoucher : handleAddVoucher} full>
                                    {editingVoucher ? "Simpan Perubahan" : "Tambah Paket"}
                                </PrimaryButton>
                            </div>
                        </div>
                    </Drawer>

                    {/* ---------------- Reward Drawer ---------------- */}
                    <Drawer
                        open={rewardDrawerOpen}
                        onClose={() => setRewardDrawerOpen(false)}
                        title={editingReward ? "Edit Reward" : "Tambah Reward"}
                    >
                        <div className="flex flex-col gap-4">
                            <div>
                                <FieldLabel>Nama Reward</FieldLabel>
                                <input
                                    value={rewardForm.name}
                                    onChange={(e) => setRewardForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="mis. Free Coffee"
                                    className={inputBase}
                                    style={inputStyle(!!rewardFormErrors.name)}
                                />
                                {rewardFormErrors.name && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                        {rewardFormErrors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>Poin Dibutuhkan</FieldLabel>
                                <input
                                    value={rewardForm.pointCost}
                                    onChange={(e) => setRewardForm((f) => ({ ...f, pointCost: e.target.value.replace(/[^0-9]/g, "") }))}
                                    placeholder="mis. 500"
                                    inputMode="numeric"
                                    className={inputBase}
                                    style={inputStyle(!!rewardFormErrors.pointCost)}
                                />
                                {rewardFormErrors.pointCost && (
                                    <p className="mt-1 text-[11.5px]" style={{ color: RED }}>
                                        {rewardFormErrors.pointCost}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FieldLabel>Deskripsi</FieldLabel>
                                <textarea
                                    value={rewardForm.description}
                                    onChange={(e) => setRewardForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Jelaskan manfaat reward ini..."
                                    rows={3}
                                    className={inputBase}
                                    style={inputStyle()}
                                />
                            </div>
                            <div className="mt-2 flex gap-2.5">
                                <GhostButton onClick={() => setRewardDrawerOpen(false)}>Batal</GhostButton>
                                <PrimaryButton onClick={editingReward ? handleUpdateReward : handleAddReward} full>
                                    {editingReward ? "Simpan Perubahan" : "Tambah Reward"}
                                </PrimaryButton>
                            </div>
                        </div>
                    </Drawer>

                    {/* ---------------- Confirm dialog ---------------- */}
                    <ConfirmDialog
                        open={!!confirmState}
                        title={confirmState?.title || ""}
                        message={confirmState?.message || ""}
                        onCancel={() => setConfirmState(null)}
                        onConfirm={() => confirmState?.onConfirm()}
                    />

                    {/* ---------------- Toasts ---------------- */}
                    <div className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2">
                        {toasts.map((t) => (
                            <Toast key={t.id} message={t.message} tone={t.tone} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}