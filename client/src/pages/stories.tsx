import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Heart, ThumbsUp, MessageCircle, PawPrint, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/navigation';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface StoryComment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

interface StoryImage {
  id: string;
  imageUrl: string;
  fileName: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  petName?: string;
  petType?: string;
  rating: number;
  likesCount: number;
  lovesCount: number;
  commentsCount: number;
  createdAt: string;
  user: User;
  images: StoryImage[];
  comments: StoryComment[];
}

export default function Stories() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Fetch stories
  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
  });

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      toast({ title: 'Too many images', description: 'You can only upload up to 5 images.', variant: 'destructive' });
      return;
    }
    
    setSelectedImages(prev => [...prev, ...files].slice(0, 5));
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string].slice(0, 5));
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (storyData: { title: string; content: string; rating: number; images: File[] }) => {
      const formData = new FormData();
      formData.append('storyData', JSON.stringify({
        title: storyData.title,
        content: storyData.content,
        rating: storyData.rating,
      }));
      
      storyData.images.forEach(image => {
        formData.append('images', image);
      });

      const response = await fetch('/api/stories', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to create story');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      setTitle('');
      setContent('');
      setRating(5);
      setSelectedImages([]);
      setImagePreviews([]);
      toast({ title: 'Success story shared!', description: 'Thank you for sharing your heartwarming reunion.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to share story. Please try again.', variant: 'destructive' });
    },
  });

  // React to story mutation
  const reactToStoryMutation = useMutation({
    mutationFn: async ({ storyId, reactionType }: { storyId: string; reactionType: 'like' | 'love' }) => {
      const response = await fetch(`/api/stories/${storyId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reactionType }),
      });
      if (!response.ok) throw new Error('Failed to react');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Please sign in', description: 'You need to be signed in to share a story', variant: 'destructive' });
      window.location.href = '/api/auth/google';
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Error', description: 'Please fill in title and story', variant: 'destructive' });
      return;
    }
    createStoryMutation.mutate({ title, content, rating, images: selectedImages });
  };

  const handleReaction = (storyId: string, reactionType: 'like' | 'love') => {
    if (!user) {
      toast({ title: 'Please sign in', description: 'You need to be signed in to react to stories', variant: 'destructive' });
      return;
    }
    reactToStoryMutation.mutate({ storyId, reactionType });
  };

  const displayedStories = showAll ? stories : stories.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Success Stories</h1>

        {isLoading ? (
          <div className="text-center py-12">Loading stories...</div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No success stories yet. Be the first to share your reunion story!</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {displayedStories.map((story) => (
                <Card key={story.id}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={story.user.profileImageUrl} />
                        <AvatarFallback>{story.user.firstName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{story.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          by {story.user.firstName} {story.user.lastName} • {new Date(story.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(story.rating)].map((_, i) => (
                            <PawPrint key={i} className="w-4 h-4 fill-primary text-primary" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{story.content}</p>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 w-full">
                      <button
                        onClick={() => handleReaction(story.id, 'like')}
                        className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors"
                        disabled={!user}
                      >
                        <ThumbsUp className="w-5 h-5" />
                        <span>{story.likesCount}</span>
                      </button>
                      <button
                        onClick={() => handleReaction(story.id, 'love')}
                        className="flex items-center gap-2 text-sm hover:text-red-600 transition-colors"
                        disabled={!user}
                      >
                        <Heart className="w-5 h-5" />
                        <span>{story.lovesCount}</span>
                      </button>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageCircle className="w-5 h-5" />
                        <span>{story.commentsCount}</span>
                      </div>
                    </div>
                    
                    {story.comments.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-3 w-full">
                          {story.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={comment.user.profileImageUrl} />
                                <AvatarFallback>{comment.user.firstName?.[0] || 'U'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-muted p-3 rounded-lg">
                                <p className="text-sm font-medium">{comment.user.firstName} {comment.user.lastName}</p>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {!showAll && stories.length > 3 && (
              <div className="text-center mt-8">
                <Button onClick={() => setShowAll(true)} variant="outline" size="lg">
                  View More Stories ({stories.length - 3} more)
                </Button>
              </div>
            )}

            {showAll && stories.length > 3 && (
              <div className="text-center mt-8">
                <Button onClick={() => setShowAll(false)} variant="outline" size="lg">
                  Show Less
                </Button>
              </div>
            )}
          </>
        )}

        {/* Story Submission Form - At the bottom */}
        <div className="mt-12 border-t pt-8">
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold text-center">Share Your Success Story</h2>
              <p className="text-sm text-muted-foreground text-center">
                Did Paw Finder help reunite you with your beloved pet? Share your story!
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Reunited with Max after 2 weeks!"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Your Story *</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[150px]"
                    placeholder="Share the story of how you were reunited with your beloved pet..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Photos (Max 5)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={selectedImages.length >= 5}
                  />
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rate Paw Finder (out of 5 paws)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((paw) => (
                      <button
                        key={paw}
                        type="button"
                        onClick={() => setRating(paw)}
                        className="focus:outline-none transition-all hover:scale-110"
                      >
                        <PawPrint
                          className={`w-10 h-10 ${
                            paw <= rating ? 'fill-primary text-primary' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={createStoryMutation.isPending} className="w-full">
                    {createStoryMutation.isPending ? 'Sharing...' : 'Share My Story'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
