import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Phone, Mail } from "lucide-react";
import type { DogReportWithImages } from "@shared/schema";

interface DogCardProps {
  report: DogReportWithImages;
}

export default function DogCard({ report }: DogCardProps) {
  const handleContact = () => {
    const subject = `Regarding ${report.type} dog: ${report.petName || 'Unnamed Dog'}`;
    const body = `Hi,\n\nI saw your ${report.type} dog report for ${report.petName || 'the dog'} and wanted to get in touch.\n\nBest regards`;
    const mailtoLink = `mailto:${report.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const reportDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return reportDate.toLocaleDateString();
  };

  return (
    <Card className="shadow-soft border border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {report.images.length > 0 ? (
          <img 
            src={report.images[0].imageUrl} 
            alt={report.petName || 'Dog'}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-muted flex items-center justify-center">
            <i className="fas fa-paw text-4xl text-muted-foreground"></i>
          </div>
        )}
        
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-medium ${
          report.type === 'lost' 
            ? 'bg-destructive text-destructive-foreground' 
            : 'bg-accent text-accent-foreground'
        }`}>
          {report.type === 'lost' ? (
            <><AlertTriangle className="w-3 h-3 mr-1 inline" />LOST</>
          ) : (
            <><CheckCircle className="w-3 h-3 mr-1 inline" />FOUND</>
          )}
        </div>
        
        {report.type === 'lost' && (
          <div className="absolute top-3 right-3 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
            {report.rewardAmount && parseFloat(report.rewardAmount.toString()) > 0 ? (
              `$${report.rewardAmount} Reward`
            ) : (
              '(No reward if found)'
            )}
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2" data-testid={`text-dog-name-${report.id}`}>
          {report.petName || 'Unnamed Dog'}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          {report.breed} • {report.gender} • {report.age}
        </p>
        <p className="text-sm text-muted-foreground mb-3" data-testid={`text-location-${report.id}`}>
          {report.type === 'lost' ? 'Last seen: ' : 'Found near: '}{report.lastSeenLocation}, {report.zipCode}
        </p>
        <p className="text-sm mb-4 line-clamp-2" data-testid={`text-description-${report.id}`}>
          {report.description}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground" data-testid={`text-time-ago-${report.id}`}>
            {getTimeAgo(report.createdAt!)}
          </span>
          <Button 
            onClick={handleContact}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid={`button-contact-${report.id}`}
          >
            <Mail className="h-3 w-3 mr-1" />
            Contact {report.type === 'lost' ? 'Owner' : 'Finder'}
          </Button>
        </div>
        
        {/* Contact Information Display */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              <span data-testid={`text-phone-${report.id}`}>{report.contactPhone}</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              <span data-testid={`text-email-${report.id}`}>{report.contactEmail}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
