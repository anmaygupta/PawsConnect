import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DollarSign, Users, Coffee, PawPrint } from "lucide-react";

export default function Donate() {
  const { isAuthenticated } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");

  const predefinedAmounts = [5, 10, 25, 50, 100];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getCurrentAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    return parseFloat(customAmount) || 0;
  };

  const handleDonate = () => {
    const amount = getCurrentAmount();
    if (amount < 1) {
      alert("Please enter a donation amount of at least $1");
      return;
    }
    
    // This will be implemented once Stripe keys are provided
    alert("Stripe payment integration will be added once API keys are provided!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <PawPrint className="h-12 w-12 text-primary mr-4 fill-current" />
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Support Paw<PawPrint className="h-10 w-10 text-primary mx-2 fill-current" />Finder
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Help us reunite more lost dogs with their families by supporting the development and maintenance of this platform
            </p>
          </div>
        </div>
      </section>

      {/* Donation Form */}
      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Make a Donation</CardTitle>
                <p className="text-center text-muted-foreground">
                  Your contribution helps keep Paw Finder running and helps more dogs find their way home
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount Selection */}
                <div>
                  <Label className="text-base font-semibold mb-4 block">Choose Amount</Label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                    {predefinedAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount ? "default" : "outline"}
                        onClick={() => handleAmountSelect(amount)}
                        className="h-12"
                        data-testid={`button-amount-${amount}`}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmount(e.target.value)}
                      className="pl-10"
                      min="1"
                      step="0.01"
                      data-testid="input-custom-amount"
                    />
                  </div>
                </div>

                {/* Optional Message */}
                <div>
                  <Label htmlFor="message" className="text-base font-semibold">
                    Optional Message (Public)
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Leave a message of support (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-2"
                    maxLength={500}
                    data-testid="textarea-message"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.length}/500 characters
                  </p>
                </div>

                {/* Donation Summary */}
                {getCurrentAmount() > 0 && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Donation Summary</h3>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-semibold" data-testid="text-donation-amount">
                        ${getCurrentAmount().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Donate Button */}
                <Button
                  onClick={handleDonate}
                  disabled={getCurrentAmount() < 1}
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  data-testid="button-donate"
                >
                  <PawPrint className="h-5 w-5 text-white mr-2 fill-current" />
                  Donate ${getCurrentAmount().toFixed(2)}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Payments are processed securely through Stripe. Your donation goes directly to the creator to support platform development and maintenance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Your Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Platform Development</h3>
                  <p className="text-sm text-muted-foreground">
                    Support ongoing development of new features to help more pets find their families
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <PawPrint className="h-12 w-12 text-primary mx-auto mb-4 fill-current" />
                  <h3 className="font-semibold mb-2">Server Costs</h3>
                  <p className="text-sm text-muted-foreground">
                    Help cover hosting, database, and infrastructure costs to keep the platform running
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Coffee className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Support Creator</h3>
                  <p className="text-sm text-muted-foreground">
                    Buy the creator a coffee and support their dedication to reuniting pets with families
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}