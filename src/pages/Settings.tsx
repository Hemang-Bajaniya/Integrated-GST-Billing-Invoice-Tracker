import { useEffect, useState, useCallback, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { BusinessProfile } from "@/types/database";
import { INDIAN_STATES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Building2,
  User,
  Users,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Lock,
  Link2,
  Copy,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { businessService } from "@/api/buisness.service";
import {
  adminUsersService,
  type AppUser,
  type AppRole,
} from "@/api/AdminUsers.service";
import {
  invitationsService,
  type PendingUser,
  type InviteRole,
} from "@/api/invitations.service";

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

const businessSchema = z.object({
  name: z.string().min(2, "Business name is required").max(200),
  gstin: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GSTIN format",
    )
    .optional()
    .or(z.literal("")),
  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format")
    .optional()
    .or(z.literal("")),
  address_line1: z.string().max(200).optional().or(z.literal("")),
  address_line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Invalid pincode")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  bank_name: z.string().max(100).optional().or(z.literal("")),
  bank_account_number: z.string().max(30).optional().or(z.literal("")),
  bank_ifsc: z.string().max(20).optional().or(z.literal("")),
  invoice_prefix: z.string().max(10).optional().or(z.literal("")),
});

const inviteUserSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Accountant", "Viewer"], {
    required_error: "Please select a role",
  }),
});

const editRoleSchema = z.object({
  role: z.enum(["Accountant", "Viewer"], {
    required_error: "Please select a role",
  }),
});

type BusinessFormData = z.infer<typeof businessSchema>;
type InviteUserData = z.infer<typeof inviteUserSchema>;
type EditRoleData = z.infer<typeof editRoleSchema>;

// ── Role badge colours ────────────────────────────────────────────────────────
const ROLE_BADGE: Record<AppRole, string> = {
  Admin: "bg-red-100 text-red-700 border-red-200",
  Accountant: "bg-blue-100 text-blue-700 border-blue-200",
  Viewer: "bg-gray-100 text-gray-600 border-gray-200",
};

// Indian city → state code mapping
const CITY_STATE_MAP: Record<string, string> = {
  mumbai: "MH", pune: "MH", nagpur: "MH", nashik: "MH", thane: "MH",
  delhi: "DL", "new delhi": "DL",
  bengaluru: "KA", bangalore: "KA", mysuru: "KA", mysore: "KA", hubli: "KA",
  chennai: "TN", coimbatore: "TN", madurai: "TN", salem: "TN",
  hyderabad: "TS", warangal: "TS", nizamabad: "TS",
  kolkata: "WB", howrah: "WB", durgapur: "WB", siliguri: "WB",
  ahmedabad: "GJ", surat: "GJ", vadodara: "GJ", rajkot: "GJ",
  jaipur: "RJ", jodhpur: "RJ", udaipur: "RJ", kota: "RJ",
  lucknow: "UP", kanpur: "UP", agra: "UP", varanasi: "UP", noida: "UP",
  bhopal: "MP", indore: "MP", gwalior: "MP", jabalpur: "MP",
  patna: "BR", gaya: "BR", bhagalpur: "BR",
  chandigarh: "CH",
  bhubaneswar: "OD", cuttack: "OD",
  guwahati: "AS", dibrugarh: "AS",
  thiruvananthapuram: "KL", kochi: "KL", kozhikode: "KL",
  ranchi: "JH", jamshedpur: "JH", dhanbad: "JH",
  raipur: "CT", bilaspur: "CT",
  dehradun: "UK", haridwar: "UK",
  shimla: "HP", manali: "HP",
  jammu: "JK", srinagar: "JK",
  goa: "GA", panaji: "GA",
  imphal: "MN", shillong: "ML", kohima: "NL", aizawl: "MZ",
  itanagar: "AR", agartala: "TR", gangtok: "SK",
  "port blair": "AN", kavaratti: "LD", silvassa: "DD",
  pondicherry: "PY", puducherry: "PY",
  leh: "LA",
};

