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
import { 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Calendar, 
  PawPrint, 
  Pencil, 
  Trash2, 
  ArrowLeft,
  Clock,
  Phone,
  Mail,
  User,
  DollarSign,
  Ruler,
  Palette,
  Dog,
  Cat
} from "lucide-react";
import { lookupCity } from "@/lib/zipCodeLookup";
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
  createdAt: string;
  updatedAt: string;
  images?: Array<{ imageUrl: string }>;
  user?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export default function ReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
    zipCode: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    rewardAmount: '',
  });
  const [deletingReport, setDeletingReport] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: report, isLoading, error } = useQuery<DogReport>({
    queryKey: ['/api/reports', reportId],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) throw new Error('Failed to fetch report');
      return response.json();
    },
    enabled: !!reportId,
  });

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
      queryClient.invalidateQueries({ queryKey: ['/api/reports', reportId] });
      setEditingReport(null);
      toast({ title: 'Report updated!', description: 'Your report has been updated successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to update report.', variant: 'destructive' });
    },
  });

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
      toast({ title: 'Report deleted', description: 'Your report has been removed.' });
      navigate(-1);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to delete report.', variant: 'destructive' });
    },
  });

  const handleEditClick = () => {
    if (!report) return;
    setEditForm({
      petName: report.petName || '',
      breed: report.breed || '',
      age: report.age || '',
      primaryColor: report.primaryColor || '',
      size: report.size || '',
      gender: report.gender || '',
      description: report.description || '',
      lastSeenLocation: report.lastSeenLocation || '',
      zipCode: report.zipCode || '',
      contactName: report.contactName || '',
      contactPhone: report.contactPhone || '',
      contactEmail: report.contactEmail || '',
      rewardAmount: report.rewardAmount?.toString() || '',
    });
    setEditingReport(report);
  };

  const handleSaveEdit = () => {
    if (!editingReport) return;
    updateReportMutation.mutate({
      reportId: editingReport.id,
      updates: editForm,
    });
  };

  const isOwner = Boolean(user && report && (user as { id: string }).id === report.userId);
  const cityName = report ? lookupCity(report.zipCode) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <PawPrint className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Report Not Found</h2>
              <p className="text-gray-600">This report may have been removed or doesn't exist.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const AnimalIcon = report.animalType === 'cat' ? Cat : Dog;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-blue-100">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 aspect-square flex items-center justify-center">
              {report.images && report.images.length > 0 ? (
                <img
                  src={report.images[selectedImage ? parseInt(selectedImage) : 0]?.imageUrl || report.images[0].imageUrl}
                  alt={report.petName || "Pet"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PawPrint className="h-32 w-32 text-blue-300" />
              )}
              <Badge 
                className={`absolute top-4 left-4 text-lg px-4 py-2 ${
                  report.type === "lost" 
                    ? "bg-red-500 hover:bg-red-600" 
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {report.type === "lost" ? (
                  <><AlertTriangle className="h-5 w-5 mr-2" /> Lost {report.animalType === 'cat' ? 'Cat' : 'Dog'}</>
                ) : (
                  <><CheckCircle className="h-5 w-5 mr-2" /> Found {report.animalType === 'cat' ? 'Cat' : 'Dog'}</>
                )}
              </Badge>
            </div>

            {report.images && report.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {report.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index.toString())}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index.toString() || (!selectedImage && index === 0)
                        ? 'border-orange-500 ring-2 ring-orange-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img.imageUrl} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <AnimalIcon className="h-8 w-8 text-orange-500" />
                <h1 className="text-4xl font-bold text-gray-900">
                  {report.petName || "Unknown Name"}
                </h1>
              </div>
              <p className="text-xl text-gray-600">{report.breed}</p>
            </div>

            {isOwner && (
              <div className="flex gap-3">
                <Button onClick={handleEditClick} variant="outline" className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" /> Edit Report
                </Button>
                <Button 
                  onClick={() => setDeletingReport(true)} 
                  variant="outline" 
                  className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            )}

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-orange-500" /> Pet Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Palette className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Color</p>
                      <p className="font-medium capitalize">{report.primaryColor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Ruler className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Size</p>
                      <p className="font-medium capitalize">{report.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium">{report.age}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <AnimalIcon className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium capitalize">{report.gender}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" /> Location & Time
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Seen Location</p>
                      <p className="font-medium">{report.lastSeenLocation}</p>
                      <p className="text-sm text-gray-600">{cityName ? `${cityName}, ` : ''}{report.zipCode}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date {report.type === 'lost' ? 'Lost' : 'Found'}</p>
                      <p className="font-medium">
                        {report.lastSeenDate ? format(new Date(report.lastSeenDate), "MMMM d, yyyy") : "Unknown"}
                      </p>
                    </div>
                  </div>
                  {report.lastSeenTime && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium">{report.lastSeenTime}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.description}</p>
              </CardContent>
            </Card>

            {report.type === 'lost' && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" /> Reward
                  </h3>
                  {report.rewardAmount && parseFloat(report.rewardAmount) > 0 ? (
                    <p className="text-2xl font-bold text-green-700">${parseFloat(report.rewardAmount).toFixed(2)}</p>
                  ) : (
                    <p className="text-gray-600">No reward offered</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">(Transactions are not made through Paw Finder)</p>
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" /> Contact Information
                </h3>
                <div className="space-y-3">
                  {report.contactName && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">{report.contactName}</span>
                    </div>
                  )}
                  {report.contactEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-orange-600" />
                      <a href={`mailto:${report.contactEmail}`} className="font-medium text-blue-600 hover:underline">
                        {report.contactEmail}
                      </a>
                    </div>
                  )}
                  {report.contactPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-orange-600" />
                      <a href={`tel:${report.contactPhone}`} className="font-medium text-blue-600 hover:underline">
                        {report.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-gray-500 flex flex-wrap gap-4">
              <span>Posted: {format(new Date(report.createdAt), "MMM d, yyyy")}</span>
              {report.user && (
                <span>By: {report.user.firstName} {report.user.lastName}</span>
              )}
              {report.updatedAt !== report.createdAt && (
                <span>Updated: {format(new Date(report.updatedAt), "MMM d, yyyy")}</span>
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={!!editingReport} onOpenChange={() => setEditingReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Pet Name</label>
                <Input
                  value={editForm.petName}
                  onChange={(e) => setEditForm({ ...editForm, petName: e.target.value })}
                  placeholder="Pet name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Breed</label>
                <Input
                  value={editForm.breed}
                  onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                  placeholder="Breed"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Age</label>
                <Input
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <Input
                  value={editForm.primaryColor}
                  onChange={(e) => setEditForm({ ...editForm, primaryColor: e.target.value })}
                  placeholder="Color"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Size</label>
                <select
                  value={editForm.size}
                  onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Description"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Last Seen Location</label>
                <Input
                  value={editForm.lastSeenLocation}
                  onChange={(e) => setEditForm({ ...editForm, lastSeenLocation: e.target.value })}
                  placeholder="Location"
                />
              </div>
              <div>
                <label className="text-sm font-medium">ZIP Code</label>
                <Input
                  value={editForm.zipCode}
                  onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
                  placeholder="ZIP Code"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Contact Name (optional)</label>
                <Input
                  value={editForm.contactName}
                  onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Phone (optional)</label>
                <Input
                  value={editForm.contactPhone}
                  onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Contact Email *</label>
                <Input
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                  placeholder="Email address"
                  required
                />
              </div>
              {report?.type === 'lost' && (
                <div>
                  <label className="text-sm font-medium">Reward Amount ($)</label>
                  <Input
                    type="number"
                    value={editForm.rewardAmount}
                    onChange={(e) => setEditForm({ ...editForm, rewardAmount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReport(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updateReportMutation.isPending}>
              {updateReportMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingReport} onOpenChange={setDeletingReport}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this report. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => report && deleteReportMutation.mutate(report.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteReportMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
