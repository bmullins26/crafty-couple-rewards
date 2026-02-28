import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Star, Crown, Sparkles, Search, UserPlus, Shield, Facebook } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_punch-tracker-11/artifacts/cxump35k_new%20logo.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [lookupValue, setLookupValue] = useState("");
  const [signupData, setSignupData] = useState({
    name: "",
    phone: "",
    email: ""
  });

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupValue.trim()) {
      toast.error("Please enter your phone number or email");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/customers/lookup`, {
        identifier: lookupValue.trim()
      });
      
      if (response.data.customer) {
        toast.success(`Welcome back, ${response.data.customer.name}!`);
        navigate(`/dashboard/${response.data.customer.id}`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error("Account not found. Please sign up!");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!signupData.phone.trim() && !signupData.email.trim()) {
      toast.error("Please enter phone number or email");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/customers/signup`, {
        name: signupData.name.trim(),
        phone: signupData.phone.trim() || null,
        email: signupData.email.trim() || null
      });
      
      if (response.data.customer) {
        toast.success("Account created successfully!");
        navigate(`/dashboard/${response.data.customer.id}`);
      }
    } catch (error) {
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-velvet">
      {/* Background texture overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639434035519-43787d1ec895?crop=entropy&cs=srgb&fm=jpg&q=85')] opacity-5 bg-cover bg-center pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          {/* Logo */}
          <div className="logo-container inline-block mb-6">
            <img 
              src={LOGO_URL} 
              alt="The Crafty Couple" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain mx-auto rounded-full shadow-2xl"
              data-testid="logo-image"
            />
          </div>
          
          {/* Title */}
          <h1 className="font-script text-4xl md:text-6xl text-gold-gradient mb-2" data-testid="app-title">
            Rewards
          </h1>
          <p className="font-playfair text-lg md:text-xl text-[#F5F5DC] opacity-80">
            Earn punches. Unlock savings.
          </p>
        </header>

        {/* Rewards Info Section */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto mb-8 md:mb-12">
          <div className="glass-card rounded-lg p-3 md:p-4 text-center" data-testid="tier-10-info">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#8B0000]/20 flex items-center justify-center mx-auto mb-2">
              <Gift className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />
            </div>
            <p className="font-playfair text-xl md:text-2xl text-[#D4AF37] font-bold">15%</p>
            <p className="text-xs md:text-sm text-[#A1A1AA]">10 Punches</p>
          </div>
          
          <div className="glass-card rounded-lg p-3 md:p-4 text-center" data-testid="tier-15-info">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#8B0000]/20 flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />
            </div>
            <p className="font-playfair text-xl md:text-2xl text-[#D4AF37] font-bold">20%</p>
            <p className="text-xs md:text-sm text-[#A1A1AA]">15 Punches</p>
          </div>
          
          <div className="glass-card rounded-lg p-3 md:p-4 text-center" data-testid="tier-20-info">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#8B0000]/20 flex items-center justify-center mx-auto mb-2">
              <Crown className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />
            </div>
            <p className="font-playfair text-xl md:text-2xl text-[#D4AF37] font-bold">25%</p>
            <p className="text-xs md:text-sm text-[#A1A1AA]">20 Punches</p>
          </div>
        </div>

        {/* Main Card - Lookup / Signup */}
        <Card className="max-w-md mx-auto bg-[#121212]/80 backdrop-blur-md border-[#D4AF37]/20" data-testid="auth-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-playfair text-2xl text-[#F5F5DC]">
              <Sparkles className="inline-block w-5 h-5 mr-2 text-[#D4AF37]" />
              Start Earning
            </CardTitle>
            <CardDescription className="text-[#A1A1AA]">
              $10 spent = 1 punch earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="lookup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#1A1A1A]">
                <TabsTrigger 
                  value="lookup" 
                  className="data-[state=active]:bg-[#8B0000] data-[state=active]:text-white"
                  data-testid="lookup-tab"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find Account
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-[#8B0000] data-[state=active]:text-white"
                  data-testid="signup-tab"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              {/* Lookup Tab */}
              <TabsContent value="lookup" className="mt-4">
                <form onSubmit={handleLookup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lookup" className="text-[#F5F5DC]">Phone or Email</Label>
                    <Input
                      id="lookup"
                      type="text"
                      placeholder="Enter your phone or email"
                      value={lookupValue}
                      onChange={(e) => setLookupValue(e.target.value)}
                      className="bg-white/5 border-white/10 text-[#F5F5DC] placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                      data-testid="lookup-input"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#8B0000] hover:bg-[#A52A2A] text-white font-playfair"
                    disabled={isLoading}
                    data-testid="lookup-button"
                  >
                    {isLoading ? "Searching..." : "View My Rewards"}
                  </Button>
                </form>
              </TabsContent>
              
              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#F5F5DC]">Your Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      value={signupData.name}
                      onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                      className="bg-white/5 border-white/10 text-[#F5F5DC] placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                      data-testid="signup-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#F5F5DC]">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                      className="bg-white/5 border-white/10 text-[#F5F5DC] placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                      data-testid="signup-phone-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#F5F5DC]">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                      className="bg-white/5 border-white/10 text-[#F5F5DC] placeholder:text-white/30 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                      data-testid="signup-email-input"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#8B0000] hover:bg-[#A52A2A] text-white font-playfair"
                    disabled={isLoading}
                    data-testid="signup-button"
                  >
                    {isLoading ? "Creating Account..." : "Join Rewards Program"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Admin Link */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/admin')}
            className="text-[#A1A1AA] hover:text-[#D4AF37] text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
            data-testid="admin-link"
          >
            <Shield className="w-4 h-4" />
            Staff Access
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-[#525252] text-sm">
          <p className="font-playfair">The Crafty Couple &copy; {new Date().getFullYear()}</p>
          <p className="mt-1">Custom Tumblers, DTF Prints, Shirts & More!</p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
