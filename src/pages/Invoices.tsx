import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoicesApi, type InvoiceSummaryDto } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { INVOICE_STATUSES } from '@/lib/constants';
import { toast } from 'sonner';

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoicesApi.getAll()
      .then(setInvoices)
      .catch((err) => toast.error(err.message || 'Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number | null | undefined) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = INVOICE_STATUSES.find(s => s.value === status);
    return (
      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices</p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading invoices...</p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">No invoices found. Create your first invoice!</p>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="cursor-pointer hover:bg-muted/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{invoice.invoiceNumber}</span>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.dueDate
                        ? `Due: ${new Date(invoice.dueDate).toLocaleDateString()}`
                        : `Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatCurrency(invoice.totalAmount)}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid: {formatCurrency(invoice.amountPaid)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
