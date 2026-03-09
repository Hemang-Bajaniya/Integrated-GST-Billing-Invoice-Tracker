// src/pages/RegisterViaInvite.tsx
// Route: /register?token=<uuid>   (add to your router — no auth guard)

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card, CardContent, CardDescription,
    CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Form, FormControl, FormField,
    FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Loader2, Building2, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { invitationsService, type InvitationInfo } from "@/api/invitations.service";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

const ROLE_STYLE: Record<string, { cls: string; desc: string }> = {
    Accountant: { cls: "bg-blue-100 text-blue-700 border-blue-200", desc: "Create & edit invoices, customers, products" },
    Viewer: { cls: "bg-gray-100 text-gray-600 border-gray-200", desc: "Read-only — cannot create or edit anything" },
};

type Stage = "loading" | "invalid" | "form" | "success";

// ── Component ─────────────────────────────────────────────────────────────────
export default function RegisterViaInvite() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = params.get("token") ?? "";

    const [stage, setStage] = useState<Stage>("loading");
    const [info, setInfo] = useState<InvitationInfo | null>(null);
    const [errMsg, setErrMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "", confirmPassword: "" },
    });

    // Validate token on mount
    useEffect(() => {
        if (!token) { setErrMsg("No invitation token found in this link."); setStage("invalid"); return; }
        invitationsService.validate(token)
            .then(d => { setInfo(d); setStage("form"); })
            .catch(e => {
                setErrMsg(
                    typeof e.response?.data === "string" ? e.response.data
                        : e.response?.data?.title ?? "This invitation link is invalid or has expired.",
                );
                setStage("invalid");
            });
    }, [token]);

    const onSubmit = async (data: FormData) => {
        setSubmitting(true);
        try {
            const res = await invitationsService.accept(token, data.email, data.password);
            toast.success(res.message ?? "Registration submitted!");
            setStage("success");
        } catch (e: any) {
            toast.error(
                typeof e.response?.data === "string" ? e.response.data
                    : e.response?.data?.title ?? "Registration failed. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-md shadow-lg">

                {/* Loading */}
                {stage === "loading" && (
                    <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Validating your invitation…</p>
                    </CardContent>
                )}

                {/* Invalid */}
                {stage === "invalid" && (
                    <>
                        <CardHeader className="space-y-2 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <CardTitle>Invitation Invalid</CardTitle>
                            <CardDescription>{errMsg}</CardDescription>
                        </CardHeader>
                        <CardFooter className="justify-center pt-0">
                            <Button variant="outline" onClick={() => navigate("/auth")}>Go to Sign In</Button>
                        </CardFooter>
                    </>
                )}

                {/* Registration form */}
                {stage === "form" && info && (
                    <>
                        <CardHeader className="space-y-1 text-center">
                            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                                <Building2 className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <CardTitle className="text-xl">You've been invited</CardTitle>
                            <CardDescription>
                                Create your account to join{" "}
                                <span className="font-semibold text-foreground">{info.businessName}</span>
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {/* Invitation context */}
                            <div className="rounded-lg border bg-muted/40 p-3">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="space-y-1.5">
                                        <p className="text-xs text-muted-foreground">You will be assigned</p>
                                        {(() => {
                                            const s = ROLE_STYLE[info.assignedRole] ?? ROLE_STYLE.Viewer;
                                            return (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${s.cls}`}>
                                                        {info.assignedRole}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{s.desc}</span>
                                                </div>
                                            );
                                        })()}
                                        <p className="text-xs text-amber-600">
                                            ⏳ Your account will require admin approval before you can log in.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl><Input type="password" placeholder="Min. 6 characters" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl><Input type="password" placeholder="Repeat password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" className="w-full" disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Account
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>

                        <CardFooter className="justify-center pb-4 pt-0">
                            <p className="text-xs text-muted-foreground">
                                Already have an account?{" "}
                                <button type="button" className="underline underline-offset-2 hover:text-foreground"
                                    onClick={() => navigate("/auth")}>Sign in</button>
                            </p>
                        </CardFooter>
                    </>
                )}

                {/* Success */}
                {stage === "success" && (
                    <>
                        <CardHeader className="space-y-2 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <CardTitle>Registration Submitted!</CardTitle>
                            <CardDescription>
                                Your account for{" "}
                                <span className="font-semibold text-foreground">{info?.businessName}</span>{" "}
                                is awaiting admin approval. You'll be notified once your access is activated.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="justify-center pt-0">
                            <Button variant="outline" onClick={() => navigate("/auth")}>Go to Sign In</Button>
                        </CardFooter>
                    </>
                )}

            </Card>
        </div>
    );
}