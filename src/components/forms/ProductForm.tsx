// src/components/forms/ProductForm.tsx
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productsApi, ProductDto, GstRateDto, UpsertProductRequest, GstSuggestionRequest, GstSuggestionResponse } from "@/../src/api/Products.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Lightbulb, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const UNITS = ["NOS", "KGS", "MTR", "LTR", "HRS", "DAYS", "PCS", "BOX", "SET"];

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(500).optional().or(z.literal("")),
  hsnSacCode: z.string().max(50).optional().or(z.literal("")),
  unit: z.string().min(1, "Please select a unit"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  gstRateId: z.string().min(1, "Please select a GST rate"),
  isService: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Props {
  product?: ProductDto | null;
  gstRates: GstRateDto[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, gstRates, onSuccess, onCancel }: Props) {
  const isEditing = !!product;
  const [saving, setSaving] = useState(false);
  const [suggestingGst, setSuggestingGst] = useState(false);
  const [gstSuggestion, setGstSuggestion] = useState<GstSuggestionResponse | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      hsnSacCode: product?.hsnSacCode ?? "",
      unit: product?.unit ?? "NOS",
      unitPrice: product?.unitPrice ?? 0,
      gstRateId: product?.gstRateId ?? "",
      isService: product?.isService ?? false,
    },
  });

  const isService = form.watch("isService");
  const hsnSacCode = form.watch("hsnSacCode");
  const currentGstRateId = form.watch("gstRateId");

  // Watch for HSN/SAC code changes and fetch suggestions
  useEffect(() => {
    if (!hsnSacCode || hsnSacCode.length < 2) {
      setGstSuggestion(null);
      setShowSuggestion(false);
      return;
    }

    const suggestGst = async () => {
      setSuggestingGst(true);
      try {
        const request: GstSuggestionRequest = {
          hsnSacCode,
          isService,
        };
        const response = await productsApi.suggestGstRate(request);
        setGstSuggestion(response);
        setShowSuggestion(response.isAutomatic);
      } catch (error) {
        // Silently fail - suggestions are not critical
        setGstSuggestion(null);
      } finally {
        setSuggestingGst(false);
      }
    };

    const debounceTimer = setTimeout(suggestGst, 500);
    return () => clearTimeout(debounceTimer);
  }, [hsnSacCode, isService]);

  // Auto-apply suggested GST rate if available and not already selected
  const applySuggestion = (rate: number) => {
    if (!rate) return;

    // Find the GST rate ID matching this rate
    const matchingGstRate = gstRates.find(r => r.rate === rate);
    if (matchingGstRate) {
      form.setValue("gstRateId", matchingGstRate.id);
      setShowSuggestion(false);
      toast.success(`GST rate of ${rate}% applied`);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    const payload: UpsertProductRequest = {
      name: data.name,
      description: data.description ?? "",
      hsnSacCode: data.hsnSacCode ?? "",
      unit: data.unit,
      unitPrice: data.unitPrice,
      gstRateId: data.gstRateId,
      isService: data.isService,
    };

    setSaving(true);
    try {
      if (isEditing && product) {
        await productsApi.update(product.id, payload);
        toast.success("Product updated");
      } else {
        await productsApi.create(payload);
        toast.success("Product created");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const getGstRateLabel = (rateId: string) => {
    return gstRates.find(r => r.id === rateId)?.rate ?? "-";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">

          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Product/Service Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Consulting Services" maxLength={255} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional description" rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="isService" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4 md:col-span-2">
              <div className="space-y-0.5">
                <FormLabel>Is this a Service?</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Services use SAC codes, Products use HSN codes
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="hsnSacCode" render={({ field }) => (
            <FormItem>
              <FormLabel>{isService ? "SAC Code" : "HSN Code"}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder={isService ? "998313" : "8471"}
                    {...field}
                  />
                  {suggestingGst && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* GST Suggestion Alert */}
          {gstSuggestion && showSuggestion && gstSuggestion.isAutomatic && (
            <Alert className="md:col-span-2 border-blue-200 bg-blue-50">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{gstSuggestion.message}</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Suggested GST rate: <strong>{gstSuggestion.suggestedRate}%</strong>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applySuggestion(gstSuggestion.suggestedRate || 0)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {gstSuggestion && !gstSuggestion.isAutomatic && (
            <Alert className="md:col-span-2 border-amber-200 bg-amber-50">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <p className="font-medium">{gstSuggestion.message}</p>
                <p className="text-sm text-amber-800 mt-1">
                  Please select a GST rate manually from the list below.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <FormField control={form.control} name="unit" render={({ field }) => (
            <FormItem>
              <FormLabel>Unit *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="unitPrice" render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Price (₹) *</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="gstRateId" render={({ field }) => (
            <FormItem>
              <FormLabel>
                GST Rate *
                {gstSuggestion?.isAutomatic && (
                  <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    Auto-suggested
                  </span>
                )}
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select GST rate" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {gstRates.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.rate}%
                      {gstSuggestion?.isAutomatic && gstSuggestion?.suggestedRate === r.rate && (
                        <span className="ml-2 text-xs text-green-600">(Suggested)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}