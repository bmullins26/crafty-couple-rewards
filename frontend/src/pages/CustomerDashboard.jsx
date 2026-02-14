import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Gift, Star, Crown, ArrowLeft, DollarSign, 
  CheckCircle, Clock, Sparkles, Trophy
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_punch-tracker-11/artifacts/cxump35k_new%20logo.png";

const CustomerDashboard = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [nextReward, setNextReward] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      const response = await axios.get(`${API}/customers/${customerId}`);
      setCustomer(response.data.customer);
      setTransactions(response.data.transactions || []);
      setAvailableRewards(response.data.available_rewards || []);
      setNextReward(response.data.next_reward);
    } catch (error) {
      toast.error("Could not load your rewards");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-velvet flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#A1A1AA]">Loading your rewards...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const punches = customer.punches || 0;
  const progressPercent = Math.min((punches / 20) * 100, 100);

  return (
    <div className="min-h-screen bg-velvet">
      {/* Background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639434035519-43787d1ec895?crop=entropy&cs=srgb&fm=jpg&q=85')] opacity-5 bg-cover bg-center pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate("/")}
            className="text-[#A1A1AA] hover:text-[#D4AF37] transition-colors"
            data-testid="back-button"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <img 
            src={LOGO_URL} 
            alt="The Crafty Couple" 
            className="w-12 h-12 object-contain rounded-full"
          />
          <div className="w-6" /> {/* Spacer */}
        </header>

        {/* Welcome Section */}
        <div className="text-center mb-6">
          <p className="font-script text-3xl text-[#D4AF37] mb-1" data-testid="welcome-text">
            Welcome back,
          </p>
          <h1 className="font-playfair text-2xl text-[#F5F5DC]" data-testid="customer-name">
            {customer.name}!
          </h1>
        </div>

        {/* Punch Card */}
        <Card className="bg-[#121212]/80 backdrop-blur-md border-[#D4AF37]/30 mb-6" data-testid="punch-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-playfair text-xl text-[#F5F5DC] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
              Your Punch Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Punch Grid */}
            <div className="punch-grid mb-4">
              {[...Array(20)].map((_, index) => {
                const isFilled = index < punches;
                const isMilestone = index === 9 || index === 14 || index === 19;
                
                return (
                  <div 
                    key={index}
                    className={`punch-circle ${isFilled ? 'filled' : 'empty'} ${isMilestone ? 'milestone' : ''} ${isFilled ? 'animate-punch' : ''}`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    data-testid={`punch-${index + 1}`}
                  >
                    {isFilled && (
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    )}
                    {!isFilled && isMilestone && (
                      <span className="text-xs text-[#D4AF37] font-bold">
                        {index === 9 ? '10' : index === 14 ? '15' : '20'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#A1A1AA]">Progress</span>
                <span className="text-[#D4AF37] font-semibold" data-testid="punch-count">
                  {punches} / 20 punches
                </span>
              </div>
              <div className="progress-track">
                <div 
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Next Reward Info */}
            {nextReward && !nextReward.max_reached && (
              <div className="glass-card rounded-lg p-3 text-center" data-testid="next-reward-info">
                <p className="text-[#A1A1AA] text-sm">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {nextReward.punches_needed} more punch{nextReward.punches_needed !== 1 ? 'es' : ''} to unlock
                </p>
                <p className="text-[#D4AF37] font-playfair text-lg font-semibold">
                  {nextReward.discount}% Off!
                </p>
              </div>
            )}
            
            {nextReward?.max_reached && (
              <div className="glass-card rounded-lg p-3 text-center bg-[#D4AF37]/10" data-testid="max-reward-info">
                <Trophy className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                <p className="text-[#D4AF37] font-playfair">Maximum rewards unlocked!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-[#1A1A1A]/80 border-white/10" data-testid="total-spent-card">
            <CardContent className="pt-4 text-center">
              <DollarSign className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
              <p className="text-2xl font-playfair text-[#F5F5DC]" data-testid="total-spent">
                ${customer.total_spent?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-[#A1A1AA]">Total Spent</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1A1A1A]/80 border-white/10" data-testid="punches-card">
            <CardContent className="pt-4 text-center">
              <Sparkles className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
              <p className="text-2xl font-playfair text-[#F5F5DC]" data-testid="current-punches">
                {punches}
              </p>
              <p className="text-xs text-[#A1A1AA]">Current Punches</p>
            </CardContent>
          </Card>
        </div>

        {/* Available Rewards */}
        <Card className="bg-[#121212]/80 backdrop-blur-md border-[#D4AF37]/30 mb-6" data-testid="rewards-section">
          <CardHeader className="pb-2">
            <CardTitle className="font-playfair text-xl text-[#F5F5DC] flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#D4AF37]" />
              Available Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* 10 Punch Tier */}
              <div 
                className={`tier-card ${punches >= 10 ? 'available' : 'locked'}`}
                data-testid="tier-10-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift className={`w-6 h-6 ${punches >= 10 ? 'text-[#D4AF37]' : 'text-[#525252]'}`} />
                    <div>
                      <p className={`font-playfair font-semibold ${punches >= 10 ? 'text-[#F5F5DC]' : 'text-[#525252]'}`}>
                        15% Off
                      </p>
                      <p className="text-xs text-[#A1A1AA]">10 punches required</p>
                    </div>
                  </div>
                  {punches >= 10 ? (
                    <Badge className="bg-[#D4AF37] text-black">Ready!</Badge>
                  ) : (
                    <Badge variant="outline" className="border-[#525252] text-[#525252]">
                      {10 - punches} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* 15 Punch Tier */}
              <div 
                className={`tier-card ${punches >= 15 ? 'available' : 'locked'}`}
                data-testid="tier-15-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className={`w-6 h-6 ${punches >= 15 ? 'text-[#D4AF37]' : 'text-[#525252]'}`} />
                    <div>
                      <p className={`font-playfair font-semibold ${punches >= 15 ? 'text-[#F5F5DC]' : 'text-[#525252]'}`}>
                        20% Off
                      </p>
                      <p className="text-xs text-[#A1A1AA]">15 punches required</p>
                    </div>
                  </div>
                  {punches >= 15 ? (
                    <Badge className="bg-[#D4AF37] text-black">Ready!</Badge>
                  ) : (
                    <Badge variant="outline" className="border-[#525252] text-[#525252]">
                      {15 - punches} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* 20 Punch Tier */}
              <div 
                className={`tier-card ${punches >= 20 ? 'available' : 'locked'}`}
                data-testid="tier-20-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className={`w-6 h-6 ${punches >= 20 ? 'text-[#D4AF37]' : 'text-[#525252]'}`} />
                    <div>
                      <p className={`font-playfair font-semibold ${punches >= 20 ? 'text-[#F5F5DC]' : 'text-[#525252]'}`}>
                        25% Off
                      </p>
                      <p className="text-xs text-[#A1A1AA]">20 punches required</p>
                    </div>
                  </div>
                  {punches >= 20 ? (
                    <Badge className="bg-[#D4AF37] text-black">Ready!</Badge>
                  ) : (
                    <Badge variant="outline" className="border-[#525252] text-[#525252]">
                      {20 - punches} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-[#A1A1AA] mt-4">
              Ask staff to redeem your reward at checkout
            </p>
          </CardContent>
        </Card>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <Card className="bg-[#121212]/80 backdrop-blur-md border-white/10" data-testid="transactions-section">
            <CardHeader className="pb-2">
              <CardTitle className="font-playfair text-lg text-[#F5F5DC]">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {transactions.map((tx, index) => (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                      data-testid={`transaction-${index}`}
                    >
                      <div>
                        <p className="text-[#F5F5DC] text-sm">
                          {tx.reward_redeemed ? (
                            <span className="text-[#D4AF37]">Reward: {tx.reward_redeemed}</span>
                          ) : (
                            <span>+{tx.punches_added} punch{tx.punches_added !== 1 ? 'es' : ''}</span>
                          )}
                        </p>
                        <p className="text-xs text-[#A1A1AA]">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {tx.amount > 0 && (
                        <span className="text-[#A1A1AA] text-sm">
                          ${tx.amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="text-center mt-8 text-[#525252] text-xs">
          <p>Rewards never expire!</p>
          <p className="mt-1">Contact: {customer.phone || customer.email}</p>
        </footer>
      </div>
    </div>
  );
};

export default CustomerDashboard;
