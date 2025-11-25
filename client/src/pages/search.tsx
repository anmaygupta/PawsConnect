import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle, CheckCircle, MapPin, Calendar, PawPrint, Pencil, Trash2 } from "lucide-react";
import { lookupCity, getSurroundingZipCodes } from "@/lib/zipCodeLookup";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface DogReport {
  id: string;
  userId: string;
  type: "lost" | "found";
  animalType: "dog" | "cat";
  petName?: string;
  breed: string;
  size: string;
  age: string;
  primaryColor: string;
  gender: string;
  description: string;
  lastSeenLocation: string;
  zipCode: string;
  lastSeenDate: string;
  lastSeenTime?: string;
  status: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  rewardAmount?: string | null;
  images?: Array<{ imageUrl: string }>;
}

export default function Search() {
  const { zipCode } = useParams<{ zipCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Edit/Delete state
  const [editingReport, setEditingReport] = useState<DogReport | null>(null);
  const [editForm, setEditForm] = useState({
    petName: '',
    breed: '',
    age: '',
    primaryColor: '',
    size: '',
    gender: '',
    description: '',
    lastSeenLocation: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    rewardAmount: '',
  });
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  const { data: reports, isLoading, error } = useQuery<DogReport[]>({
    queryKey: ['/api/reports/search', zipCode],
    queryFn: async () => {
      if (!zipCode) return [];
      const response = await fetch(`/api/reports/search/${zipCode}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
    enabled: !!zipCode,
  });

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, updates }: { reportId: string; updates: any }) => {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update report');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/search', zipCode] });
      setEditingReport(null);
      toast({ title: 'Report updated!', description: 'Your report has been updated successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to update report. Please try again.', variant: 'destructive' });
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete report');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/search', zipCode] });
      setDeletingReportId(null);
      toast({ title: 'Report deleted', description: 'Your report has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete report. Please try again.', variant: 'destructive' });
    },
  });

  const handleEditClick = (report: DogReport) => {
    setEditingReport(report);
    setEditForm({
      petName: report.petName || '',
      breed: report.breed || '',
      age: report.age || '',
      primaryColor: report.primaryColor || '',
      size: report.size || '',
      gender: report.gender || '',
      description: report.description || '',
      lastSeenLocation: report.lastSeenLocation || '',
      contactName: report.contactName || '',
      contactPhone: report.contactPhone || '',
      contactEmail: report.contactEmail || '',
      rewardAmount: report.rewardAmount?.toString() || '',
    });
  };

  const handleEditSubmit = () => {
    if (!editingReport) return;
    updateReportMutation.mutate({
      reportId: editingReport.id,
      updates: editForm,
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingReportId) return;
    deleteReportMutation.mutate(deletingReportId);
  };

  const isOwner = (report: DogReport): boolean => {
    return !!(user && (user as any).id === report.userId);
  };

  const city = zipCode ? lookupCity(zipCode) : null;
  const surroundingZips = zipCode ? getSurroundingZipCodes(zipCode) : [];

  if (!zipCode) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Search for Lost Pets</h1>
          <p className="text-muted-foreground">Enter a ZIP code to see reports in your area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {city ? `Lost & Found Pets in ${city}` : `Lost & Found Pets in ${zipCode}`}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            ZIP Code: {zipCode}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-64 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load reports. Please try again.</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && reports && (
          <>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <PawPrint className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-2xl font-semibold mb-2">No reports found in this area</h2>
                <p className="text-muted-foreground mb-6">Check the surrounding areas below</p>
              </div>
            ) : (
              <div className="mb-12">
                <p className="text-sm text-muted-foreground mb-6">
                  Found {reports.length} {reports.length === 1 ? 'report' : 'reports'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map((report) => (
                    <Card key={report.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Report Image */}
                      {report.images && report.images.length > 0 ? (
                        <div className="h-64 overflow-hidden bg-muted">
                          <img
                            src={report.images[0].imageUrl}
                            alt={report.petName || `${report.breed} ${report.animalType}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-64 bg-muted flex items-center justify-center">
                          <PawPrint className="h-24 w-24 text-muted-foreground opacity-20" />
                        </div>
                      )}

                      <CardContent className="p-4">
                        {/* Type Badge and Edit/Delete buttons */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            {report.type === 'lost' ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <AlertTriangle className="h-3 w-3" />
                                Lost {report.animalType === 'dog' ? 'Dog' : 'Cat'}
                              </Badge>
                            ) : (
                              <Badge className="bg-accent text-accent-foreground flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                Found {report.animalType === 'dog' ? 'Dog' : 'Cat'}
                              </Badge>
                            )}
                          </div>
                          {isOwner(report) && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(report)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingReportId(report.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Pet Name */}
                        <h3 className="text-xl font-bold mb-2">
                          {report.petName || 'Unknown'}
                        </h3>

                        {/* Details */}
                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                          <p><strong>Breed:</strong> {report.breed}</p>
                          <p><strong>Color:</strong> {report.primaryColor}</p>
                          <p><strong>Size:</strong> {report.size}</p>
                          <p><strong>Age:</strong> {report.age}</p>
                        </div>

                        {/* Location & Date */}
                        <div className="space-y-2 text-sm border-t pt-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">{report.lastSeenLocation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {format(new Date(report.lastSeenDate), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>

                        {/* Description Preview */}
                        {report.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Surrounding Areas */}
            {surroundingZips.length > 0 && (
              <div className="border-t pt-8">
                <h2 className="text-2xl font-semibold mb-4">
                  Didn't find what you're looking for?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Check these surrounding areas:
                </p>
                <div className="flex flex-wrap gap-3">
                  {surroundingZips.map((zip) => {
                    const surroundingCity = lookupCity(zip);
                    return (
                      <Button
                        key={zip}
                        variant="outline"
                        onClick={() => navigate(`/search/${zip}`)}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        {surroundingCity ? `${zip}: ${surroundingCity}` : zip}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Report Dialog */}
      <Dialog open={!!editingReport} onOpenChange={(open) => !open && setEditingReport(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pet Name</label>
                <Input
                  value={editForm.petName}
                  onChange={(e) => setEditForm({ ...editForm, petName: e.target.value })}
                  placeholder="Pet name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Breed</label>
                <Input
                  value={editForm.breed}
                  onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                  placeholder="Breed"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <Input
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <Input
                  value={editForm.primaryColor}
                  onChange={(e) => setEditForm({ ...editForm, primaryColor: e.target.value })}
                  placeholder="Color"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Size</label>
                <select
                  value={editForm.size}
                  onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Seen Location</label>
              <Input
                value={editForm.lastSeenLocation}
                onChange={(e) => setEditForm({ ...editForm, lastSeenLocation: e.target.value })}
                placeholder="Location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Describe the pet..."
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contact Name</label>
                <Input
                  value={editForm.contactName}
                  onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Phone</label>
                <Input
                  value={editForm.contactPhone}
                  onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contact Email</label>
                <Input
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                  placeholder="Email"
                />
              </div>
              {editingReport?.type === 'lost' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Reward Amount ($)</label>
                  <Input
                    type="number"
                    value={editForm.rewardAmount}
                    onChange={(e) => setEditForm({ ...editForm, rewardAmount: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReport(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateReportMutation.isPending}>
              {updateReportMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingReportId} onOpenChange={(open) => !open && setDeletingReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteReportMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
