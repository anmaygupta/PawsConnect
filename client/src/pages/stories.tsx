import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Heart, ThumbsUp, MessageCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface User {
  id: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
}

interface StoryComment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

interface Story {
  id: string;
  title: string;
  content: string;
  petName?: string;
  petType?: string;
  imageUrl?: string;
  rating: number;
  likesCount: number;
  lovesCount: number;
  commentsCount: number;
  createdAt: string;
  user: User;
  comments: StoryComment[];
}

export default function Stories() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [rating, setRating] = useState(5);

  // Fetch stories
  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ['/api/stories'],
  });

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (newStory: any) => {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newStory),
      });
      if (!response.ok) throw new Error('Failed to create story');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      setTitle('');
      setContent('');
      setPetName('');
      setPetType('');
      setRating(5);
      setShowForm(false);
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
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Error', description: 'Please fill in title and story', variant: 'destructive' });
      return;
    }
    createStoryMutation.mutate({ title, content, petName: petName || null, petType: petType || null, rating });
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Success Stories</h1>
        
        {user && (
          <div className="mb-8">
            {!showForm ? (
              <Button onClick={() => setShowForm(true)} className="w-full">
                Share Your Success Story
              </Button>
            ) : (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Share Your Success Story</h2>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                      <label className="block text-sm font-medium mb-2">Pet Name (optional)</label>
                      <input
                        type="text"
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="Max"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Pet Type (optional)</label>
                      <select
                        value={petType}
                        onChange={(e) => setPetType(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Select type</option>
                        <option value="dog">Dog</option>
                        <option value="cat">Cat</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Story *</label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full min-h-[120px]"
                        placeholder="Share the story of how you were reunited with your beloved pet..."
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Rate Your Experience</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={createStoryMutation.isPending}>
                        {createStoryMutation.isPending ? 'Sharing...' : 'Share Story'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

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
                        <AvatarImage src={story.user.profilePictureUrl} />
                        <AvatarFallback>{story.user.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{story.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          by {story.user.name} • {new Date(story.createdAt).toLocaleDateString()}
                        </p>
                        {story.petName && (
                          <p className="text-sm text-muted-foreground">
                            {story.petType === 'dog' ? '🐕' : story.petType === 'cat' ? '🐈' : '🐾'} {story.petName}
                          </p>
                        )}
                        <div className="flex gap-1 mt-1">
                          {[...Array(story.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
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
                                <AvatarImage src={comment.user.profilePictureUrl} />
                                <AvatarFallback>{comment.user.name?.[0] || 'U'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-muted p-3 rounded-lg">
                                <p className="text-sm font-medium">{comment.user.name}</p>
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
      </div>
    </div>
  );
}
