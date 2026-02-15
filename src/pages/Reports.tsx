import { mockInvoices } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Reports() {
  const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
  const totalTax = mockInvoices.reduce((sum, inv) => sum + inv.tax_amount, 0);
  const pendingAmount = mockInvoices.reduce((sum, inv) => {
    if (inv.status !== 'paid' && inv.status !== 'cancelled') {
      return sum + (inv.total_amount - inv.amount_paid);
    }
    return sum;
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">GST summary and business insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Tax Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTax)}</div>
            <p className="text-xs text-muted-foreground">GST amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">Outstanding payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Status Summary</CardTitle>
          <CardDescription>Breakdown by invoice status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['paid', 'pending', 'overdue', 'draft'].map(status => {
              const count = mockInvoices.filter(inv => inv.status === status).length;
              const amount = mockInvoices
                .filter(inv => inv.status === status)
                .reduce((sum, inv) => sum + inv.total_amount, 0);
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{status.toUpperCase()}</Badge>
                    <span className="text-sm text-muted-foreground">{count} invoices</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(amount)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