// Major Indian pincodes organized by city
const CITY_PINCODES: Record<string, string[]> = {
  mumbai: ["400001", "400002", "400003", "400004", "400005", "400051", "400052", "400053", "400080", "400081"],
  delhi: ["110001", "110002", "110003", "110004", "110005", "110006", "110007", "110008", "110009", "110010"],
  bangalore: ["560001", "560002", "560034", "560040", "560047", "560064", "560091", "560092"],
  pune: ["411001", "411002", "411003", "411004", "411005", "411038"],
  bengaluru: ["560001", "560002", "560034", "560040", "560047", "560064"],
  hyderabad: ["500001", "500002", "500003", "500004", "500073", "500080"],
  chennai: ["600001", "600002", "600003", "600004", "600005", "600006"],
  kolkata: ["700001", "700006", "700007", "700109", "700120"],
  ahmedabad: ["380001", "380006", "380009", "380015", "380058"],
  jaipur: ["302001", "302002", "302003", "302004", "302015"],
  lucknow: ["226001", "226010", "226012", "226020"],
  kochi: ["682001", "682011", "682012", "682013", "682015"],
  thiruvananthapuram: ["695001", "695004", "695005", "695006"],
  chandigarh: ["160001", "160002", "160003", "160009"],
  goa: ["403001", "403002", "403006"],
};

