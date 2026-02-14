import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  ArrowLeft, Search, Plus, Gift, Star, Crown, Users, 
  DollarSign, Sparkles, Delete, Lock, Check, X
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_punch-tracker-11/artifacts/cxump35k_new%20logo.png";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddPunchDialog, setShowAddPunchDialog] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated]);

  const handlePinInput = (digit) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      toast.error("Please enter 4-digit PIN");
      return;
    }

    try {
      const response = await axios.post(`${API}/admin/login`, { pin });
      if (response.data.success) {
        setIsAuthenticated(true);
        toast.success("Welcome, Admin!");
      }
    } catch (error) {
      toast.error("Invalid PIN");
      setPin("");
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/admin/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error("Failed to load customers");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchCustomers();
      return;
    }

    try {
      const response = await axios.post(`${API}/customers/lookup`, {
        identifier: searchQuery.trim()
      });
      if (response.data.customer) {
        setSelectedCustomer(response.data.customer);
      }
    } catch (error) {
      toast.error("Customer not found");
    }
  };

  const handleAddPunch = async () => {
    if (!selectedCustomer || !transactionAmount) {
      toast.error("Please select a customer and enter amount");
      return;
    }

    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount < 10) {
      toast.error("Amount must be at least $10");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/admin/add-punch`, {
        customer_id: selectedCustomer.id,
        amount: amount
      });
      
      toast.success(`Added ${response.data.punches_added} punch(es) to ${selectedCustomer.name}!`);
      setSelectedCustomer(response.data.customer);
      setTransactionAmount("");
      setShowAddPunchDialog(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add punch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemReward = async (tier) => {
    if (!selectedCustomer) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/admin/redeem-reward`, {
        customer_id: selectedCustomer.id,
        tier: tier
      });
      
      toast.success(`Redeemed ${response.data.reward_redeemed} for ${selectedCustomer.name}!`);
      setSelectedCustomer(response.data.customer);
      setShowRedeemDialog(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to redeem reward");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // PIN Entry Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-velvet flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639434035519-43787d1ec895?crop=entropy&cs=srgb&fm=jpg&q=85')] opacity-5 bg-cover bg-center pointer-events-none" />
        
        <Card className="w-full max-w-sm bg-[#121212]/90 backdrop-blur-md border-[#D4AF37]/30 relative z-10" data-testid="pin-card">
          <CardHeader className="text-center">
            <img 
              src={LOGO_URL} 
              alt="The Crafty Couple" 
              className="w-20 h-20 object-contain mx-auto mb-4 rounded-full"
            />
            <CardTitle className="font-playfair text-2xl text-[#F5F5DC] flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-[#D4AF37]" />
              Staff Access
            </CardTitle>
            <CardDescription className="text-[#A1A1AA]">
              Enter your 4-digit PIN
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* PIN Display */}
            <div className="flex justify-center gap-3 mb-6">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                    pin.length > i 
                      ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]' 
                      : 'border-white/20 bg-white/5'
                  }`}
                  data-testid={`pin-dot-${i}`}
                >
                  {pin.length > i ? '•' : ''}
                </div>
              ))}
            </div>

            {/* PIN Pad */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                <button
                  key={digit}
                  onClick={() => handlePinInput(digit.toString())}
                  className="pin-button"
                  data-testid={`pin-${digit}`}
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handlePinDelete}
                className="pin-button text-[#EF4444]"
                data-testid="pin-delete"
              >
                <Delete className="w-6 h-6 mx-auto" />
              </button>
              <button
                onClick={() => handlePinInput('0')}
                className="pin-button"
                data-testid="pin-0"
              >
                0
              </button>
              <button
                onClick={handlePinSubmit}
                className="pin-button bg-[#8B0000] border-[#8B0000] text-white hover:bg-[#A52A2A]"
                data-testid="pin-submit"
              >
                <Check className="w-6 h-6 mx-auto" />
              </button>
            </div>

            <button 
              onClick={() => navigate("/")}
              className="w-full text-[#A1A1AA] hover:text-[#D4AF37] text-sm mt-4 transition-colors"
              data-testid="back-to-home"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Back to Home
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="bg-[#121212] border-b border-white/10 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={LOGO_URL} 
              alt="The Crafty Couple" 
              className="w-10 h-10 object-contain rounded-full"
            />
            <div>
              <h1 className="font-playfair text-lg text-[#F5F5DC]">Admin Panel</h1>
              <p className="text-xs text-[#A1A1AA]">The Crafty Couple's Rewards</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsAuthenticated(false);
              setPin("");
              navigate("/");
            }}
            className="text-[#A1A1AA] hover:text-[#D4AF37] transition-colors"
            data-testid="logout-button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer List */}
          <div className="lg:col-span-2">
            {/* Search Bar */}
            <Card className="bg-[#1A1A1A] border-white/10 mb-4" data-testid="search-card">
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-white/5 border-white/10 text-[#F5F5DC] placeholder:text-white/30"
                    data-testid="search-input"
                  />
                  <Button 
                    onClick={handleSearch}
                    className="bg-[#8B0000] hover:bg-[#A52A2A]"
                    data-testid="search-button"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card className="bg-[#1A1A1A] border-white/10" data-testid="total-customers-stat">
                <CardContent className="pt-4 text-center">
                  <Users className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                  <p className="text-2xl font-playfair text-[#F5F5DC]">{customers.length}</p>
                  <p className="text-xs text-[#A1A1AA]">Customers</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1A1A1A] border-white/10" data-testid="total-revenue-stat">
                <CardContent className="pt-4 text-center">
                  <DollarSign className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                  <p className="text-2xl font-playfair text-[#F5F5DC]">
                    ${customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toFixed(0)}
                  </p>
                  <p className="text-xs text-[#A1A1AA]">Total Revenue</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1A1A1A] border-white/10" data-testid="total-punches-stat">
                <CardContent className="pt-4 text-center">
                  <Sparkles className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                  <p className="text-2xl font-playfair text-[#F5F5DC]">
                    {customers.reduce((sum, c) => sum + (c.punches || 0), 0)}
                  </p>
                  <p className="text-xs text-[#A1A1AA]">Active Punches</p>
                </CardContent>
              </Card>
            </div>

            {/* Customer List */}
            <Card className="bg-[#1A1A1A] border-white/10" data-testid="customers-list-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-playfair text-lg text-[#F5F5DC]">
                  All Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedCustomer?.id === customer.id
                            ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/50'
                            : 'bg-white/5 border border-transparent hover:bg-white/10'
                        }`}
                        data-testid={`customer-row-${customer.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-playfair text-[#F5F5DC]">{customer.name}</p>
                            <p className="text-xs text-[#A1A1AA]">
                              {customer.phone || customer.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#D4AF37] font-semibold">{customer.punches} punches</p>
                            <p className="text-xs text-[#A1A1AA]">${customer.total_spent?.toFixed(2) || '0.00'} spent</p>
                          </div>
                        </div>
                        {customer.available_rewards?.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            {customer.available_rewards.map((r, i) => (
                              <Badge key={i} className="bg-[#8B0000] text-white text-xs">
                                {r.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <div className="text-center py-8 text-[#A1A1AA]">
                        No customers found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Selected Customer Actions */}
          <div>
            {selectedCustomer ? (
              <Card className="bg-[#121212] border-[#D4AF37]/30 sticky top-4" data-testid="selected-customer-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-playfair text-xl text-[#F5F5DC]">
                    {selectedCustomer.name}
                  </CardTitle>
                  <CardDescription className="text-[#A1A1AA]">
                    {selectedCustomer.phone || selectedCustomer.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-card rounded-lg p-3 text-center">
                      <p className="text-2xl font-playfair text-[#D4AF37]" data-testid="selected-punches">
                        {selectedCustomer.punches}
                      </p>
                      <p className="text-xs text-[#A1A1AA]">Punches</p>
                    </div>
                    <div className="glass-card rounded-lg p-3 text-center">
                      <p className="text-2xl font-playfair text-[#D4AF37]" data-testid="selected-spent">
                        ${selectedCustomer.total_spent?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-[#A1A1AA]">Total Spent</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <Button
                    onClick={() => setShowAddPunchDialog(true)}
                    className="w-full bg-[#8B0000] hover:bg-[#A52A2A] font-playfair"
                    data-testid="add-punch-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                  </Button>

                  {/* Available Rewards to Redeem */}
                  {selectedCustomer.punches >= 10 && (
                    <Button
                      onClick={() => setShowRedeemDialog(true)}
                      variant="outline"
                      className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-playfair"
                      data-testid="redeem-button"
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Redeem Reward
                    </Button>
                  )}

                  {/* Punch Progress Visual */}
                  <div className="pt-4">
                    <p className="text-sm text-[#A1A1AA] mb-2">Punch Progress</p>
                    <div className="grid grid-cols-10 gap-1">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className={`aspect-square rounded-full ${
                            i < selectedCustomer.punches
                              ? 'bg-[#D4AF37]'
                              : 'bg-white/10'
                          } ${[9, 14, 19].includes(i) ? 'ring-2 ring-[#8B0000]' : ''}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-[#A1A1AA] mt-2">
                      <span>10: 15%</span>
                      <span>15: 20%</span>
                      <span>20: 25%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#1A1A1A] border-white/10" data-testid="no-selection-card">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-[#525252] mx-auto mb-4" />
                  <p className="text-[#A1A1AA]">Select a customer to manage their rewards</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add Punch Dialog */}
      <Dialog open={showAddPunchDialog} onOpenChange={setShowAddPunchDialog}>
        <DialogContent className="bg-[#1A1A1A] border-[#D4AF37]/30 text-[#F5F5DC]" data-testid="add-punch-dialog">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl">Add Transaction</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Enter the purchase amount for {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[#F5F5DC]">Purchase Amount ($)</Label>
              <Input
                type="number"
                min="10"
                step="0.01"
                placeholder="Enter amount (min $10)"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                className="bg-white/5 border-white/10 text-[#F5F5DC] placeholder:text-white/30"
                data-testid="transaction-amount-input"
              />
              <p className="text-xs text-[#A1A1AA]">
                {transactionAmount && parseFloat(transactionAmount) >= 10 
                  ? `This will add ${Math.floor(parseFloat(transactionAmount) / 10)} punch(es)`
                  : '$10 = 1 punch'}
              </p>
            </div>
            <Button
              onClick={handleAddPunch}
              disabled={isLoading || !transactionAmount || parseFloat(transactionAmount) < 10}
              className="w-full bg-[#8B0000] hover:bg-[#A52A2A] font-playfair"
              data-testid="confirm-add-punch"
            >
              {isLoading ? "Adding..." : "Add Punches"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redeem Reward Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="bg-[#1A1A1A] border-[#D4AF37]/30 text-[#F5F5DC]" data-testid="redeem-dialog">
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl">Redeem Reward</DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Select a reward for {selectedCustomer?.name} ({selectedCustomer?.punches} punches)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {/* 10 Punch - 15% */}
            <button
              onClick={() => handleRedeemReward(10)}
              disabled={selectedCustomer?.punches < 10 || isLoading}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                selectedCustomer?.punches >= 10
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20'
                  : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
              }`}
              data-testid="redeem-10"
            >
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-[#D4AF37]" />
                <div>
                  <p className="font-playfair font-semibold text-[#F5F5DC]">15% Off</p>
                  <p className="text-xs text-[#A1A1AA]">Uses 10 punches</p>
                </div>
              </div>
            </button>

            {/* 15 Punch - 20% */}
            <button
              onClick={() => handleRedeemReward(15)}
              disabled={selectedCustomer?.punches < 15 || isLoading}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                selectedCustomer?.punches >= 15
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20'
                  : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
              }`}
              data-testid="redeem-15"
            >
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-[#D4AF37]" />
                <div>
                  <p className="font-playfair font-semibold text-[#F5F5DC]">20% Off</p>
                  <p className="text-xs text-[#A1A1AA]">Uses 15 punches</p>
                </div>
              </div>
            </button>

            {/* 20 Punch - 25% */}
            <button
              onClick={() => handleRedeemReward(20)}
              disabled={selectedCustomer?.punches < 20 || isLoading}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                selectedCustomer?.punches >= 20
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20'
                  : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
              }`}
              data-testid="redeem-20"
            >
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-[#D4AF37]" />
                <div>
                  <p className="font-playfair font-semibold text-[#F5F5DC]">25% Off</p>
                  <p className="text-xs text-[#A1A1AA]">Uses 20 punches</p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
