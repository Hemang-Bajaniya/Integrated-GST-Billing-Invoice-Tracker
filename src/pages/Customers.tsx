import { useState } from 'react';
import { mockCustomers } from '@/lib/mockData';
// import { Button } from '@/components/ui/card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function Customers() {
  const [customers] = useState(mockCustomers);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <CardHeader>
              <CardTitle className="text-lg">{customer.name}</CardTitle>
              <CardDescription>{customer.gstin}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{customer.email}</p>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
              <p className="text-sm text-muted-foreground">{customer.address}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
