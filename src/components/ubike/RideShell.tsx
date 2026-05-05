"use client";

import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MapPin, Navigation, Zap, Bike, Phone, Star, ShieldAlert, MessageCircle, ArrowLeft, Loader2, Wallet, CreditCard, ChevronRight, User } from 'lucide-react';
import { calculateFare, MOCK_RIDERS, MOCK_TRAFFIC, type RideType } from '@/lib/ride-service';
import { smartRiderMatcher, type SmartRiderMatcherOutput } from '@/ai/flows/smart-rider-matcher-flow';
import { analyzePostRideFeedback } from '@/ai/flows/post-ride-feedback-analyzer-flow';

type FlowState = 'LANDING' | 'BOOKING_PANEL' | 'MATCHING' | 'RIDE_IN_PROGRESS' | 'POST_RIDE' | 'RIDER_DASHBOARD' | 'RIDER_WALLET';

export default function RideShell() {
  const [state, setState] = useState<FlowState>('LANDING');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [rideType, setRideType] = useState<RideType>('Normal');
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [matchedRider, setMatchedRider] = useState<SmartRiderMatcherOutput | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<any>(null);

  // Estimation
  const distance = pickup && destination ? 5.2 : 0; // Simulated distance
  const estimatedFare = calculateFare(distance, rideType);

  const startBooking = () => {
    if (pickup && destination) {
      setState('BOOKING_PANEL');
    }
  };

  const findRider = async () => {
    setState('MATCHING');
    try {
      const result = await smartRiderMatcher({
        userLocation: pickup,
        destination: destination,
        desiredRideType: rideType,
        availableRiders: MOCK_RIDERS,
        trafficConditions: MOCK_TRAFFIC
      });
      setMatchedRider(result);
      // Wait a bit to simulate "searching" animation
      setTimeout(() => {
        setState('RIDE_IN_PROGRESS');
      }, 3000);
    } catch (error) {
      console.error(error);
      setState('BOOKING_PANEL');
    }
  };

  const completeRide = () => setState('POST_RIDE');

  const submitFeedback = async () => {
    if (feedback) {
      const analysis = await analyzePostRideFeedback({ comment: feedback });
      setFeedbackAnalysis(analysis);
    }
    setState('LANDING');
    // Clear form
    setPickup('');
    setDestination('');
    setFeedback('');
    setRating(0);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      {/* Navigation Header */}
      <header className="p-6 flex items-center justify-between z-10">
        <Logo />
        <div className="flex gap-4">
          <Button variant="ghost" className="text-muted-foreground hover:text-primary transition-colors" onClick={() => setState('RIDER_DASHBOARD')}>
            Rider Portal
          </Button>
          <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10" onClick={() => setState('LANDING')}>
            Home
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* State Transitions Container */}
        <div className="w-full max-w-lg mx-auto z-10 transition-all duration-500">
          
          {/* 1. LANDING / HERO */}
          {state === 'LANDING' && (
            <div className="animate-fade-in-up space-y-8 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                  Premium motorbike travel,<br/>
                  <span className="text-primary">elevated.</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                  Safe, reliable, and sustainable rides for the modern urban traveler.
                </p>
              </div>

              <Card className="glass-morphism overflow-hidden shadow-2xl border-white/5">
                <CardContent className="p-0">
                  <Tabs defaultValue="Normal" onValueChange={(v) => setRideType(v as RideType)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-14 bg-white/5 rounded-none p-0 border-b border-white/5">
                      <TabsTrigger 
                        value="Normal" 
                        className="data-[state=active]:bg-white/5 data-[state=active]:text-white rounded-none h-full transition-all duration-300"
                      >
                        <Bike className="w-4 h-4 mr-2" />
                        Normal Bikes
                      </TabsTrigger>
                      <TabsTrigger 
                        value="Electric" 
                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-none h-full transition-all duration-300"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Electric Bikes ⚡
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="p-6 space-y-6">
                      <div className="space-y-4">
                        <div className="relative group">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary transition-transform group-focus-within:scale-110" />
                          <Input 
                            placeholder="Pickup location" 
                            className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary/50" 
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                          />
                        </div>
                        <div className="relative group">
                          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent transition-transform group-focus-within:scale-110" />
                          <Input 
                            placeholder="Destination" 
                            className="pl-10 h-12 bg-white/5 border-white/10 focus:border-primary/50"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                          />
                        </div>
                      </div>

                      {pickup && destination && (
                        <div className="animate-in fade-in slide-in-from-top-2 text-center py-2">
                          <p className="text-sm text-muted-foreground">Estimated Fare</p>
                          <p className="text-2xl font-bold text-white">{estimatedFare}</p>
                        </div>
                      )}

                      <Button 
                        className="w-full h-14 text-lg font-semibold bg-accent hover:bg-accent/90 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={startBooking}
                      >
                        Book Ride
                      </Button>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 2. BOOKING PANEL */}
          {state === 'BOOKING_PANEL' && (
            <div className="animate-slide-in-right space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setState('LANDING')}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold text-white">Ride Summary</h2>
              </div>

              <Card className="glass-morphism border-white/10 shadow-xl overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Selected Service</p>
                      <div className="flex items-center gap-2">
                        {rideType === 'Electric' ? (
                          <div className="bg-primary/10 p-2 rounded-lg text-primary">
                            <Zap className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="bg-white/5 p-2 rounded-lg text-white">
                            <Bike className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-lg">{rideType === 'Electric' ? 'Electric Ride' : 'Standard Ride'}</p>
                          <p className="text-xs text-muted-foreground">{rideType === 'Electric' ? 'Premium & Eco-friendly' : 'Reliable & Quick'}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-primary">{estimatedFare}</p>
                  </div>

                  <div className="h-px bg-white/5 w-full" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="booking-for" className="text-base font-medium">Book for someone else</Label>
                      <Switch 
                        id="booking-for" 
                        checked={forSomeoneElse} 
                        onCheckedChange={setForSomeoneElse}
                      />
                    </div>

                    {forSomeoneElse && (
                      <div className="animate-in slide-in-from-top-4 fade-in duration-300 space-y-4">
                        <Input 
                          placeholder="Passenger Name" 
                          className="h-12 bg-white/5 border-white/10"
                          value={passengerName}
                          onChange={(e) => setPassengerName(e.target.value)}
                        />
                        <Input 
                          placeholder="Passenger Phone Number" 
                          className="h-12 bg-white/5 border-white/10"
                          value={passengerPhone}
                          onChange={(e) => setPassengerPhone(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Payment Method</p>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#00BE00]/20 p-2 rounded text-[#00BE00] text-xs font-black italic">M-PESA</div>
                        <span className="font-medium">M-Pesa Express</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Default</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-bold text-lg"
                    onClick={findRider}
                  >
                    Confirm & Pay
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 3. MATCHING */}
          {state === 'MATCHING' && (
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                <div className="relative h-32 w-32 bg-card rounded-full flex items-center justify-center border-4 border-primary/30">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Searching for rider...</h2>
                <p className="text-muted-foreground">Matching you with the best available u-bike near you.</p>
              </div>
            </div>
          )}

          {/* 4. RIDE IN PROGRESS */}
          {state === 'RIDE_IN_PROGRESS' && matchedRider && (
            <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-6">
              <div className="flex justify-between items-center bg-primary/10 p-4 rounded-xl border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-full text-primary">
                    <Navigation className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Trip in progress</p>
                    <p className="text-xs text-muted-foreground">Arriving in approx. 8 mins</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">5.2 km</p>
                  <p className="text-xs text-muted-foreground">to destination</p>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="w-full aspect-video bg-white/5 rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/800/600')] bg-cover opacity-30 grayscale contrast-125" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                   <div className="relative h-12 w-12 bg-accent rounded-full border-2 border-white shadow-lg animate-bounce flex items-center justify-center">
                     <Bike className="w-6 h-6 text-white" />
                   </div>
                </div>
              </div>

              <Card className="glass-morphism border-white/5 shadow-2xl">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center border-2 border-primary/30">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">{matchedRider.riderName}</h3>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-sm text-primary font-bold">
                            <Star className="w-4 h-4 fill-primary" /> {matchedRider.riderRating}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-sm text-muted-foreground">{matchedRider.bikeType} Bike</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" className="rounded-full border-white/10 hover:bg-white/5">
                        <MessageCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-12 border-destructive/20 text-destructive hover:bg-destructive/10">
                      <ShieldAlert className="w-4 h-4 mr-2" /> Emergency
                    </Button>
                    <Button className="h-12 bg-accent hover:bg-accent/90" onClick={completeRide}>
                      Finish Trip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 5. POST RIDE */}
          {state === 'POST_RIDE' && (
            <div className="animate-in fade-in slide-in-from-top-8 duration-500 space-y-8 text-center">
              <div className="space-y-4">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Star className="w-10 h-10 fill-primary" />
                </div>
                <h2 className="text-3xl font-bold">Rate your ride</h2>
                <p className="text-muted-foreground">How was your journey with {matchedRider?.riderName}?</p>
              </div>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setRating(s)}
                    className={`transition-all duration-200 transform hover:scale-125 ${rating >= s ? 'text-primary' : 'text-white/10'}`}
                  >
                    <Star className={`w-10 h-10 ${rating >= s ? 'fill-primary' : ''}`} />
                  </button>
                ))}
              </div>

              <div className="space-y-4 max-w-sm mx-auto">
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[100px] focus:border-primary/50 outline-none"
                  placeholder="Tell us about your experience..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <Button 
                  className="w-full h-14 bg-primary text-background font-bold text-lg hover:bg-primary/90"
                  onClick={submitFeedback}
                >
                  Submit Review
                </Button>
              </div>
            </div>
          )}

          {/* 6. RIDER DASHBOARD (UI ONLY) */}
          {state === 'RIDER_DASHBOARD' && (
            <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Rider Dashboard</h2>
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <span className="text-sm font-medium">Available</span>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Card className="glass-morphism border-primary/20 shadow-xl overflow-hidden animate-pulse-subtle">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg text-primary">
                          <Zap className="w-5 h-5" />
                        </div>
                        <span className="font-bold">New Ride Request</span>
                      </div>
                      <span className="text-primary font-bold">KES 450</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" /> 2.1km away (Westlands)
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Navigation className="w-4 h-4" /> Destination: CBD
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-primary text-background font-bold">Accept</Button>
                      <Button variant="outline" className="flex-1 border-white/10">Decline</Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2 border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={() => setState('RIDER_WALLET')}
                  >
                    <Wallet className="w-6 h-6 text-primary" />
                    <span>My Wallet</span>
                  </Button>
                  <Card className="bg-white/5 border-white/10 flex items-center justify-center flex-col gap-2">
                    <Star className="w-6 h-6 text-primary fill-primary" />
                    <span className="font-bold">4.9 Rating</span>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* 7. RIDER WALLET */}
          {state === 'RIDER_WALLET' && (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setState('RIDER_DASHBOARD')}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold">Rider Wallet</h2>
              </div>

              <Card className="bg-gradient-to-br from-primary to-accent border-none text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-8 space-y-6 relative z-10">
                  <div className="space-y-1">
                    <p className="text-white/70 text-sm font-medium uppercase tracking-widest">Total Balance</p>
                    <p className="text-5xl font-black">KES 12,450</p>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-white/70 text-xs">This Week</p>
                      <p className="font-bold">KES 3,200</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-xs">Trips</p>
                      <p className="font-bold">142</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Button className="w-full h-16 bg-white text-background hover:bg-white/90 text-lg font-bold rounded-2xl">
                  <CreditCard className="w-6 h-6 mr-3" /> Withdraw to M-Pesa
                </Button>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-bold px-1">Recent Activity</h3>
                  {[
                    { label: 'Trip #8492', date: 'Today, 2:45 PM', amount: '+ KES 450' },
                    { label: 'Trip #8491', date: 'Today, 1:12 PM', amount: '+ KES 320' },
                    { label: 'Withdrawal', date: 'Yesterday', amount: '- KES 2,000', color: 'text-accent' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                      <div>
                        <p className="font-bold group-hover:text-primary transition-colors">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                      <p className={`font-black ${item.color || 'text-primary'}`}>{item.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px]" />
        </div>
      </main>

      {/* Footer / Info */}
      <footer className="p-6 text-center border-t border-white/5 opacity-50 text-xs tracking-widest font-medium uppercase">
        © 2024 u-bike global • premium mobility
      </footer>
    </div>
  );
}
