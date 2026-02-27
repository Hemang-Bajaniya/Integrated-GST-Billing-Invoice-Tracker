import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  customersApi,
  productsApi,
  invoicesApi,
  type CustomerDto,
  type ProductDto,
  type GstRateDto,
  type CreateInvoiceItemRequest,
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface LineItem {
  productId: string;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  gstRateId: string;
}

const emptyItem = (): LineItem => ({
  productId: '',
  description: '',
  hsnSacCode: '',
  quantity: 1,
  unit: 'NOS',
  unitPrice: 0,
  discountPercent: 0,
  gstRateId: '',
});

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [gstRates, setGstRates] = useState<GstRateDto[]>([]);
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      customersApi.getAll(),
      productsApi.getAll(),
      productsApi.getGstRates(),
    ])
      .then(([c, p, g]) => {
        setCustomers(c);
        setProducts(p);
        setGstRates(g);
        // Default first item's gstRateId to first available rate
        if (g.length > 0) {
          setItems([{ ...emptyItem(), gstRateId: g[0].id }]);
        }
      })
      .catch((err) => toast.error(err.message || 'Failed to load form data'));
  }, []);

  // When a product is selected on a line item, auto-fill its details
  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId,
              description: product?.name ?? item.description,
              hsnSacCode: product?.hsnSacCode ?? '',
              unit: product?.unit ?? 'NOS',
              unitPrice: product?.unitPrice ?? 0,
              gstRateId: product?.gstRateId ?? item.gstRateId,
            }
          : item
      )
    );
  };

  const updateItem = <K extends keyof LineItem>(index: number, field: K, value: LineItem[K]) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { ...emptyItem(), gstRateId: gstRates[0]?.id ?? '' },
    ]);

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    const invalidItem = items.find((it) => !it.description || !it.gstRateId || it.unitPrice <= 0);
    if (invalidItem) {
      toast.error('Please fill in all item fields (description, price, GST rate)');
      return;
    }

    setSubmitting(true);
    try {
      const requestItems: CreateInvoiceItemRequest[] = items.map((it) => ({
        productId: it.productId || null,
        description: it.description,
        hsnSacCode: it.hsnSacCode || null,
        quantity: it.quantity,
        unit: it.unit,
        unitPrice: it.unitPrice,
        discountPercent: it.discountPercent,
        gstRateId: it.gstRateId,
      }));

      await invoicesApi.create({
        customerId,
        invoiceDate: invoiceDate || undefined,
        dueDate: dueDate || null,
        notes: notes || null,
        terms: terms || null,
        items: requestItems,
      });

      toast.success('Invoice created successfully');
      navigate('/invoices');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Invoice</h1>
          <p className="text-muted-foreground">Generate a new GST invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end border rounded-md p-4">
                {/* Product select */}
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Product (optional)</Label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={item.productId}
                    onChange={(e) => handleProductChange(index, e.target.value)}
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs">Description *</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Item description"
                    required
                  />
                </div>

                {/* Qty */}
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min={0.001}
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                  />
                </div>

                {/* Price */}
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Unit Price (₹) *</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                {/* GST Rate */}
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">GST Rate *</Label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={item.gstRateId}
                    onChange={(e) => updateItem(index, 'gstRateId', e.target.value)}
                    required
                  >
                    <option value="">Select...</option>
                    {gstRates.map((r) => (
                      <option key={r.id} value={r.id}>{r.rate}%</option>
                    ))}
                  </select>
                </div>

                {/* Remove */}
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any notes..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea
                placeholder="Payment terms..."
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}
