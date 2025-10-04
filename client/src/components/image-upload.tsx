import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxImages?: number;
  maxSizePerImage?: number;
}

export default function ImageUpload({ 
  images, 
  onChange, 
  maxImages = 10, 
  maxSizePerImage = 10 * 1024 * 1024 
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of fileArray) {
      if (images.length + validFiles.length >= maxImages) {
        toast({
          title: "Too Many Files",
          description: `Maximum ${maxImages} images allowed.`,
          variant: "destructive",
        });
        break;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
        continue;
      }
      
      if (file.size > maxSizePerImage) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than ${maxSizePerImage / (1024 * 1024)}MB.`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      onChange([...images, ...validFiles]);
    }
  }, [images, onChange, maxImages, maxSizePerImage, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const getImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary hover:bg-muted/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        data-testid="image-upload-area"
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          data-testid="file-input"
        />
        
        <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">
          Click to upload or drag and drop
        </p>
        <p className="text-sm text-muted-foreground">
          PNG, JPG up to {maxSizePerImage / (1024 * 1024)}MB each
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {images.length}/{maxImages} images uploaded
        </p>
        
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={(e) => {
            e.stopPropagation();
            document.getElementById('file-input')?.click();
          }}
          data-testid="button-browse-files"
        >
          <Upload className="h-4 w-4 mr-2" />
          Browse Files
        </Button>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={getImagePreview(image)}
                alt={`Preview ${index + 1}`}
                className="w-full h-20 object-cover rounded border"
                data-testid={`image-preview-${index}`}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
                data-testid={`button-remove-image-${index}`}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b truncate">
                {image.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
