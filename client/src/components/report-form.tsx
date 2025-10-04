import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import ImageUpload from "@/components/image-upload";
import { AlertTriangle, CheckCircle, Send } from "lucide-react";

const reportSchema = z.object({
  type: z.enum(['lost', 'found']),
  dogName: z.string().max(100, "Dog name too long").optional(),
  breed: z.string().min(1, "Breed is required").max(100, "Breed name too long"),
  size: z.enum(['small', 'medium', 'large', 'extra-large']),
  age: z.string().min(1, "Age is required").max(50, "Age description too long"),
  primaryColor: z.string().min(1, "Primary color is required").max(50, "Color description too long"),
  gender: z.enum(['male', 'female']),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description is too long (max 2000 characters)")
    .refine(val => !/<script|javascript:|data:|vbscript:/i.test(val), "Invalid characters detected"),
  lastSeenLocation: z.string()
    .min(1, "Location is required")
    .max(200, "Location description too long"),
  zipCode: z.string()
    .regex(/^\d{5}(-\d{4})?$/, "ZIP code must be in format 12345 or 12345-6789")
    .min(5, "ZIP code is required"),
  lastSeenDate: z.string().min(1, "Date is required"),
  lastSeenTime: z.string().optional(),
  contactName: z.string()
    .min(1, "Your name is required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s\-'\.]+$/, "Name contains invalid characters"),
  contactPhone: z.string()
    .regex(/^(\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, "Please enter a valid US phone number"),
  contactEmail: z.string()
    .email("Valid email address is required")
    .max(254, "Email address too long"),
  rewardAmount: z.string()
    .regex(/^\d*\.?\d{0,2}$/, "Invalid reward amount format")
    .optional(),
  // Anti-bot honeypot field (hidden from users)
  website: z.string().max(0, "Spam detected").optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function ReportForm() {
  const [reportType, setReportType] = useState<'lost' | 'found'>('lost');
  const [images, setImages] = useState<File[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      type: reportType,
      dogName: '',
      breed: '',
      size: 'medium',
      age: '',
      primaryColor: '',
      gender: 'male',
      description: '',
      lastSeenLocation: '',
      zipCode: '',
      lastSeenDate: '',
      lastSeenTime: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      rewardAmount: '',
      website: '', // Honeypot field
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });

      // Add images
      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reports/recent'] });
      toast({
        title: "Report Submitted Successfully",
        description: `Your ${reportType} dog report has been created and is now visible to the community.`,
      });
      navigate('/');
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      console.error('Report submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReportFormData) => {
    mutation.mutate({ ...data, type: reportType });
  };

  const handleTabChange = (value: string) => {
    const newType = value as 'lost' | 'found';
    setReportType(newType);
    form.setValue('type', newType);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Report a {reportType === 'lost' ? 'Lost' : 'Found'} Dog
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={reportType} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lost" className="flex items-center gap-2" data-testid="tab-lost">
              <AlertTriangle className="h-4 w-4" />
              Lost Dog
            </TabsTrigger>
            <TabsTrigger value="found" className="flex items-center gap-2" data-testid="tab-found">
              <CheckCircle className="h-4 w-4" />
              Found Dog
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Dog Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Dog Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dogName">Dog's Name {reportType === 'found' && '(if known)'}</Label>
                <Input
                  id="dogName"
                  {...form.register('dogName')}
                  placeholder="Enter dog's name"
                  data-testid="input-dog-name"
                />
              </div>
              <div>
                <Label htmlFor="breed">Breed *</Label>
                <Input
                  id="breed"
                  {...form.register('breed')}
                  placeholder="e.g., Golden Retriever"
                  data-testid="input-breed"
                />
                {form.formState.errors.breed && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.breed.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="size">Size *</Label>
                <Select onValueChange={(value) => form.setValue('size', value as any)} defaultValue="medium">
                  <SelectTrigger data-testid="select-size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (under 25 lbs)</SelectItem>
                    <SelectItem value="medium">Medium (25-60 lbs)</SelectItem>
                    <SelectItem value="large">Large (60-100 lbs)</SelectItem>
                    <SelectItem value="extra-large">Extra Large (over 100 lbs)</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.size && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.size.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  {...form.register('age')}
                  placeholder="e.g., 3 years"
                  data-testid="input-age"
                />
                {form.formState.errors.age && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.age.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="primaryColor">Primary Color *</Label>
                <Input
                  id="primaryColor"
                  {...form.register('primaryColor')}
                  placeholder="e.g., Golden"
                  data-testid="input-color"
                />
                {form.formState.errors.primaryColor && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.primaryColor.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select onValueChange={(value) => form.setValue('gender', value as any)} defaultValue="male">
                  <SelectTrigger data-testid="select-gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.gender.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description & Distinguishing Features *</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Describe the dog's appearance, personality, and any distinguishing features..."
                className="h-24"
                data-testid="textarea-description"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastSeenLocation">{reportType === 'lost' ? 'Last Seen Location' : 'Found Location'} *</Label>
                <Input
                  id="lastSeenLocation"
                  {...form.register('lastSeenLocation')}
                  placeholder="Street address or area"
                  data-testid="input-location"
                />
                {form.formState.errors.lastSeenLocation && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.lastSeenLocation.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  {...form.register('zipCode')}
                  placeholder="Enter ZIP code"
                  data-testid="input-zip-code"
                />
                {form.formState.errors.zipCode && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.zipCode.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastSeenDate">{reportType === 'lost' ? 'Date Last Seen' : 'Date Found'} *</Label>
                <Input
                  id="lastSeenDate"
                  type="date"
                  {...form.register('lastSeenDate')}
                  data-testid="input-date"
                />
                {form.formState.errors.lastSeenDate && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.lastSeenDate.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastSeenTime">{reportType === 'lost' ? 'Time Last Seen' : 'Time Found'}</Label>
                <Input
                  id="lastSeenTime"
                  type="time"
                  {...form.register('lastSeenTime')}
                  data-testid="input-time"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Your Name *</Label>
                <Input
                  id="contactName"
                  {...form.register('contactName')}
                  placeholder="Your full name"
                  data-testid="input-contact-name"
                />
                {form.formState.errors.contactName && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.contactName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="contactPhone">Phone Number *</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  {...form.register('contactPhone')}
                  placeholder="(555) 123-4567"
                  data-testid="input-contact-phone"
                />
                {form.formState.errors.contactPhone && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.contactPhone.message}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="contactEmail">Email Address *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...form.register('contactEmail')}
                  placeholder="your.email@example.com"
                  data-testid="input-contact-email"
                />
                {form.formState.errors.contactEmail && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.contactEmail.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Reward Information (only for lost dogs) */}
          {reportType === 'lost' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Reward (Optional)</h3>
              <div>
                <Label htmlFor="rewardAmount">Reward Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                  <Input
                    id="rewardAmount"
                    type="number"
                    {...form.register('rewardAmount')}
                    placeholder="0.00"
                    className="pl-8"
                    data-testid="input-reward"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Anti-bot honeypot field - hidden from users */}
          <div style={{ display: 'none' }}>
            <Label htmlFor="website">Website (do not fill)</Label>
            <Input
              id="website"
              type="text"
              {...form.register('website')}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Photos (Up to 10)</h3>
            <ImageUpload
              images={images}
              onChange={setImages}
              maxImages={10}
              maxSizePerImage={10 * 1024 * 1024} // 10MB
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/')}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 font-medium ${
                reportType === 'lost' 
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                  : 'bg-accent text-accent-foreground hover:bg-accent/90'
              }`}
              disabled={mutation.isPending}
              data-testid="button-submit"
            >
              {mutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit {reportType === 'lost' ? 'Lost' : 'Found'} Dog Report
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
