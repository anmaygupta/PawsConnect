import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertStorySchema, insertStoryCommentSchema, type StoryWithDetails } from "@shared/schema";
import { z } from "zod";
import { PawPrint, Heart, MessageCircle, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const storyFormSchema = insertStorySchema.extend({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  content: z.string().min(10, "Story must be at least 10 characters").max(2000, "Story must be 2000 characters or less")
});

const commentFormSchema = insertStoryCommentSchema.extend({
  content: z.string().min(1, "Comment cannot be empty").max(500, "Comment must be 500 characters or less")
});

type StoryFormData = z.infer<typeof storyFormSchema>;
type CommentFormData = z.infer<typeof commentFormSchema>;

export default function Stories() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [showNewStoryForm, setShowNewStoryForm] = useState(false);
  const [commentForms, setCommentForms] = useState<Record<string, boolean>>({});

  // Fetch stories
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['/api/stories'],
  }) as { data: StoryWithDetails[], isLoading: boolean };

  // Story form
  const storyForm = useForm<StoryFormData>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: async (data: StoryFormData) => {
      return apiRequest("POST", "/api/stories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      storyForm.reset();
      setShowNewStoryForm(false);
      toast({
        title: "Story posted!",
        description: "Thank you for sharing your experience with Paw Finder.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post story. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Like story mutation
  const likeStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      return apiRequest("POST", `/api/stories/${storyId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like story. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ storyId, content }: { storyId: string; content: string }) => {
      return apiRequest("POST", `/api/stories/${storyId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      // Reset all comment forms
      setCommentForms({});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLike = (storyId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like stories.",
        variant: "destructive",
      });
      return;
    }
    likeStoryMutation.mutate(storyId);
  };

  const handleAddComment = (storyId: string, content: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment on stories.",
        variant: "destructive",
      });
      return;
    }
    if (content.trim()) {
      addCommentMutation.mutate({ storyId, content: content.trim() });
    }
  };

  const toggleCommentForm = (storyId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment on stories.",
        variant: "destructive",
      });
      return;
    }
    setCommentForms(prev => ({
      ...prev,
      [storyId]: !prev[storyId]
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center">
              <PawPrint className="h-10 w-10 text-primary mr-4 fill-current" />
              Success Stories
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Share how Paw Finder helped reunite you with your furry friend or hear from our community
            </p>
            
            {!showNewStoryForm ? (
              <Button 
                onClick={() => {
                  if (!isAuthenticated) {
                    toast({
                      title: "Sign in required",
                      description: "Please sign in to share your story.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setShowNewStoryForm(true);
                }}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                data-testid="button-share-story"
              >
                <PawPrint className="h-5 w-5 mr-2 fill-current" />
                Share Your Story
              </Button>
            ) : (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PawPrint className="h-6 w-6 text-primary mr-2 fill-current" />
                    Share Your Success Story
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...storyForm}>
                    <form 
                      onSubmit={storyForm.handleSubmit((data) => createStoryMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={storyForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Story Title</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="How Paw Finder helped me find Max..."
                                {...field}
                                data-testid="input-story-title"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={storyForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Story</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about your experience with Paw Finder. How did our platform help you? What happened? Share the details that might help or inspire other pet owners..."
                                className="min-h-[120px] resize-none"
                                {...field}
                                data-testid="textarea-story-content"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-2">
                        <Button 
                          type="submit"
                          disabled={createStoryMutation.isPending}
                          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                          data-testid="button-submit-story"
                        >
                          <PawPrint className="h-4 w-4 mr-2 fill-current" />
                          {createStoryMutation.isPending ? "Posting..." : "Post Story"}
                        </Button>
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowNewStoryForm(false);
                            storyForm.reset();
                          }}
                          data-testid="button-cancel-story"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Stories List */}
          <div className="space-y-8">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Loading stories...</p>
              </div>
            ) : stories.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <PawPrint className="h-16 w-16 text-muted-foreground mx-auto mb-4 fill-current" />
                  <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to share how Paw Finder helped you!
                  </p>
                </CardContent>
              </Card>
            ) : (
              stories.map((story) => (
                <Card key={story.id} className="p-6" data-testid={`story-card-${story.id}`}>
                  <div className="space-y-4">
                    {/* Story Header */}
                    <div>
                      <h2 className="text-xl font-semibold mb-2" data-testid={`story-title-${story.id}`}>
                        {story.title}
                      </h2>
                      <div className="flex items-center text-sm text-muted-foreground mb-4">
                        <User className="h-4 w-4 mr-1" />
                        <span className="mr-4">{story.user.firstName} {story.user.lastName}</span>
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{format(new Date(story.createdAt!), 'MMM d, yyyy')}</span>
                      </div>
                    </div>

                    {/* Story Content */}
                    <div className="text-foreground leading-relaxed whitespace-pre-wrap" data-testid={`story-content-${story.id}`}>
                      {story.content}
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(story.id)}
                        disabled={likeStoryMutation.isPending}
                        className="flex items-center gap-2 hover:text-red-500"
                        data-testid={`button-like-${story.id}`}
                      >
                        <Heart className={`h-4 w-4 ${story.userHasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        {story.likesCount} {story.likesCount === 1 ? 'Like' : 'Likes'}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCommentForm(story.id)}
                        className="flex items-center gap-2"
                        data-testid={`button-comment-${story.id}`}
                      >
                        <MessageCircle className="h-4 w-4" />
                        {story.commentsCount} {story.commentsCount === 1 ? 'Comment' : 'Comments'}
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {story.comments.length > 0 && (
                      <div className="space-y-3 pt-4">
                        {story.comments.map((comment) => (
                          <div key={comment.id} className="bg-muted/50 rounded-lg p-3" data-testid={`comment-${comment.id}`}>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                              <User className="h-3 w-3 mr-1" />
                              <span className="mr-3">{comment.user.firstName} {comment.user.lastName}</span>
                              <span className="text-xs">{format(new Date(comment.createdAt!), 'MMM d, yyyy • h:mm a')}</span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Form */}
                    {commentForms[story.id] && (
                      <div className="pt-4">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const content = formData.get('content') as string;
                            if (content.trim()) {
                              handleAddComment(story.id, content);
                              (e.target as HTMLFormElement).reset();
                            }
                          }}
                          className="space-y-3"
                        >
                          <Textarea
                            name="content"
                            placeholder="Add a comment..."
                            className="min-h-[60px] resize-none"
                            required
                            data-testid={`textarea-comment-${story.id}`}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              size="sm"
                              disabled={addCommentMutation.isPending}
                              data-testid={`button-submit-comment-${story.id}`}
                            >
                              {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => toggleCommentForm(story.id)}
                              data-testid={`button-cancel-comment-${story.id}`}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}