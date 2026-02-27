import { useState, useEffect } from 'react';
import { reportsApi, dashboardApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { INVOICE_STATUSES } from '@/lib/constants';
import { toast } from 'sonner';

export default function Reports() {
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.getSummary(),
      dashboardApi.getStatusCounts(),
    ])
      .then(([s, counts]) => {
        setSummary(s);
        setStatusCounts(counts);
      })
      .catch((err) => toast.error(err.message || 'Failed to load report data'))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number | null | undefined) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  };

  const totalInvoiced = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">GST summary and business insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Revenue (FY)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : formatCurrency(summary?.totalRevenueFY)}
            </div>
            <p className="text-xs text-muted-foreground">Payments received this financial year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '—' : formatCurrency(summary?.totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">Unpaid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {loading ? '—' : formatCurrency(summary?.totalOverdue)}
            </div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Status Summary</CardTitle>
          <CardDescription>Breakdown by invoice status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-4">
              {INVOICE_STATUSES.map(({ value, label }) => {
                const count = statusCounts[value] ?? 0;
                return (
                  <div key={value} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{label.toUpperCase()}</Badge>
                      <span className="text-sm text-muted-foreground">{count} invoice{count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              })}
              <div className="border-t pt-4 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{totalInvoiced} invoices</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
