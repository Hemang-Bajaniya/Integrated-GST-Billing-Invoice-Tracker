import { useState, useEffect, useCallback } from 'react';
import { vendorsApi, type VendorDto } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { VendorForm } from '@/components/forms/VendorForm';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function Vendors() {
  const { canModify } = useAuth();
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorDto | null>(null);

  const loadVendors = useCallback(() => {
    setLoading(true);
    vendorsApi.getAll()
      .then(setVendors)
      .catch((err) => toast.error(err.message || 'Failed to load vendors'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  const handleAdd = () => {
    setEditingVendor(null);
    setDialogOpen(true);
  };

  const handleEdit = (vendor: VendorDto) => {
    setEditingVendor(vendor);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await vendorsApi.delete(id);
      toast.success('Vendor removed');
      loadVendors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete vendor');
    }
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    loadVendors();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">Manage your vendor database</p>
        </div>
        {canModify && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading vendors...</p>
      ) : vendors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No vendors yet. Add your first vendor!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{vendor.name}</CardTitle>
                    <CardDescription>{vendor.gstin}</CardDescription>
                  </div>
                  {canModify && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(vendor)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this vendor?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(vendor.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{vendor.email}</p>
                <p className="text-sm text-muted-foreground">{vendor.phone}</p>
                <p className="text-sm text-muted-foreground">
                  {[vendor.addressLine1, vendor.city, vendor.state].filter(Boolean).join(', ')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          </DialogHeader>
          <VendorForm
            vendor={editingVendor}
            onSuccess={handleFormSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
