import { useState, useEffect } from 'react';
import { businessApi, type BusinessProfileDto, type UpsertBusinessProfileRequest } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function Settings() {
  const [business, setBusiness] = useState<BusinessProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state mirrors the business profile fields
  const [form, setForm] = useState<UpsertBusinessProfileRequest>({
    name: '',
    gstin: '',
    pan: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    invoicePrefix: 'INV',
  });

  useEffect(() => {
    businessApi.get()
      .then((data) => {
        setBusiness(data);
        setForm({
          name: data.name ?? '',
          gstin: data.gstin ?? '',
          pan: data.pan ?? '',
          addressLine1: data.addressLine1 ?? '',
          addressLine2: data.addressLine2 ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          pincode: data.pincode ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          bankName: data.bankName ?? '',
          bankAccountNumber: data.bankAccountNumber ?? '',
          bankIfsc: data.bankIfsc ?? '',
          invoicePrefix: data.invoicePrefix ?? 'INV',
        });
      })
      .catch(() => {
        // No business profile yet – that's fine
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (field: keyof UpsertBusinessProfileRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (business?.id) {
        await businessApi.update(business.id, form);
        toast.success('Business profile updated');
      } else {
        const created = await businessApi.create(form);
        setBusiness(created);
        toast.success('Business profile created');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading settings...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile and preferences</p>
      </div>

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business Profile</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Name *</Label>
                    <Input value={form.name ?? ''} onChange={set('name')} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email ?? ''} onChange={set('email')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={form.phone ?? ''} onChange={set('phone')} />
                  </div>
                  <div className="space-y-2">
                    <Label>GSTIN</Label>
                    <Input value={form.gstin ?? ''} onChange={set('gstin')} className="uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN</Label>
                    <Input value={form.pan ?? ''} onChange={set('pan')} className="uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Prefix</Label>
                    <Input value={form.invoicePrefix ?? ''} onChange={set('invoicePrefix')} placeholder="INV" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Address Line 1</Label>
                    <Input value={form.addressLine1 ?? ''} onChange={set('addressLine1')} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Address Line 2</Label>
                    <Input value={form.addressLine2 ?? ''} onChange={set('addressLine2')} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={form.city ?? ''} onChange={set('city')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input value={form.pincode ?? ''} onChange={set('pincode')} />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Details</CardTitle>
              <CardDescription>Update your banking information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input value={form.bankName ?? ''} onChange={set('bankName')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input value={form.bankAccountNumber ?? ''} onChange={set('bankAccountNumber')} />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input value={form.bankIfsc ?? ''} onChange={set('bankIfsc')} className="uppercase" />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
