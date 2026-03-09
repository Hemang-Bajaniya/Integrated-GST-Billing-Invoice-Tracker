import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Customer } from "@/types/database";
import { INDIAN_STATES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { customersService } from "@/api/customers.service";

// Indian city → state code mapping (expand as needed)
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

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
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
  is_active: z.boolean(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer | null;
  onSuccess: () => void;
  onCancel: () => void;
}



export function CustomerForm({
  customer,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinSearch, setPinSearch] = useState("");

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || "",
      gstin: customer?.gstin || "",
      pan: customer?.pan || "",
      address_line1: customer?.address_line1 || "",
      address_line2: customer?.address_line2 || "",
      city: customer?.city || "",
      state: customer?.state || "",
      pincode: customer?.pincode || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      is_active: customer?.is_active ?? true,
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    try {
      const customerData = {
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
        is_active: data.is_active,
      };

      if (customer) {
        await customersService.update(customer.id, customerData);
        toast.success("Customer updated successfully");
      } else {
        await customersService.create(customerData);
        toast.success("Customer added successfully");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving customer:", error);
      const message = error.response?.data?.message || error.message || "Failed to save customer";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fill state from pincode via Zippopotam.us API
  const lookupPincode = useCallback(async (pin: string) => {
    if (!/^[1-9][0-9]{5}$/.test(pin)) return;
    try {
      const res = await fetch(`https://api.zippopotam.us/in/${pin}`);
      if (!res.ok) return;
      const data = await res.json();
      const place = data.places?.[0];
      if (!place) return;

      // Map full state name from API to our 2-letter code
      const stateName: string = (place["state"] || "").toLowerCase();
      const stateAbbr: string = (place["state abbreviation"] || "").toUpperCase();

      // Zippopotam returns abbreviations like "MH", "GJ" etc.
      const matchedState = stateAbbr || "";
      const city: string = place["place name"] || "";

      if (matchedState && !form.getValues("state")) {
        form.setValue("state", matchedState, { shouldValidate: true });
      }
      if (city && !form.getValues("city")) {
        form.setValue("city", city, { shouldValidate: true });
      }
    } catch {
      // silently fail — network/API issues shouldn't block the form
    }
  }, [form]);

  const debouncedPincodeLookup = useDebounce(lookupPincode, 600);

  // Auto-select state when city is typed
  const handleCityChange = (value: string) => {
    form.setValue("city", value);
    const key = value.trim().toLowerCase();
    const mappedState = CITY_STATE_MAP[key];
    if (mappedState) {
      form.setValue("state", mappedState, { shouldValidate: true });
      toast.info(`State auto-selected: ${mappedState}`);
    }
  };

  // Cross-validate: warn if city doesn't match selected state
  const handleStateChange = (value: string) => {
    form.setValue("state", value, { shouldValidate: true });
    const currentCity = form.getValues("city")?.trim().toLowerCase();
    if (currentCity) {
      const expectedState = CITY_STATE_MAP[currentCity];
      if (expectedState && expectedState !== value) {
        toast.warning(`Note: "${form.getValues("city")}" is typically in state ${expectedState}`);
      }
    }
  };

  // Get available pincodes for selected city
  const getAvailablePincodes = () => {
    const city = form.getValues("city")?.trim().toLowerCase();
    if (!city) return [];
    return CITY_PINCODES[city] || [];
  };

  // Pincode suggestions based on search term
  const pincodeSuggestions = getAvailablePincodes().filter((pin) =>
    pin.includes(pinSearch)
  );

  const handlePincodeSelect = (pincode: string) => {
    form.setValue("pincode", pincode, { shouldValidate: true });
    setPinOpen(false);
    setPinSearch("");
    // Trigger pincode lookup to fill city/state
    debouncedPincodeLookup(pincode);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Customer Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer name" {...field} />
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
                  <Input
                    placeholder="22AAAAA0000A1Z5"
                    {...field}
                    className="uppercase"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}

                  />
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
                  <Input
                    placeholder="AAAAA0000A"
                    {...field}
                    className="uppercase"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
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
                  <Input
                    type="email"
                    placeholder="customer@example.com"
                    {...field}
                  />
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
                  <Input placeholder="City" {...field} onChange={(e) => handleCityChange(e.target.value)} />
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
                <Select onValueChange={(val) => { field.onChange(val); handleStateChange(val); }} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state.code} value={state.code} >
                        {state.name}
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
                        debouncedPincodeLookup(e.target.value);
                      }}
                    />
                  </FormControl>
                  {getAvailablePincodes().length > 0 && (
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
                              {pincodeSuggestions.map((pin) => (
                                <CommandItem
                                  key={pin}
                                  value={pin}
                                  onSelect={() => handlePincodeSelect(pin)}
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
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Inactive customers won't appear in dropdowns
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {customer ? "Update Customer" : "Add Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