function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  return useCallback((...args: Parameters<T>) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ── Read-only row helper (non-admin Business Profile view) ───────────────────
function ReadOnlyRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">
        {value?.trim() || (
          <span className="italic text-muted-foreground/60">—</span>
        )}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { profile, user, isAdmin } = useAuth();

  // ── Business profile state ────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  // Auto-fill state from pincode via Zippopotam.us API
  const lookupPincode = useCallback(async (pin: string, businessForm: any) => {
    if (!/^[1-9][0-9]{5}$/.test(pin)) return;
    try {
      const res = await fetch(`https://api.zippopotam.us/in/${pin}`);
      if (!res.ok) return;
      const data = await res.json();
      const place = data.places?.[0];
      if (!place) return;

      const stateAbbr: string = (place["state abbreviation"] || "").toUpperCase();
      const city: string = place["place name"] || "";

      if (stateAbbr && !businessForm.getValues("state")) {
        businessForm.setValue("state", stateAbbr, { shouldValidate: true });
      }
      if (city && !businessForm.getValues("city")) {
        businessForm.setValue("city", city, { shouldValidate: true });
      }
    } catch {
      // silently fail — network/API issues shouldn't block the form
    }
  }, []);

  // Auto-select state when city is typed
  const handleCityChange = useCallback((value: string, businessForm: any) => {
    businessForm.setValue("city", value);
    const key = value.trim().toLowerCase();
    const mappedState = CITY_STATE_MAP[key];
    if (mappedState) {
      businessForm.setValue("state", mappedState, { shouldValidate: true });
      toast.info(`State auto-selected: ${mappedState}`);
    }
  }, []);

  // Cross-validate: warn if city doesn't match selected state
  const handleStateChange = useCallback((value: string, businessForm: any) => {
    businessForm.setValue("state", value, { shouldValidate: true });
    const currentCity = businessForm.getValues("city")?.trim().toLowerCase();
    if (currentCity) {
      const expectedState = CITY_STATE_MAP[currentCity];
      if (expectedState && expectedState !== value) {
        toast.warning(`Note: "${businessForm.getValues("city")}" is typically in state ${expectedState}`);
      }
    }
  }, []);

  const debouncedPincodeLookup = useDebounce((pin: string, businessForm: any) => lookupPincode(pin, businessForm), 600);

  // ── Pincode search state ─────────────────────────────────────────────────
  const [pinOpen, setPinOpen] = useState(false);
  const [pinSearch, setPinSearch] = useState("");

  // Get available pincodes for selected city
  const getAvailablePincodes = (businessForm: any) => {
    const city = businessForm.getValues("city")?.trim().toLowerCase();
    if (!city) return [];
    return CITY_PINCODES[city] || [];
  };

  // Pincode suggestions based on search term
  const getPincodeSuggestions = (businessForm: any) => {
    return getAvailablePincodes(businessForm).filter((pin) =>
      pin.includes(pinSearch)
    );
  };

  const handlePincodeSelect = (pincode: string, businessForm: any) => {
    businessForm.setValue("pincode", pincode, { shouldValidate: true });
    setPinOpen(false);
    setPinSearch("");
    // Trigger pincode lookup to fill city/state
    debouncedPincodeLookup(pincode, businessForm);
  };


  // ── User management state ─────────────────────────────────────────────────
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Invite link state ─────────────────────────────────────────────────────
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkRole, setLinkRole] = useState<InviteRole>("Viewer");
  const [linkGenerating, setLinkGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // ── Pending approvals state ───────────────────────────────────────────────
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  // role override per pending row: invitationId → role
  const [approveRole, setApproveRole] = useState<Record<string, InviteRole>>({});

  // ── Forms ─────────────────────────────────────────────────────────────────
  const form = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      name: "", gstin: "", pan: "",
      address_line1: "", address_line2: "",
      city: "", state: "", pincode: "",
      phone: "", email: "",
      bank_name: "", bank_account_number: "", bank_ifsc: "",
      invoice_prefix: "INV",
    },
  });

  const inviteForm = useForm<InviteUserData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", password: "", role: "Viewer" },
  });

  const editRoleForm = useForm<EditRoleData>({
    resolver: zodResolver(editRoleSchema),
  });

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (profile?.business_id) {
      fetchBusinessProfile();
    } else {
      setLoading(false);
    }
  }, [profile?.business_id]);

  const handleTabChange = (tab: string) => {
    if (tab === "users" && isAdmin) {
      if (users.length === 0) fetchUsers();
      if (pendingUsers.length === 0) fetchPending();
    }
  };

  // ── Fetch business profile ────────────────────────────────────────────────
  const fetchBusinessProfile = async () => {
    try {
      const data = await businessService.get();
      setBusinessProfile(data);
      form.reset({
        name: data.name || "",
        gstin: data.gstin || "",
        pan: data.pan || "",
        address_line1: data.address_line1 || "",
        address_line2: data.address_line2 || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
        phone: data.phone || "",
        email: data.email || "",
        bank_name: data.bank_name || "",
        bank_account_number: data.bank_account_number || "",
        bank_ifsc: data.bank_ifsc || "",
        invoice_prefix: data.invoice_prefix || "INV",
      });
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        toast.error("Failed to load business profile");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── GET /api/adminusers ───────────────────────────────────────────────────
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await adminUsersService.getAll();
      setUsers(data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  // ── GET /api/invitations/pending ──────────────────────────────────────────
  const fetchPending = async () => {
    setPendingLoading(true);
    try {
      const data = await invitationsService.getPending();
      setPendingUsers(data);
    } catch {
      toast.error("Failed to load pending approvals");
    } finally {
      setPendingLoading(false);
    }
  };

  // ── Business profile submit (Admin only) ──────────────────────────────────
  const onSubmit = async (data: BusinessFormData) => {
    setSaving(true);
    try {
      const businessData: Partial<BusinessProfile> = {
        name: data.name,
        gstin: data.gstin || null,
        pan: data.pan || null,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        phone: data.phone || null,
        email: data.email || null,
        bank_name: data.bank_name || null,
        bank_account_number: data.bank_account_number || null,
        bank_ifsc: data.bank_ifsc || null,
        invoice_prefix: data.invoice_prefix || "INV",
      };

      if (businessProfile) {
        await businessService.update(businessProfile.id, businessData);
        toast.success("Business profile updated successfully");
      } else {
        const newBusiness = await businessService.create(businessData);
        setBusinessProfile(newBusiness);
        toast.success("Business profile created successfully");
        window.location.reload();
      }
    } catch (error: any) {
      const message =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.title ?? error.message ?? "Failed to save business profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ── POST /api/adminusers (direct create) ──────────────────────────────────
  const onInviteUser = async (data: InviteUserData) => {
    setInviting(true);
    try {
      await adminUsersService.create({
        email: data.email,
        password: data.password,
        roles: [data.role],
      });
      toast.success(`User ${data.email} created with ${data.role} role`);
      inviteForm.reset({ email: "", password: "", role: "Viewer" });
      setInviteOpen(false);
      await fetchUsers();
    } catch (error: any) {
      const message =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.title ?? error.message ?? "Failed to create user";
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  // ── Open edit role dialog ─────────────────────────────────────────────────
  const openEditRole = (u: AppUser) => {
    setEditUser(u);
    const currentRole =
      u.roles.find(
        (r): r is "Accountant" | "Viewer" =>
          r === "Accountant" || r === "Viewer",
      ) ?? "Viewer";
    editRoleForm.setValue("role", currentRole);
    setEditOpen(true);
  };

  // ── PUT /api/adminusers/roles ─────────────────────────────────────────────
  const onSaveRole = async (data: EditRoleData) => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      await adminUsersService.updateRoles({
        userId: editUser.id,
        roles: [data.role],
      });
      toast.success(`Role updated to ${data.role}`);
      setEditOpen(false);
      setEditUser(null);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id ? { ...u, roles: [data.role] } : u,
        ),
      );
    } catch (error: any) {
      const message =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.title ?? error.message ?? "Failed to update role";
      toast.error(message);
    } finally {
      setEditSaving(false);
    }
  };

  // ── DELETE /api/adminusers/{id} ───────────────────────────────────────────
  const onDeleteUser = async (userId: string, email: string) => {
    setDeletingId(userId);
    try {
      await adminUsersService.deleteUser(userId);
      toast.success(`${email} removed from your business`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error: any) {
      const message =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.title ?? error.message ?? "Failed to remove user";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  // ── POST /api/invitations — generate invite link ──────────────────────────
  const onGenerateLink = async () => {
    setLinkGenerating(true);
    setGeneratedLink(null);
    try {
      const result = await invitationsService.create(linkRole, 7);
      const link = `${window.location.origin}/register?token=${result.token}`;
      setGeneratedLink(link);
    } catch (error: any) {
      const message =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.title ?? error.message ?? "Failed to generate link";
      toast.error(message);
    } finally {
      setLinkGenerating(false);
    }
  };

  const copyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const closeLinkDialog = () => {
    setLinkOpen(false);
    setGeneratedLink(null);
    setLinkCopied(false);
    setLinkRole("Viewer");
  };

  // ── PUT /api/invitations/{id}/approve ────────────────────────────────────
  const onApproveUser = async (inv: PendingUser) => {
    setProcessingId(inv.invitationId);
    try {
      const roleOverride = approveRole[inv.invitationId];
      await invitationsService.approve(inv.invitationId, roleOverride);
      toast.success(`${inv.email} approved as ${roleOverride ?? inv.assignedRole}`);
      setPendingUsers((prev) => prev.filter((p) => p.invitationId !== inv.invitationId));
      // Refresh active users list so the newly approved user appears
      await fetchUsers();
    } catch (error: any) {
      const message =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.title ?? error.message ?? "Failed to approve user";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  // ── PUT /api/invitations/{id}/reject ─────────────────────────────────────
  const onRejectUser = async (inv: PendingUser) => {
    setProcessingId(inv.invitationId);
    try {
      await invitationsService.reject(inv.invitationId);
      toast.success(`${inv.email}'s request rejected`);
      setPendingUsers((prev) => prev.filter((p) => p.invitationId !== inv.invitationId));
    } catch (error: any) {
      const message =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.title ?? error.message ?? "Failed to reject user";
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Manage your business profile, team members and preferences"
            : "View your business profile and account details"}
        </p>
      </div>

      <Tabs
        defaultValue="business"
        className="space-y-4"
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="business">
            <Building2 className="mr-2 h-4 w-4" />
            Business Profile
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users
              {pendingUsers.length > 0 && (
                <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {pendingUsers.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════════
            BUSINESS PROFILE TAB
            Admin  → editable form
            Others → read-only labelled fields with "Read only" badge
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="business">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "This information will appear on your invoices"
                    : "Contact your administrator to make changes"}
                </CardDescription>
              </div>
              {!isAdmin && (
                <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <Lock className="h-3 w-3" />
                  Read only
                </span>
              )}
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : isAdmin ? (
                /* ── ADMIN: editable form ─── */
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Business Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Company Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gstin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GSTIN</FormLabel>
                            <FormControl>
                              <Input placeholder="22AAAAA0000A1Z5" {...field} className="uppercase" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PAN</FormLabel>
                            <FormControl>
                              <Input placeholder="AAAAA0000A" {...field} className="uppercase" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="business@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+91 9876543210" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address_line1"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address_line2"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Address Line 2</FormLabel>
                            <FormControl>
                              <Input placeholder="Apartment, suite, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Mumbai" {...field} onChange={(e) => handleCityChange(e.target.value, form)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={(val) => { field.onChange(val); handleStateChange(val, form); }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {INDIAN_STATES.map((s) => (
                                  <SelectItem key={s.code} value={s.code}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <div className="flex gap-2">
                              <FormControl className="flex-1">
                                <Input
                                  placeholder="400001"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    debouncedPincodeLookup(e.target.value, form);
                                  }}
                                />
                              </FormControl>
                              {getAvailablePincodes(form).length > 0 && (
                                <Popover open={pinOpen} onOpenChange={setPinOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="px-3">
                                      Browse
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[200px] p-0" align="end">
                                    <Command>
                                      <CommandInput
                                        placeholder="Search pincode..."
                                        value={pinSearch}
                                        onValueChange={setPinSearch}
                                      />
                                      <CommandEmpty>No pincodes found.</CommandEmpty>
                                      <CommandList>
                                        <CommandGroup>
                                          {getPincodeSuggestions(form).map((pin) => (
                                            <CommandItem
                                              key={pin}
                                              value={pin}
                                              onSelect={() => handlePincodeSelect(pin, form)}
                                            >
                                              <Check
                                                className={`mr-2 h-4 w-4 ${field.value === pin ? "opacity-100" : "opacity-0"
                                                  }`}
                                              />
                                              {pin}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="invoice_prefix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Prefix</FormLabel>
                            <FormControl>
                              <Input placeholder="INV" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="mb-4 text-lg font-medium">Bank Details</h3>
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="bank_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Name</FormLabel>
                              <FormControl>
                                <Input placeholder="HDFC Bank" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bank_account_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Number</FormLabel>
                              <FormControl>
                                <Input placeholder="1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bank_ifsc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>IFSC Code</FormLabel>
                              <FormControl>
                                <Input placeholder="HDFC0001234" {...field} className="uppercase" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {businessProfile ? "Update Profile" : "Create Profile"}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : businessProfile ? (
                /* ── NON-ADMIN: read-only view ── */
                <div className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <ReadOnlyRow label="Business Name" value={businessProfile.name} />
                    </div>
                    <ReadOnlyRow label="GSTIN" value={businessProfile.gstin} />
                    <ReadOnlyRow label="PAN" value={businessProfile.pan} />
                    <ReadOnlyRow label="Email" value={businessProfile.email} />
                    <ReadOnlyRow label="Phone" value={businessProfile.phone} />
                    <div className="md:col-span-2">
                      <ReadOnlyRow label="Address Line 1" value={businessProfile.address_line1} />
                    </div>
                    <div className="md:col-span-2">
                      <ReadOnlyRow label="Address Line 2" value={businessProfile.address_line2} />
                    </div>
                    <ReadOnlyRow label="City" value={businessProfile.city} />
                    <ReadOnlyRow
                      label="State"
                      value={
                        INDIAN_STATES.find((s) => s.code === businessProfile.state)?.name ??
                        businessProfile.state
                      }
                    />
                    <ReadOnlyRow label="Pincode" value={businessProfile.pincode} />
                    <ReadOnlyRow label="Invoice Prefix" value={businessProfile.invoice_prefix} />
                  </div>

                  <div className="border-t pt-5">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Bank Details
                    </h3>
                    <div className="grid gap-5 md:grid-cols-3">
                      <ReadOnlyRow label="Bank Name" value={businessProfile.bank_name} />
                      <ReadOnlyRow label="Account Number" value={businessProfile.bank_account_number} />
                      <ReadOnlyRow label="IFSC Code" value={businessProfile.bank_ifsc} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No business profile has been set up yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            ACCOUNT TAB — same for all roles
        ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your personal account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-muted-foreground">
                    {profile?.full_name || "Not set"}
                  </p>
                </div>
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Role</p>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize
                        ${profile?.role === "admin"
                          ? ROLE_BADGE.Admin
                          : profile?.role === "accountant"
                            ? ROLE_BADGE.Accountant
                            : ROLE_BADGE.Viewer
                        }`}
                    >
                      {profile?.role}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            USERS TAB — Admin only
            Sections:
              1. Pending Approvals  — users who self-registered via invite link
              2. Active Team Members — existing users (edit role, remove)
            Header actions:
              • "Generate Invite Link" → POST /api/invitations
              • "Add User" → POST /api/adminusers (direct create)
        ══════════════════════════════════════════════════════════════════ */}
        {isAdmin && (
          <TabsContent value="users">

            {/* ── SECTION 1: Pending Approvals ─────────────────────────── */}
            {(pendingLoading || pendingUsers.length > 0) && (
              <Card className="mb-4 border-amber-200 bg-amber-50/40">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Pending Approvals
                    {pendingUsers.length > 0 && (
                      <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">
                        {pendingUsers.length}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    These users registered via an invite link and are waiting for
                    your approval. They cannot log in until you approve them.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {pendingLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Requested Role</TableHead>
                          <TableHead>Override Role</TableHead>
                          <TableHead className="w-[180px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingUsers.map((p) => {
                          const isProcessing = processingId === p.invitationId;
                          return (
                            <TableRow key={p.invitationId}>
                              <TableCell className="font-medium">{p.email}</TableCell>

                              <TableCell>
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${p.assignedRole === "Accountant"
                                  ? ROLE_BADGE.Accountant
                                  : ROLE_BADGE.Viewer
                                  }`}>
                                  {p.assignedRole}
                                </span>
                              </TableCell>

                              {/* Role override dropdown — admin can change before approving */}
                              <TableCell>
                                <Select
                                  value={approveRole[p.invitationId] ?? p.assignedRole}
                                  onValueChange={(v) =>
                                    setApproveRole((prev) => ({
                                      ...prev,
                                      [p.invitationId]: v as InviteRole,
                                    }))
                                  }
                                  disabled={isProcessing}
                                >
                                  <SelectTrigger className="h-8 w-36 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Accountant">Accountant</SelectItem>
                                    <SelectItem value="Viewer">Viewer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>

                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">

                                  {/* Approve */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                                    disabled={isProcessing}
                                    onClick={() => onApproveUser(p)}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <>
                                        <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                                        Approve
                                      </>
                                    )}
                                  </Button>

                                  {/* Reject */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        disabled={isProcessing}
                                      >
                                        <UserX className="mr-1.5 h-3.5 w-3.5" />
                                        Reject
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Reject access request?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          <span className="font-medium">{p.email}</span>'s account
                                          will be permanently deleted. They will need a new invite
                                          link to try again.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          onClick={() => onRejectUser(p)}
                                        >
                                          Reject & Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>

                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── SECTION 2: Active Team Members ───────────────────────── */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Create logins for team members and control what they can
                    access. Accountants can create and edit. Viewers have
                    read-only access.
                  </CardDescription>
                </div>

                <div className="flex shrink-0 items-center gap-2">

                  {/* ── Generate Invite Link ─────────────────────────────── */}
                  <Dialog
                    open={linkOpen}
                    onOpenChange={(o) => {
                      if (!o) closeLinkDialog();
                      else setLinkOpen(true);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Link2 className="mr-2 h-4 w-4" />
                        Invite Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="">
                      <DialogHeader>
                        <DialogTitle>Generate Invite Link</DialogTitle>
                        <DialogDescription>
                          Share this link with a new team member. They can
                          self-register and will need your approval before
                          they can log in.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-2">
                        {/* Role picker */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Access Level</p>
                          <Select
                            value={linkRole}
                            onValueChange={(v) => setLinkRole(v as InviteRole)}
                            disabled={!!generatedLink}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Accountant">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium">Accountant</span>
                                  <span className="text-xs text-muted-foreground">
                                    Create & edit invoices, customers, products
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Viewer">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium">Viewer</span>
                                  <span className="text-xs text-muted-foreground">
                                    Read-only — cannot create or edit anything
                                  </span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Generated link display */}
                        {generatedLink && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Your invite link</p>

                            <div className="relative">
                              <input
                                readOnly
                                value={generatedLink}
                                className="w-full rounded-lg border bg-muted/40 px-3 py-2 pr-10 text-xs font-mono text-muted-foreground outline-none"
                              />

                              <button
                                onClick={copyLink}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-muted"
                              >
                                {linkCopied ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              This link expires in 7 days and can only be used once. The user will need
                              your approval after registering.
                            </p>
                          </div>
                        )}
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={closeLinkDialog}>
                          Close
                        </Button>
                        {!generatedLink ? (
                          <Button
                            onClick={onGenerateLink}
                            disabled={linkGenerating}
                          >
                            {linkGenerating && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Generate Link
                          </Button>
                        ) : (
                          <Button onClick={copyLink} variant="default">
                            {linkCopied ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Link
                              </>
                            )}
                          </Button>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* ── Add User (direct) ───────────────────────────────── */}
                  <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                          Create a login for a team member and assign their
                          access level. They can log in immediately.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...inviteForm}>
                        <form
                          onSubmit={inviteForm.handleSubmit(onInviteUser)}
                          className="space-y-4"
                        >
                          <FormField
                            control={inviteForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="colleague@company.com"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={inviteForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Temporary Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="Min. 6 characters"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={inviteForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Access Level</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Accountant">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-medium">Accountant</span>
                                        <span className="text-xs text-muted-foreground">
                                          Create & edit invoices, customers, products
                                        </span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="Viewer">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="font-medium">Viewer</span>
                                        <span className="text-xs text-muted-foreground">
                                          Read-only — cannot create or edit anything
                                        </span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter className="pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                inviteForm.reset();
                                setInviteOpen(false);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={inviting}>
                              {inviting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Create User
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent>
                {/* Role legend */}
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  {(["Admin", "Accountant", "Viewer"] as AppRole[]).map((r) => (
                    <span
                      key={r}
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[r]}`}
                    >
                      {r}
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground">
                    Admin role is reserved for account owners only.
                  </span>
                </div>

                {/* Users table */}
                {usersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium">No team members yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use "Add User" to create a login directly, or "Invite
                      Link" to let someone self-register.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="w-[200px] text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => {
                        const isCurrentUser = u.id === user?.id;
                        const isUserAdmin = u.roles.includes("Admin");
                        const isDeleting = deletingId === u.id;

                        return (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">
                              {u.email}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {u.roles.map((r) => (
                                  <span
                                    key={r}
                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[r]}`}
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              {!isCurrentUser && !isUserAdmin ? (
                                <div className="flex items-center justify-end gap-1">
                                  {/* Edit Role */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isDeleting}
                                    onClick={() => openEditRole(u)}
                                  >
                                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                    Edit
                                  </Button>

                                  {/* Remove */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isDeleting}
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        {isDeleting ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <>
                                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                            Remove
                                          </>
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove user?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          <span className="font-medium">{u.email}</span>{" "}
                                          will immediately lose all access to this
                                          business. This cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          onClick={() => onDeleteUser(u.id, u.email)}
                                        >
                                          Remove
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              ) : (
                                <span className="pr-2 text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* ── Edit Role Dialog ─────────────────────────────────────── */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Change Role</DialogTitle>
                  <DialogDescription>
                    Updating access for{" "}
                    <span className="font-medium text-foreground">
                      {editUser?.email}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <Form {...editRoleForm}>
                  <form
                    onSubmit={editRoleForm.handleSubmit(onSaveRole)}
                    className="space-y-4"
                  >
                    <FormField
                      control={editRoleForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Accountant">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium">Accountant</span>
                                  <span className="text-xs text-muted-foreground">
                                    Create & edit data
                                  </span>
                                </div>
                              </SelectItem>
                              <SelectItem value="Viewer">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium">Viewer</span>
                                  <span className="text-xs text-muted-foreground">
                                    Read-only access
                                  </span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          editRoleForm.reset();
                          setEditOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={editSaving}>
                        {editSaving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent >
        )
        }
      </Tabs >
    </div >
  );
}