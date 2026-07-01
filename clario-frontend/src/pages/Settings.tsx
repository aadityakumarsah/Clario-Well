import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, User, Clock, Shield, Save, Loader2, Sun, Moon, Languages, CreditCard, LogOut, Sparkles, Pencil, Check, X as XIcon, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Button } from "@/components/ui/button";
import { getSettings, patchSettings } from "@/lib/api";
import type { SettingsData } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/useAccess";
import { createCheckoutSession } from "@/lib/subscription";
import { isTrialActive, getTrialDaysLeft } from "@/lib/trial";
import { supabase } from "@/lib/supabase";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const LANGUAGES = [
  { code: "en", native: "English" },
  { code: "ne", native: "नेपाली" },
];

type FormState = Pick<
  SettingsData,
  "name" | "daily_reminder" | "streak_notifications" | "weekly_digest" | "reminder_time"
>;

function isDirty(form: FormState, remote: SettingsData): boolean {
  return (
    form.name !== remote.name ||
    form.daily_reminder !== remote.daily_reminder ||
    form.streak_notifications !== remote.streak_notifications ||
    form.weekly_digest !== remote.weekly_digest ||
    form.reminder_time !== remote.reminder_time
  );
}

function diff(form: FormState, remote: SettingsData): Partial<FormState> {
  const out: Partial<FormState> = {};
  if (form.name !== remote.name) out.name = form.name;
  if (form.daily_reminder !== remote.daily_reminder) out.daily_reminder = form.daily_reminder;
  if (form.streak_notifications !== remote.streak_notifications)
    out.streak_notifications = form.streak_notifications;
  if (form.weekly_digest !== remote.weekly_digest) out.weekly_digest = form.weekly_digest;
  if (form.reminder_time !== remote.reminder_time) out.reminder_time = form.reminder_time;
  return out;
}

// ── component ─────────────────────────────────────────────────────────────────

