import { useState } from 'react';
import { mockVendors } from '@/lib/mockData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Vendors() {
  const [vendors] = useState(mockVendors);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">Manage your vendor database</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <Card key={vendor.id}>
            <CardHeader>
              <CardTitle className="text-lg">{vendor.name}</CardTitle>
              <CardDescription>{vendor.gstin}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{vendor.email}</p>
              <p className="text-sm text-muted-foreground">{vendor.phone}</p>
              <p className="text-sm text-muted-foreground">{vendor.address}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
