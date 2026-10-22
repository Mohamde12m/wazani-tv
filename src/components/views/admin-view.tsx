"use client";

import * as React from "react";
import {
  ShieldCheck,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Search,
  Tv,
  Trophy,
  Calendar,
  Users,
  Globe,
  Tags,
  RefreshCw,
  Loader2,
  Star,
  CheckCircle2,
  Radio,
  FlaskConical,
  ChevronLeft,
  Lock,
  Mail,
  KeyRound,
  AlertTriangle,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/stores/admin";
import { AppLogo } from "@/components/shared/app-logo";
import { useFetch } from "@/hooks/use-fetch";
import { useNav } from "@/stores/nav";
import { toast } from "sonner";
import type { Channel, Country, Category, Tournament, Team, Match } from "@/lib/types";
import { formatTime, formatDate, statusLabel } from "@/lib/datetime";

/* ============================================================
   API helper
============================================================ */
async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

/* ============================================================
   Shared form primitives
============================================================ */
function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2">
      <span className="text-xs font-semibold">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ============================================================
   Confirm delete dialog
============================================================ */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "حذف",
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   Auth gate + Login screen
============================================================ */
function LoginScreen({ error }: { error?: string }) {
  const login = useAdmin((s) => s.login);
  const back = useNav((s) => s.back);
  const setView = useNav((s) => s.setView);
  const [email, setEmail] = React.useState("admin@wazani.tv");
  const [password, setPassword] = React.useState("admin12345");
  const [submitting, setSubmitting] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | undefined>(error);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(undefined);
    const res = await login(email.trim(), password);
    if (!res.ok) {
      setLocalError(res.error || "فشل تسجيل الدخول");
      toast.error(res.error || "فشل تسجيل الدخول");
    } else {
      toast.success("مرحبًا بك في لوحة التحكم");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        <div className="flex flex-col items-center text-center">
          <AppLogo size={64} className="shadow-lg" />
          <div className="sr-only">WazaNI TV logo</div>
          <h1 className="mt-4 text-2xl font-extrabold text-emerald">
            لوحة تحكم <span className="gold-text">WazaNI</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            دخول المسؤول لإدارة القنوات والمباريات والبطولات
          </p>
        </div>

        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardContent className="px-6 pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="البريد الإلكتروني" required>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-9 text-left"
                    placeholder="admin@wazani.tv"
                    required
                  />
                </div>
              </Field>
              <Field label="كلمة المرور" required>
                <div className="relative">
                  <KeyRound className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-9 text-left"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </Field>

              {localError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{localError}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald text-white hover:bg-emerald-dark"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                تسجيل الدخول
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-dashed border-gold/50 bg-gold/5 px-4 py-3 text-center text-xs text-foreground">
          <span className="font-semibold text-gold">بيانات الدخول التجريبية:</span>
          <br />
          <code dir="ltr" className="text-[11px]">
            admin@wazani.tv / admin12345
          </code>
        </div>

        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (back ? back() : setView({ name: "home" }))}
            className="text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            رجوع إلى التطبيق
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Stat card
============================================================ */
function StatCard({
  icon: Icon,
  label,
  value,
  accent = "emerald",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent?: "emerald" | "gold";
}) {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-3 px-4 py-4">
        <div
          className={
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl " +
            (accent === "emerald"
              ? "bg-emerald-light/15 text-emerald"
              : "bg-gold/15 text-gold")
          }
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-extrabold leading-none text-foreground">
            {value}
          </div>
          <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   Stats section
============================================================ */
function StatsSection() {
  const { data, loading, error } = useFetch<{ stats: Record<string, number> }>("/api/stats");
  if (loading) return <SectionLoading />;
  if (error || !data)
    return (
      <ErrorBlock message="تعذّر تحميل الإحصائيات. تأكد من تسجيل الدخول." />
    );
  const s = data.stats || {};
  return (
    <div className="space-y-4">
      <SectionTitle
        icon={ShieldCheck}
        title="نظرة عامة"
        subtitle="إحصائيات شاملة لجميع محتويات المنصة"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Tv} label="القنوات" value={s.channels ?? 0} />
        <StatCard icon={Calendar} label="المباريات" value={s.matches ?? 0} accent="gold" />
        <StatCard icon={Trophy} label="البطولات" value={s.tournaments ?? 0} />
        <StatCard icon={Users} label="الفرق" value={s.teams ?? 0} accent="gold" />
        <StatCard icon={Globe} label="الدول" value={s.countries ?? 0} />
        <StatCard icon={Tags} label="التصنيفات" value={s.categories ?? 0} accent="gold" />
        <StatCard icon={Radio} label="مباريات مباشرة" value={s.liveMatches ?? 0} />
        <StatCard icon={Star} label="قنوات مميزة" value={s.featuredChannels ?? 0} accent="gold" />
        <StatCard icon={CheckCircle2} label="قنوات موثقة" value={s.verifiedChannels ?? 0} />
        <StatCard icon={ShieldCheck} label="حسابات المسؤولين" value={s.admins ?? 0} accent="gold" />
      </div>
    </div>
  );
}

/* ============================================================
   Channel section + dialog
============================================================ */
type ChannelFormState = {
  name: string;
  nameAr: string;
  logo: string;
  countryId: string;
  categoryId: string;
  streamUrl: string;
  streamType: string;
  active: boolean;
  featured: boolean;
  verified: boolean;
  order: number;
};

function emptyChannelForm(): ChannelFormState {
  return {
    name: "",
    nameAr: "",
    logo: "",
    countryId: "",
    categoryId: "",
    streamUrl: "",
    streamType: "none",
    active: true,
    featured: false,
    verified: false,
    order: 0,
  };
}

function ChannelDialog({
  open,
  onOpenChange,
  channel,
  countries,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  channel: Channel | null;
  countries: Country[];
  categories: Category[];
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<ChannelFormState>(emptyChannelForm());
  const [saving, setSaving] = React.useState(false);
  const logout = useAdmin((s) => s.logout);

  React.useEffect(() => {
    if (open) {
      if (channel) {
        setForm({
          name: channel.name || "",
          nameAr: channel.nameAr || "",
          logo: channel.logo || "",
          countryId: channel.countryId || "",
          categoryId: channel.categoryId || "",
          streamUrl: channel.streamUrl || "",
          streamType: channel.streamType || "none",
          active: channel.active,
          featured: channel.featured,
          verified: channel.verified,
          order: channel.order ?? 0,
        });
      } else {
        setForm(emptyChannelForm());
      }
    }
  }, [open, channel]);

  const set = <K extends keyof ChannelFormState>(k: K, v: ChannelFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("الاسم بالإنجليزية مطلوب");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        countryId: form.countryId || null,
        categoryId: form.categoryId || null,
        streamUrl: form.streamUrl || null,
        logo: form.logo || null,
        nameAr: form.nameAr || undefined,
      };
      if (channel) {
        await apiFetch(`/api/channels/${channel.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("تم تحديث القناة");
      } else {
        await apiFetch("/api/channels", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("تمت إضافة القناة");
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "خطأ في الحفظ");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald">
            <Tv className="h-5 w-5" />
            {channel ? "تعديل قناة" : "إضافة قناة جديدة"}
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات القناة بدقة. الحقول المؤشرة بنجمة إلزامية.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="الاسم (إنجليزي)" required>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Al Jazeera"
            />
          </Field>
          <Field label="الاسم (عربي)">
            <Input
              value={form.nameAr}
              onChange={(e) => set("nameAr", e.target.value)}
              placeholder="الجزيرة"
            />
          </Field>
          <Field label="رابط الشعار (Logo URL)" hint="اتركه فارغًا لتوليد شعار تلقائي">
            <Input
              dir="ltr"
              value={form.logo}
              onChange={(e) => set("logo", e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="الدولة">
            <Select value={form.countryId} onValueChange={(v) => set("countryId", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر الدولة" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.flag ? `${c.flag} ` : ""}
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="التصنيف">
            <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر التصنيف" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="نوع البث">
            <Select value={form.streamType} onValueChange={(v) => set("streamType", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="نوع البث" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">غير متاح</SelectItem>
                <SelectItem value="hls">HLS</SelectItem>
                <SelectItem value="mp4">MP4</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="رابط البث (Stream URL)" hint="اتركه فارغًا إذا لم يتوفر بث">
              <Input
                dir="ltr"
                value={form.streamUrl}
                onChange={(e) => set("streamUrl", e.target.value)}
                placeholder="https://stream.example.com/master.m3u8"
              />
            </Field>
          </div>
          <Field label="الترتيب" hint="الأرقام الأصغر تظهر أولًا">
            <Input
              type="number"
              value={form.order}
              onChange={(e) => set("order", Number(e.target.value))}
            />
          </Field>
          <div className="space-y-2 sm:col-span-2">
            <SwitchField
              label="قناة نشطة (ظاهرة للمستخدمين)"
              checked={form.active}
              onChange={(v) => set("active", v)}
            />
            <SwitchField
              label="قناة مميزة (تظهر في الصفحة الرئيسية)"
              checked={form.featured}
              onChange={(v) => set("featured", v)}
            />
            <SwitchField
              label="قناة موثقة"
              checked={form.verified}
              onChange={(v) => set("verified", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            إلغاء
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-emerald text-white hover:bg-emerald-dark"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {channel ? "حفظ التعديلات" : "إضافة القناة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChannelsSection() {
  const { data, loading, error, reload } = useFetch<{ channels: Channel[] }>("/api/channels");
  const countriesRes = useFetch<{ countries: Country[] }>("/api/countries");
  const categoriesRes = useFetch<{ categories: Category[] }>("/api/categories");
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Channel | null>(null);
  const [deleting, setDeleting] = React.useState<Channel | null>(null);
  const [delLoading, setDelLoading] = React.useState(false);
  const logout = useAdmin((s) => s.logout);

  const channels = data?.channels || [];
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.nameAr || "").toLowerCase().includes(q)
    );
  }, [channels, search]);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c: Channel) => {
    setEditing(c);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDelLoading(true);
    try {
      await apiFetch(`/api/channels/${deleting.id}`, { method: "DELETE" });
      toast.success("تم حذف القناة");
      setDeleting(null);
      reload();
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "فشل الحذف");
      }
    } finally {
      setDelLoading(false);
    }
  };

  if (loading) return <SectionLoading />;
  if (error) return <ErrorBlock message="تعذّر تحميل القنوات" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          icon={Tv}
          title="إدارة القنوات"
          subtitle={`${channels.length} قناة في النظام`}
          noMargin
        />
        <Button
          onClick={openAdd}
          className="bg-emerald text-white hover:bg-emerald-dark"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          إضافة قناة
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم القناة..."
          className="pr-9"
        />
      </div>

      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="px-0">
          {filtered.length === 0 ? (
            <EmptyRow text="لا توجد قنوات مطابقة" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                  <TableHead className="pr-4">القناة</TableHead>
                  <TableHead>الدولة</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>البث</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-[10px] font-bold text-emerald">
                          {(c.nameAr || c.name).slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {c.nameAr || c.name}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {c.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.country ? (
                        <span>
                          {c.country.flag ? `${c.country.flag} ` : ""}
                          {c.country.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.category ? (
                        <span>{c.category.name}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StreamTypeBadge type={c.streamType} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.active ? (
                          <Badge className="bg-emerald/10 text-emerald" variant="outline">
                            نشطة
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            معطلة
                          </Badge>
                        )}
                        {c.featured && (
                          <Badge className="bg-gold/15 text-gold" variant="outline">
                            <Star className="h-3 w-3" />
                            مميزة
                          </Badge>
                        )}
                        {c.verified && (
                          <Badge className="bg-emerald-light/15 text-emerald-light" variant="outline">
                            <CheckCircle2 className="h-3 w-3" />
                            موثقة
                          </Badge>
                        )}
                        {c.demo && (
                          <Badge className="bg-purple-500/10 text-purple-600" variant="outline">
                            <FlaskConical className="h-3 w-3" />
                            تجريبية
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald"
                          onClick={() => openEdit(c)}
                          aria-label="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleting(c)}
                          aria-label="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ChannelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        channel={editing}
        countries={countriesRes.data?.countries || []}
        categories={categoriesRes.data?.categories || []}
        onSaved={reload}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="حذف القناة"
        description={`سيتم حذف "${deleting?.nameAr || deleting?.name}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.`}
        loading={delLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function StreamTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    hls: { label: "HLS", cls: "bg-emerald/10 text-emerald" },
    mp4: { label: "MP4", cls: "bg-emerald-light/15 text-emerald-light" },
    youtube: { label: "YouTube", cls: "bg-red-500/10 text-red-600" },
    none: { label: "غير متاح", cls: "bg-muted text-muted-foreground" },
  };
  const m = map[type] || map.none;
  return (
    <Badge variant="outline" className={m.cls}>
      {m.label}
    </Badge>
  );
}

/* ============================================================
   Matches section + dialog
============================================================ */
type MatchFormState = {
  homeName: string;
  awayName: string;
  homeLogo: string;
  awayLogo: string;
  tournamentId: string;
  kickoff: string;
  status: string;
  homeScore: string;
  awayScore: string;
  stadium: string;
  channelId: string;
  featured: boolean;
  demo: boolean;
};

function emptyMatchForm(): MatchFormState {
  return {
    homeName: "",
    awayName: "",
    homeLogo: "",
    awayLogo: "",
    tournamentId: "",
    kickoff: toLocalDatetime(new Date(Date.now() + 3600000)),
    status: "scheduled",
    homeScore: "",
    awayScore: "",
    stadium: "",
    channelId: "",
    featured: false,
    demo: true,
  };
}

function toLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function MatchDialog({
  open,
  onOpenChange,
  match,
  tournaments,
  channels,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  match: Match | null;
  tournaments: Tournament[];
  channels: Channel[];
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<MatchFormState>(emptyMatchForm());
  const [saving, setSaving] = React.useState(false);
  const logout = useAdmin((s) => s.logout);

  React.useEffect(() => {
    if (open) {
      if (match) {
        const d = new Date(match.kickoff);
        setForm({
          homeName: match.homeName || "",
          awayName: match.awayName || "",
          homeLogo: match.homeLogo || "",
          awayLogo: match.awayLogo || "",
          tournamentId: match.tournamentId || "",
          kickoff: toLocalDatetime(d),
          status: match.status || "scheduled",
          homeScore:
            match.homeScore !== null && match.homeScore !== undefined
              ? String(match.homeScore)
              : "",
          awayScore:
            match.awayScore !== null && match.awayScore !== undefined
              ? String(match.awayScore)
              : "",
          stadium: match.stadium || "",
          channelId: match.channelId || "",
          featured: !!match.featured,
          demo: !!match.demo,
        });
      } else {
        setForm(emptyMatchForm());
      }
    }
  }, [open, match]);

  const set = <K extends keyof MatchFormState>(k: K, v: MatchFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.homeName.trim() || !form.awayName.trim()) {
      toast.error("أسماء الفريقين مطلوبة");
      return;
    }
    if (!form.kickoff) {
      toast.error("وقت المباراة مطلوب");
      return;
    }
    setSaving(true);
    try {
      const body = {
        homeName: form.homeName.trim(),
        awayName: form.awayName.trim(),
        homeLogo: form.homeLogo || null,
        awayLogo: form.awayLogo || null,
        tournamentId: form.tournamentId || null,
        kickoff: new Date(form.kickoff).toISOString(),
        status: form.status,
        homeScore: form.homeScore === "" ? null : Number(form.homeScore),
        awayScore: form.awayScore === "" ? null : Number(form.awayScore),
        stadium: form.stadium || null,
        channelId: form.channelId || null,
        featured: form.featured,
        demo: form.demo,
      };
      if (match) {
        await apiFetch(`/api/matches/${match.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("تم تحديث المباراة");
      } else {
        await apiFetch("/api/matches", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("تمت إضافة المباراة");
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "خطأ في الحفظ");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald">
            <Calendar className="h-5 w-5" />
            {match ? "تعديل مباراة" : "إضافة مباراة جديدة"}
          </DialogTitle>
          <DialogDescription>أدخل بيانات المباراة بدقة.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="الفريق المضيف" required>
            <Input
              value={form.homeName}
              onChange={(e) => set("homeName", e.target.value)}
              placeholder="الأهلي"
            />
          </Field>
          <Field label="الفريق الضيف" required>
            <Input
              value={form.awayName}
              onChange={(e) => set("awayName", e.target.value)}
              placeholder="الزمالك"
            />
          </Field>
          <Field label="شعار المضيف (URL)">
            <Input
              dir="ltr"
              value={form.homeLogo}
              onChange={(e) => set("homeLogo", e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="شعار الضيف (URL)">
            <Input
              dir="ltr"
              value={form.awayLogo}
              onChange={(e) => set("awayLogo", e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="البطولة">
            <Select value={form.tournamentId} onValueChange={(v) => set("tournamentId", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر البطولة" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nameAr || t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="موعد المباراة" required>
            <Input
              type="datetime-local"
              value={form.kickoff}
              onChange={(e) => set("kickoff", e.target.value)}
            />
          </Field>
          <Field label="الحالة">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">مجدولة</SelectItem>
                <SelectItem value="live">مباشر</SelectItem>
                <SelectItem value="finished">انتهت</SelectItem>
                <SelectItem value="postponed">مؤجلة</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="القناة الناقلة">
            <Select value={form.channelId} onValueChange={(v) => set("channelId", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="بدون قناة" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nameAr || c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="نتيجة المضيف">
            <Input
              type="number"
              min={0}
              value={form.homeScore}
              onChange={(e) => set("homeScore", e.target.value)}
              placeholder="—"
            />
          </Field>
          <Field label="نتيجة الضيف">
            <Input
              type="number"
              min={0}
              value={form.awayScore}
              onChange={(e) => set("awayScore", e.target.value)}
              placeholder="—"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="الملعب">
              <Input
                value={form.stadium}
                onChange={(e) => set("stadium", e.target.value)}
                placeholder="اسم الملعب"
              />
            </Field>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <SwitchField
              label="مباراة مميزة"
              checked={form.featured}
              onChange={(v) => set("featured", v)}
            />
            <SwitchField
              label="مباراة تجريبية (لن تظهر كبيانات حقيقية)"
              checked={form.demo}
              onChange={(v) => set("demo", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            إلغاء
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-emerald text-white hover:bg-emerald-dark"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {match ? "حفظ التعديلات" : "إضافة المباراة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    scheduled: { label: "مجدولة", cls: "bg-secondary text-foreground" },
    live: { label: "مباشر", cls: "bg-red-500/10 text-red-600" },
    finished: { label: "انتهت", cls: "bg-emerald/10 text-emerald" },
    postponed: { label: "مؤجلة", cls: "bg-gold/15 text-gold" },
  };
  const m = map[status] || map.scheduled;
  return (
    <Badge variant="outline" className={m.cls + (status === "live" ? " live-dot" : "")}>
      {status === "live" && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
      {m.label}
    </Badge>
  );
}

function MatchesSection() {
  const { data, loading, error, reload } = useFetch<{ matches: Match[] }>("/api/matches");
  const tRes = useFetch<{ tournaments: Tournament[] }>("/api/tournaments");
  const chRes = useFetch<{ channels: Channel[] }>("/api/channels");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Match | null>(null);
  const [deleting, setDeleting] = React.useState<Match | null>(null);
  const [delLoading, setDelLoading] = React.useState(false);
  const logout = useAdmin((s) => s.logout);

  const matches = data?.matches || [];

  const confirmDelete = async () => {
    if (!deleting) return;
    setDelLoading(true);
    try {
      await apiFetch(`/api/matches/${deleting.id}`, { method: "DELETE" });
      toast.success("تم حذف المباراة");
      setDeleting(null);
      reload();
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "فشل الحذف");
      }
    } finally {
      setDelLoading(false);
    }
  };

  if (loading) return <SectionLoading />;
  if (error) return <ErrorBlock message="تعذّر تحميل المباريات" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          icon={Calendar}
          title="إدارة المباريات"
          subtitle={`${matches.length} مباراة في النظام`}
          noMargin
        />
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-emerald text-white hover:bg-emerald-dark"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          إضافة مباراة
        </Button>
      </div>

      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="px-0">
          {matches.length === 0 ? (
            <EmptyRow text="لا توجد مباريات" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                  <TableHead className="pr-4">المباراة</TableHead>
                  <TableHead>البطولة</TableHead>
                  <TableHead>الموعد</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>القناة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pr-4">
                      <div className="flex items-center gap-2">
                        {m.demo && (
                          <Badge
                            variant="outline"
                            className="bg-purple-500/10 text-purple-600"
                          >
                            <FlaskConical className="h-3 w-3" />
                            تجريبية
                          </Badge>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {m.homeName} <span className="text-muted-foreground">×</span>{" "}
                            {m.awayName}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {m.homeScore !== null && m.homeScore !== undefined
                              ? `${m.homeScore} - ${m.awayScore ?? 0}`
                              : m.stadium || "—"}
                          </div>
                        </div>
                        {m.featured && (
                          <Star className="h-3.5 w-3.5 shrink-0 fill-gold text-gold" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {m.tournament?.nameAr || m.tournament?.name || m.tournamentName || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{formatDate(m.kickoff)}</div>
                      <div className="text-muted-foreground">{formatTime(m.kickoff)}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {m.channel ? (
                        m.channel.nameAr || m.channel.name
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald"
                          onClick={() => {
                            setEditing(m);
                            setDialogOpen(true);
                          }}
                          aria-label="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleting(m)}
                          aria-label="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MatchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        match={editing}
        tournaments={tRes.data?.tournaments || []}
        channels={chRes.data?.channels || []}
        onSaved={reload}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="حذف المباراة"
        description={`سيتم حذف مباراة "${deleting?.homeName} × ${deleting?.awayName}" نهائيًا.`}
        loading={delLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/* ============================================================
   Tournaments section + dialog
============================================================ */
type TournamentFormState = {
  name: string;
  nameAr: string;
  logo: string;
  country: string;
  type: string;
  order: number;
  visible: boolean;
};

function emptyTournamentForm(): TournamentFormState {
  return {
    name: "",
    nameAr: "",
    logo: "",
    country: "",
    type: "league",
    order: 0,
    visible: true,
  };
}

function TournamentDialog({
  open,
  onOpenChange,
  tournament,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tournament: Tournament | null;
  onSaved: () => void;
}) {
  const [form, setForm] = React.useState<TournamentFormState>(emptyTournamentForm());
  const [saving, setSaving] = React.useState(false);
  const logout = useAdmin((s) => s.logout);

  React.useEffect(() => {
    if (open) {
      if (tournament) {
        setForm({
          name: tournament.name || "",
          nameAr: tournament.nameAr || "",
          logo: tournament.logo || "",
          country: tournament.country || "",
          type: tournament.type || "league",
          order: tournament.order ?? 0,
          visible: !!tournament.visible,
        });
      } else {
        setForm(emptyTournamentForm());
      }
    }
  }, [open, tournament]);

  const set = <K extends keyof TournamentFormState>(k: K, v: TournamentFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        logo: form.logo || null,
        nameAr: form.nameAr || undefined,
        country: form.country || undefined,
      };
      if (tournament) {
        await apiFetch(`/api/tournaments/${tournament.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("تم تحديث البطولة");
      } else {
        await apiFetch("/api/tournaments", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("تمت إضافة البطولة");
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "خطأ في الحفظ");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald">
            <Trophy className="h-5 w-5" />
            {tournament ? "تعديل بطولة" : "إضافة بطولة جديدة"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="الاسم (إنجليزي)" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="الاسم (عربي)">
            <Input value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
          </Field>
          <Field label="رابط الشعار">
            <Input dir="ltr" value={form.logo} onChange={(e) => set("logo", e.target.value)} />
          </Field>
          <Field label="الدولة">
            <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
          </Field>
          <Field label="النوع">
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="league">دوري</SelectItem>
                <SelectItem value="cup">كأس</SelectItem>
                <SelectItem value="international">دولية</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="الترتيب">
            <Input
              type="number"
              value={form.order}
              onChange={(e) => set("order", Number(e.target.value))}
            />
          </Field>
          <div className="sm:col-span-2">
            <SwitchField
              label="ظاهرة للمستخدمين"
              checked={form.visible}
              onChange={(v) => set("visible", v)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            إلغاء
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-emerald text-white hover:bg-emerald-dark"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {tournament ? "حفظ" : "إضافة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TournamentsSection() {
  const { data, loading, error, reload } = useFetch<{ tournaments: Tournament[] }>(
    "/api/tournaments"
  );
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Tournament | null>(null);
  const [deleting, setDeleting] = React.useState<Tournament | null>(null);
  const [delLoading, setDelLoading] = React.useState(false);
  const logout = useAdmin((s) => s.logout);

  const tournaments = data?.tournaments || [];

  const confirmDelete = async () => {
    if (!deleting) return;
    setDelLoading(true);
    try {
      await apiFetch(`/api/tournaments/${deleting.id}`, { method: "DELETE" });
      toast.success("تم حذف البطولة");
      setDeleting(null);
      reload();
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "فشل الحذف");
      }
    } finally {
      setDelLoading(false);
    }
  };

  if (loading) return <SectionLoading />;
  if (error) return <ErrorBlock message="تعذّر تحميل البطولات" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          icon={Trophy}
          title="إدارة البطولات"
          subtitle={`${tournaments.length} بطولة`}
          noMargin
        />
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-emerald text-white hover:bg-emerald-dark"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          إضافة بطولة
        </Button>
      </div>

      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="px-0">
          {tournaments.length === 0 ? (
            <EmptyRow text="لا توجد بطولات" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                  <TableHead className="pr-4">البطولة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الدولة</TableHead>
                  <TableHead>المباريات / الفرق</TableHead>
                  <TableHead>الظهور</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="pr-4">
                      <div className="text-sm font-semibold">{t.nameAr || t.name}</div>
                      <div className="text-[11px] text-muted-foreground">{t.name}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="bg-gold/10 text-gold">
                        {t.type === "league"
                          ? "دوري"
                          : t.type === "cup"
                          ? "كأس"
                          : "دولية"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {t.country || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t._count?.matches ?? 0} / {t._count?.teams ?? 0}
                    </TableCell>
                    <TableCell>
                      {t.visible ? (
                        <Badge variant="outline" className="bg-emerald/10 text-emerald">
                          ظاهرة
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          مخفية
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald"
                          onClick={() => {
                            setEditing(t);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleting(t)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TournamentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tournament={editing}
        onSaved={reload}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="حذف البطولة"
        description={`سيتم حذف "${deleting?.nameAr || deleting?.name}" نهائيًا.`}
        loading={delLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/* ============================================================
   Teams section + dialog
============================================================ */
type TeamFormState = {
  name: string;
  nameAr: string;
  logo: string;
  country: string;
  tournamentId: string;
};

function emptyTeamForm(): TeamFormState {
  return { name: "", nameAr: "", logo: "", country: "", tournamentId: "" };
}

function TeamsSection() {
  const { data, loading, error, reload } = useFetch<{ teams: (Team & { tournament?: Tournament | null })[] }>(
    "/api/teams"
  );
  const tRes = useFetch<{ tournaments: Tournament[] }>("/api/tournaments");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<TeamFormState>(emptyTeamForm());
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Team | null>(null);
  const [delLoading, setDelLoading] = React.useState(false);
  const logout = useAdmin((s) => s.logout);

  const teams = data?.teams || [];

  const set = <K extends keyof TeamFormState>(k: K, v: TeamFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("اسم الفريق مطلوب");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        nameAr: form.nameAr || undefined,
        logo: form.logo || null,
        country: form.country || undefined,
        tournamentId: form.tournamentId || null,
      };
      await apiFetch("/api/teams", { method: "POST", body: JSON.stringify(body) });
      toast.success("تمت إضافة الفريق");
      setForm(emptyTeamForm());
      setDialogOpen(false);
      reload();
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "خطأ في الحفظ");
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDelLoading(true);
    try {
      await apiFetch(`/api/teams/${deleting.id}`, { method: "DELETE" });
      toast.success("تم حذف الفريق");
      setDeleting(null);
      reload();
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "فشل الحذف");
      }
    } finally {
      setDelLoading(false);
    }
  };

  if (loading) return <SectionLoading />;
  if (error) return <ErrorBlock message="تعذّر تحميل الفرق" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          icon={Users}
          title="إدارة الفرق"
          subtitle={`${teams.length} فريق`}
          noMargin
        />
        <Button
          onClick={() => {
            setForm(emptyTeamForm());
            setDialogOpen(true);
          }}
          className="bg-emerald text-white hover:bg-emerald-dark"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          إضافة فريق
        </Button>
      </div>

      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="px-0">
          {teams.length === 0 ? (
            <EmptyRow text="لا توجد فرق" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                  <TableHead className="pr-4">الفريق</TableHead>
                  <TableHead>البطولة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="pr-4">
                      <div className="text-sm font-semibold">{t.nameAr || t.name}</div>
                      <div className="text-[11px] text-muted-foreground">{t.name}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {t.tournament ? (
                        t.tournament.nameAr || t.tournament.name
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleting(t)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald">
              <Users className="h-5 w-5" />
              إضافة فريق جديد
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="الاسم (إنجليزي)" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="الاسم (عربي)">
              <Input value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
            </Field>
            <Field label="رابط الشعار" hint="اختياري - يولد تلقائيًا">
              <Input dir="ltr" value={form.logo} onChange={(e) => set("logo", e.target.value)} />
            </Field>
            <Field label="الدولة">
              <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="البطولة">
                <Select
                  value={form.tournamentId}
                  onValueChange={(v) => set("tournamentId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر البطولة" />
                  </SelectTrigger>
                  <SelectContent>
                    {tRes.data?.tournaments.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nameAr || t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button
              onClick={submit}
              disabled={saving}
              className="bg-emerald text-white hover:bg-emerald-dark"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="حذف الفريق"
        description={`سيتم حذف "${deleting?.nameAr || deleting?.name}" نهائيًا.`}
        loading={delLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/* ============================================================
   Countries section + dialog
============================================================ */
type CountryFormState = {
  name: string;
  code: string;
  flag: string;
  order: number;
  visible: boolean;
};

function emptyCountryForm(): CountryFormState {
  return { name: "", code: "", flag: "", order: 0, visible: true };
}

function CountriesSection() {
  const { data, loading, error, reload } = useFetch<{ countries: Country[] }>("/api/countries");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Country | null>(null);
  const [form, setForm] = React.useState<CountryFormState>(emptyCountryForm());
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Country | null>(null);
  const [delLoading, setDelLoading] = React.useState(false);
  const logout = useAdmin((s) => s.logout);

  const countries = data?.countries || [];

  React.useEffect(() => {
    if (dialogOpen) {
      if (editing) {
        setForm({
          name: editing.name,
          code: editing.code,
          flag: editing.flag || "",
          order: editing.order ?? 0,
          visible: !!editing.visible,
        });
      } else {
        setForm(emptyCountryForm());
      }
    }
  }, [dialogOpen, editing]);

  const set = <K extends keyof CountryFormState>(k: K, v: CountryFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("الاسم والرمز مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        flag: form.flag || undefined,
      };
      if (editing) {
        await apiFetch(`/api/countries/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("تم تحديث الدولة");
      } else {
        await apiFetch("/api/countries", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("تمت إضافة الدولة");
      }
      setDialogOpen(false);
      setEditing(null);
      reload();
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "خطأ في الحفظ");
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDelLoading(true);
    try {
      await apiFetch(`/api/countries/${deleting.id}`, { method: "DELETE" });
      toast.success("تم حذف الدولة");
      setDeleting(null);
      reload();
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "فشل الحذف");
      }
    } finally {
      setDelLoading(false);
    }
  };

  if (loading) return <SectionLoading />;
  if (error) return <ErrorBlock message="تعذّر تحميل الدول" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          icon={Globe}
          title="إدارة الدول"
          subtitle={`${countries.length} دولة`}
          noMargin
        />
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-emerald text-white hover:bg-emerald-dark"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          إضافة دولة
        </Button>
      </div>

      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="px-0">
          {countries.length === 0 ? (
            <EmptyRow text="لا توجد دول" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                  <TableHead className="pr-4">العلم</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الرمز</TableHead>
                  <TableHead>الترتيب</TableHead>
                  <TableHead>الظهور</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pr-4 text-lg">{c.flag || "🏳️"}</TableCell>
                    <TableCell className="text-sm font-semibold">{c.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground" dir="ltr">
                      {c.code}
                    </TableCell>
                    <TableCell className="text-xs">{c.order}</TableCell>
                    <TableCell>
                      {c.visible ? (
                        <Badge variant="outline" className="bg-emerald/10 text-emerald">
                          ظاهرة
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          مخفية
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald"
                          onClick={() => {
                            setEditing(c);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleting(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald">
              <Globe className="h-5 w-5" />
              {editing ? "تعديل دولة" : "إضافة دولة"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="الاسم" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="الرمز" required hint="مثل: SA, EG, AE">
              <Input
                dir="ltr"
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="SA"
              />
            </Field>
            <Field label="العلم (إيموجي)">
              <Input
                value={form.flag}
                onChange={(e) => set("flag", e.target.value)}
                placeholder="🇸🇦"
              />
            </Field>
            <Field label="الترتيب">
              <Input
                type="number"
                value={form.order}
                onChange={(e) => set("order", Number(e.target.value))}
              />
            </Field>
            <div className="sm:col-span-2">
              <SwitchField
                label="ظاهرة للمستخدمين"
                checked={form.visible}
                onChange={(v) => set("visible", v)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button
              onClick={submit}
              disabled={saving}
              className="bg-emerald text-white hover:bg-emerald-dark"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {editing ? "حفظ" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="حذف الدولة"
        description={`سيتم حذف "${deleting?.name}" نهائيًا.`}
        loading={delLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/* ============================================================
   Categories section + dialog
============================================================ */
type CategoryFormState = {
  name: string;
  slug: string;
  icon: string;
  order: number;
  visible: boolean;
  isSports: boolean;
};

function emptyCategoryForm(): CategoryFormState {
  return { name: "", slug: "", icon: "", order: 0, visible: true, isSports: false };
}

function CategoriesSection() {
  const { data, loading, error, reload } = useFetch<{ categories: Category[] }>("/api/categories");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [form, setForm] = React.useState<CategoryFormState>(emptyCategoryForm());
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Category | null>(null);
  const [delLoading, setDelLoading] = React.useState(false);
  const logout = useAdmin((s) => s.logout);

  const categories = data?.categories || [];

  React.useEffect(() => {
    if (dialogOpen) {
      if (editing) {
        setForm({
          name: editing.name,
          slug: editing.slug,
          icon: editing.icon || "",
          order: editing.order ?? 0,
          visible: !!editing.visible,
          isSports: !!editing.isSports,
        });
      } else {
        setForm(emptyCategoryForm());
      }
    }
  }, [dialogOpen, editing]);

  const set = <K extends keyof CategoryFormState>(k: K, v: CategoryFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("الاسم والمعرّف مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        icon: form.icon || undefined,
      };
      if (editing) {
        await apiFetch(`/api/categories/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("تم تحديث التصنيف");
      } else {
        await apiFetch("/api/categories", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("تمت إضافة التصنيف");
      }
      setDialogOpen(false);
      setEditing(null);
      reload();
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "خطأ في الحفظ");
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDelLoading(true);
    try {
      await apiFetch(`/api/categories/${deleting.id}`, { method: "DELETE" });
      toast.success("تم حذف التصنيف");
      setDeleting(null);
      reload();
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "فشل الحذف");
      }
    } finally {
      setDelLoading(false);
    }
  };

  if (loading) return <SectionLoading />;
  if (error) return <ErrorBlock message="تعذّر تحميل التصنيفات" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          icon={Tags}
          title="إدارة التصنيفات"
          subtitle={`${categories.length} تصنيف`}
          noMargin
        />
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-emerald text-white hover:bg-emerald-dark"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          إضافة تصنيف
        </Button>
      </div>

      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="px-0">
          {categories.length === 0 ? (
            <EmptyRow text="لا توجد تصنيفات" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                  <TableHead className="pr-4">التصنيف</TableHead>
                  <TableHead>المعرّف</TableHead>
                  <TableHead>الأيقونة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الترتيب</TableHead>
                  <TableHead>الظهور</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="pr-4 text-sm font-semibold">{c.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground" dir="ltr">
                      {c.slug}
                    </TableCell>
                    <TableCell className="text-base">{c.icon || "—"}</TableCell>
                    <TableCell>
                      {c.isSports ? (
                        <Badge variant="outline" className="bg-gold/15 text-gold">
                          رياضي
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          عام
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{c.order}</TableCell>
                    <TableCell>
                      {c.visible ? (
                        <Badge variant="outline" className="bg-emerald/10 text-emerald">
                          ظاهر
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          مخفي
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald"
                          onClick={() => {
                            setEditing(c);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleting(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald">
              <Tags className="h-5 w-5" />
              {editing ? "تعديل تصنيف" : "إضافة تصنيف"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="الاسم" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="المعرّف (slug)" required hint="بالحروف الإنجليزية فقط">
              <Input
                dir="ltr"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="sports"
              />
            </Field>
            <Field label="الأيقونة (إيموجي أو نص)">
              <Input
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
                placeholder="⚽"
              />
            </Field>
            <Field label="الترتيب">
              <Input
                type="number"
                value={form.order}
                onChange={(e) => set("order", Number(e.target.value))}
              />
            </Field>
            <div className="space-y-2 sm:col-span-2">
              <SwitchField
                label="تصنيف رياضي"
                checked={form.isSports}
                onChange={(v) => set("isSports", v)}
              />
              <SwitchField
                label="ظاهر للمستخدمين"
                checked={form.visible}
                onChange={(v) => set("visible", v)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
              disabled={saving}
            >
              إلغاء
            </Button>
            <Button
              onClick={submit}
              disabled={saving}
              className="bg-emerald text-white hover:bg-emerald-dark"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {editing ? "حفظ" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="حذف التصنيف"
        description={`سيتم حذف "${deleting?.name}" نهائيًا.`}
        loading={delLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/* ============================================================
   Reseed section
============================================================ */
function ReseedSection() {
  const [loading, setLoading] = React.useState(false);
  const logout = useAdmin((s) => s.logout);

  const reseed = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/seed", { method: "POST" });
      toast.success("تمت إعادة توليد البيانات التجريبية بنجاح");
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجددًا");
        logout();
      } else {
        toast.error(err.message || "فشلت إعادة التوليد");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={RefreshCw}
        title="إعادة توليد البيانات التجريبية"
        subtitle="إعادة ضبط بيانات المباريات إلى الحالة الأولية"
      />
      <Card className="rounded-2xl border border-gold/30 bg-gold/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gold">
            <FlaskConical className="h-5 w-5" />
            إعادة البيانات التجريبية
          </CardTitle>
          <CardDescription>
            يقوم هذا الإجراء بحذف جميع المباريات الحالية وإعادة توليد البيانات
            التجريبية الأولية (مباريات مباشرة، اليوم، غدًا، قادمة، منتهية).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <div className="mb-2 font-semibold text-foreground">ما الذي سيحدث:</div>
            <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
              <li>حذف جميع المباريات الحالية من قاعدة البيانات.</li>
              <li>إعادة تشغيل سكربت التوليد الأولي للمباريات والفرق.</li>
              <li>القنوات والبطولات والدول تبقى كما هي.</li>
              <li>قد يستغرق الإجراء بضع ثوانٍ.</li>
            </ul>
          </div>
          <Button
            onClick={reseed}
            disabled={loading}
            className="w-full bg-gold text-white hover:bg-gold/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            إعادة توليد البيانات التجريبية
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
   Shared section helpers
============================================================ */
function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  noMargin,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  noMargin?: boolean;
}) {
  return (
    <div className={noMargin ? "" : "mb-1"}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-light/15 text-emerald">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
      </div>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function SectionLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-emerald" />
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="text-sm font-medium text-destructive">{message}</p>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="text-sm text-muted-foreground">{text}</div>
    </div>
  );
}

/* ============================================================
   Section navigation
============================================================ */
type SectionKey =
  | "stats"
  | "channels"
  | "matches"
  | "tournaments"
  | "teams"
  | "countries"
  | "categories"
  | "reseed";

const SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "stats", label: "الإحصائيات", icon: ShieldCheck },
  { key: "channels", label: "القنوات", icon: Tv },
  { key: "matches", label: "المباريات", icon: Calendar },
  { key: "tournaments", label: "البطولات", icon: Trophy },
  { key: "teams", label: "الفرق", icon: Users },
  { key: "countries", label: "الدول", icon: Globe },
  { key: "categories", label: "التصنيفات", icon: Tags },
  { key: "reseed", label: "إعادة البيانات", icon: RefreshCw },
];

/* ============================================================
   Dashboard
============================================================ */
function Dashboard() {
  const admin = useAdmin((s) => s.admin);
  const logout = useAdmin((s) => s.logout);
  const setView = useNav((s) => s.setView);
  const [section, setSection] = React.useState<SectionKey>("stats");

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-5xl px-4 py-4 space-y-4">
        {/* Top bar */}
        <header className="sticky top-0 z-30 -mx-4 mb-2 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <AppLogo size={40} className="shadow-md" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-extrabold text-emerald">
                لوحة تحكم <span className="gold-text">WazaNI</span>
              </h1>
              <p className="truncate text-[11px] text-muted-foreground">
                مرحبًا، {admin?.name || "المسؤول"}
                {admin?.email ? ` · ${admin.email}` : ""}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView({ name: "home" })}
              className="hidden sm:inline-flex"
            >
              <ChevronLeft className="h-4 w-4" />
              للموقع
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await logout();
                toast.success("تم تسجيل الخروج");
              }}
            >
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </header>

        {/* Section nav (chips) */}
        <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {SECTIONS.map((s) => {
            const active = section === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors " +
                  (active
                    ? "border-emerald bg-emerald text-white shadow-sm"
                    : "border-border bg-card text-foreground hover:bg-secondary")
                }
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <Separator className="mb-2" />

        {/* Section content */}
        <main className="pb-12">
          {section === "stats" && <StatsSection />}
          {section === "channels" && <ChannelsSection />}
          {section === "matches" && <MatchesSection />}
          {section === "tournaments" && <TournamentsSection />}
          {section === "teams" && <TeamsSection />}
          {section === "countries" && <CountriesSection />}
          {section === "categories" && <CategoriesSection />}
          {section === "reseed" && <ReseedSection />}
        </main>

        <footer className="mt-auto border-t border-border pt-4 text-center text-[11px] text-muted-foreground">
          <div className="flex items-center justify-center gap-1.5">
            <ListOrdered className="h-3 w-3" />
            <span>
              لوحة تحكم WazaNI TV · جميع التعديلات تنعكس مباشرة على الموقع
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   Root AdminView
============================================================ */
export function AdminView() {
  const admin = useAdmin((s) => s.admin);
  const loading = useAdmin((s) => s.loading);
  const load = useAdmin((s) => s.load);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald" />
          <p className="text-sm text-muted-foreground">جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}