const Settings = () => {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language || "en");
  const { user, signOut } = useAuth();
  const { isPremium, trialDaysLeft, plan: subPlan, expiresAt } = useAccess();
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // ── Profile editing state ──────────────────────────────────────────────────
  type ProfileField = "name" | "email";
  const [editingField, setEditingField] = useState<ProfileField | null>(null);
  const [profileDraft, setProfileDraft] = useState({ name: "", email: "" });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<ProfileField | null>(null);

  // Seed draft from live user data whenever user changes
  useEffect(() => {
    setProfileDraft({
      name: user?.user_metadata?.full_name ?? "",
      email: user?.email ?? "",
    });
  }, [user]);

  const startEdit = (field: ProfileField) => {
    setEditingField(field);
    setProfileError(null);
    setProfileSuccess(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setProfileError(null);
    setProfileDraft({
      name: user?.user_metadata?.full_name ?? "",
      email: user?.email ?? "",
    });
  };

  const validateAndSave = async (field: ProfileField) => {
    const value = profileDraft[field].trim();

    if (field === "name") {
      if (!value) return setProfileError("Name cannot be empty");
      if (value.length < 2) return setProfileError("Name must be at least 2 characters");
      if (value.length > 60) return setProfileError("Name is too long");
    }

    if (field === "email") {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(value)) return setProfileError("Enter a valid email address");
      if (value === user?.email) { setEditingField(null); return; }
    }

    setProfileSaving(true);
    setProfileError(null);

    try {
      if (field === "name") {
        const { error } = await supabase.auth.updateUser({ data: { full_name: value } });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.updateUser({ email: value });
        if (error) throw error;
        toast.info("Check your new email inbox to confirm the change.");
      }
      setProfileSuccess(field);
      setEditingField(null);
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setProfileSaving(false);
    }
  };

  const trialActive = isTrialActive(user?.created_at ?? null);

  const handleUpgrade = async (plan: "weekly" | "monthly" | "yearly") => {
    setUpgradeLoading(true);
    try {
      const url = await createCheckoutSession(plan);
      window.location.href = url;
    } catch {
      setUpgradeLoading(false);
    }
  };

  const { data: remote, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const [form, setForm] = useState<FormState>({
    name: "",
    daily_reminder: true,
    streak_notifications: true,
    weekly_digest: false,
    reminder_time: "08:00",
  });

  useEffect(() => {
    if (remote) {
      setForm({
        name: remote.name,
        daily_reminder: remote.daily_reminder,
        streak_notifications: remote.streak_notifications,
        weekly_digest: remote.weekly_digest,
        reminder_time: remote.reminder_time,
      });
    }
  }, [remote]);

  const dirty = remote ? isDirty(form, remote) : false;

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: () => patchSettings(diff(form, remote!)),
    onSuccess: (updated) => {
      queryClient.setQueryData(["settings"], updated);
      toast.success(t("settings.saved"));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleLanguageChange = (code: string) => {
    setCurrentLang(code);
    i18n.changeLanguage(code);
    localStorage.setItem("clario-lang", code);
  };

  const notifications = [
    {
      label: t("settings.daily_reminder"),
      desc: t("settings.daily_reminder_desc"),
      key: "daily_reminder" as const,
    },
    {
      label: t("settings.streak_notifs"),
      desc: t("settings.streak_notifs_desc"),
      key: "streak_notifications" as const,
    },
    {
      label: t("settings.weekly_digest"),
      desc: t("settings.weekly_digest_desc"),
      key: "weekly_digest" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">

      <Navbar />

      <div className="pt-28 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.p variants={fadeUp} className="font-body text-sm text-muted-foreground">
              {t("settings.account")}
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="font-display text-3xl md:text-4xl font-light text-foreground mt-1 mb-10"
            >
              {t("settings.title_1")} <span className="italic">{t("settings.title_2")}</span>
            </motion.h1>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* ── Account section ── */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-6 rounded-2xl bg-card border border-border/50 mb-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Account</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <p className="font-body text-sm text-muted-foreground">Email</p>
                    <p className="font-body text-sm text-foreground truncate max-w-[200px]">{user?.email ?? "—"}</p>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/40">
                    <p className="font-body text-sm text-muted-foreground">Status</p>
                    {isPremium ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#14532D", color: "#4ADE80" }}>
                        {subPlan ? subPlan.charAt(0).toUpperCase() + subPlan.slice(1) + " plan" : "Premium"}
                      </span>
                    ) : trialActive ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--card))", color: "hsl(var(--primary))" }}>
                        Trial · {trialDaysLeft}d left
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#450A0A", color: "#F87171" }}>
                        No active plan
                      </span>
                    )}
                  </div>
                  {isPremium && expiresAt && (
                    <div className="flex items-center justify-between py-2 border-b border-border/40">
                      <p className="font-body text-sm text-muted-foreground">Renews</p>
                      <p className="font-body text-sm text-foreground">
                        {new Date(expiresAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-red-400 transition-colors pt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </motion.section>

              {/* ── Subscription section ── */}
              {!isPremium && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="p-6 rounded-2xl mb-6"
                  style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ color: "hsl(var(--primary))" }}>✦</span>
                    <h2 className="font-display text-base font-semibold" style={{ color: "hsl(var(--foreground))" }}>Upgrade your plan</h2>
                  </div>
                  <p className="font-body text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {trialActive
                      ? `Your trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""}. Pick a plan to keep access.`
                      : "Your trial has ended. Subscribe to continue your wellness journey."}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { id: "weekly" as const, label: "Weekly", price: "$3", badge: false },
                      { id: "monthly" as const, label: "Monthly", price: "$10", badge: true },
                      { id: "yearly" as const, label: "Yearly", price: "$199", badge: false },
                    ]).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleUpgrade(p.id)}
                        disabled={upgradeLoading}
                        className="flex flex-col items-center py-4 rounded-xl font-body transition-all disabled:opacity-60 active:scale-[0.97]"
                        style={{
                          background: p.badge
                            ? "hsl(var(--primary))"
                            : "hsl(var(--muted))",
                          border: p.badge ? "none" : "1px solid hsl(var(--border))",
                          boxShadow: p.badge ? "0 4px 20px rgba(109,40,217,0.4)" : "none",
                          color: "#fff",
                        }}
                      >
                        <span className="font-bold text-lg">{p.price}</span>
                        <span className="text-sm mt-0.5" style={{ color: p.badge ? "rgba(58,46,42,0.80)" : "hsl(var(--muted-foreground))" }}>{p.label}</span>
                      </button>
                    ))}
                  </div>
                  {upgradeLoading && (
                    <p className="text-xs mt-3 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>Redirecting to checkout…</p>
                  )}
                </motion.section>
              )}

              {/* ── Profile section ── */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-card border border-border/50 mb-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">{t("settings.profile")}</h2>
                </div>

                <div className="space-y-5">
                  {/* Error banner */}
                  <AnimatePresence>
                    {profileError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2"
                      >
                        {profileError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Name field */}
                  {(["name", "email"] as const).map((field) => {
                    const isEditing = editingField === field;
                    const icon = field === "email" ? <Mail className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />;
                    const label = field === "name" ? t("settings.name") : t("settings.email");
                    const currentVal = field === "name"
                      ? (user?.user_metadata?.full_name ?? "—")
                      : (user?.email ?? "—");
                    const didSave = profileSuccess === field;

                    return (
                      <div key={field}>
                        <label className="font-body text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
                          {icon} {label}
                        </label>

                        {isEditing ? (
                          <div className="flex gap-2 items-center">
                            <input
                              autoFocus
                              type={field === "email" ? "email" : "text"}
                              value={profileDraft[field]}
                              onChange={(e) => {
                                setProfileDraft((d) => ({ ...d, [field]: e.target.value }));
                                setProfileError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") validateAndSave(field);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              placeholder={field === "name" ? "Your name" : "your@email.com"}
                              className="flex-1 px-4 py-3 rounded-xl bg-background border border-primary/40 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                            <button
                              onClick={() => validateAndSave(field)}
                              disabled={profileSaving}
                              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-50"
                              title="Save"
                            >
                              {profileSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-muted/40 hover:bg-muted text-muted-foreground"
                              title="Cancel"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-background border border-border/50">
                            <span className={`font-body text-sm flex-1 ${currentVal === "—" ? "text-muted-foreground" : "text-foreground"}`}>
                              {currentVal}
                              {didSave && (
                                <span className="ml-2 text-xs text-green-400">✓ Saved</span>
                              )}
                            </span>
                            <button
                              onClick={() => startEdit(field)}
                              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors shrink-0"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          </div>
                        )}

                        {field === "email" && isEditing && (
                          <p className="text-xs text-muted-foreground mt-1.5 pl-1">
                            A confirmation link will be sent to the new address.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-6 rounded-2xl bg-card border border-border/50 mb-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  {theme === "dark" ? (
                    <Moon className="w-4 h-4 text-primary" />
                  ) : (
                    <Sun className="w-4 h-4 text-primary" />
                  )}
                  <h2 className="font-display text-lg font-semibold text-foreground">{t("settings.appearance")}</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">{t("settings.appearance")}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full sm:w-[270px]">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`w-full px-4 py-2 rounded-xl border text-sm font-body transition-colors flex items-center justify-center gap-2 ${
                          theme === "light"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border/50 hover:border-primary/40"
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        {t("settings.light")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`w-full px-4 py-2 rounded-xl border text-sm font-body transition-colors flex items-center justify-center gap-2 ${
                          theme === "dark"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border/50 hover:border-primary/40"
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        {t("settings.dark")}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                    <div className="flex items-start gap-2">
                      <Languages className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">{t("settings.language")}</p>
                        <p className="font-body text-xs text-muted-foreground">{t("settings.language_desc")}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 w-full sm:w-[270px]">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full px-4 py-2 rounded-xl font-body text-sm transition-all duration-200 border ${
                            currentLang === lang.code
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border/50 hover:border-primary/40"
                          }`}
                        >
                          {lang.native}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-card border border-border/50 mb-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {t("settings.notifications")}
                  </h2>
                </div>
                <div className="space-y-4">
                  {notifications.map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">
                          {pref.label}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">{pref.desc}</p>
                      </div>
                      <button
                        onClick={() => set(pref.key, !form[pref.key])}
                        className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                          form[pref.key] ? "bg-primary" : "bg-border"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-primary-foreground shadow-sm absolute top-0.5 transition-transform duration-200 ${
                            form[pref.key] ? "translate-x-[22px]" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 rounded-2xl bg-card border border-border/50 mb-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {t("settings.reminder_time")}
                  </h2>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <input
                    type="time"
                    value={form.reminder_time}
                    onChange={(e) => set("reminder_time", e.target.value)}
                    className="px-4 py-3 rounded-xl bg-background border border-border/50 font-body text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
                  />
                  <AnimatePresence>
                    {dirty && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Button onClick={() => save()} disabled={isSaving} size="sm">
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {t("settings.save_changes")}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 rounded-2xl bg-card border border-border/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">{t("settings.privacy")}</h2>
                </div>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {t("settings.privacy_desc")}
                </p>
              </motion.section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
