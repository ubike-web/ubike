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

  const distance = pickup && destination ? 5.2 : 0;
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
    setPickup('');
    setDestination('');
    setFeedback('');
    setRating(0);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      {/* Navigation Header */}
      <header className="p-6 flex items-center justify-between z-10 border-b bg-background/80 backdrop-blur-md sticky top-0">
        <Logo className="h-10" />
        <div className="flex gap-4">
          <Button variant="ghost" className="text-muted-foreground hover:text-primary transition-colors" onClick={() => setState('RIDER_DASHBOARD')}>
            Rider Portal
          </Button>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/5" onClick={() => setState('LANDING')}>
            Home
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full max-w-lg mx-auto z-10 transition-all duration-500">
          
          {/* 1. LANDING / HERO */}
          {state === 'LANDING' && (
            <div className="animate-fade-in-up space-y-8 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                  Premium motorbike travel,<br/>
                  <span className="text-primary">elevated.</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                  Safe, reliable, and sustainable rides for the modern urban traveler.
                </p>
              </div>

              <Card className="glass-morphism overflow-hidden shadow-xl border-border">
                <CardContent className="p-0">
                  <Tabs defaultValue="Normal" onValueChange={(v) => setRideType(v as RideType)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-14 bg-muted rounded-none p-0 border-b">
                      <TabsTrigger 
                        value="Normal" 
                        className="data-[state=active]:bg-background data-[state=active]:text-primary rounded-none h-full transition-all duration-300"
                      >
                        <Bike className="w-4 h-4 mr-2" />
                        Normal Bikes
                      </TabsTrigger>
                      <TabsTrigger 
                        value="Electric" 
                        className="data-[state=active]:bg-background data-[state=active]:text-primary rounded-none h-full transition-all duration-300"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Electric Bikes ⚡
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="p-6 space-y-6 bg-background">
                      <div className="space-y-4">
                        <div className="relative group">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary transition-transform group-focus-within:scale-110" />
                          <Input 
                            placeholder="Pickup location" 
                            className="pl-10 h-12 bg-muted/50 border-border focus:border-primary focus:ring-1 focus:ring-primary" 
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                          />
                        </div>
                        <div className="relative group">
                          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary transition-transform group-focus-within:scale-110" />
                          <Input 
                            placeholder="Destination" 
                            className="pl-10 h-12 bg-muted/50 border-border focus:border-primary focus:ring-1 focus:ring-primary"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                          />
                        </div>
                      </div>

                      {pickup && destination && (
                        <div className="animate-in fade-in slide-in-from-top-2 text-center py-2">
                          <p className="text-sm text-muted-foreground">Estimated Fare</p>
                          <p className="text-2xl font-bold text-primary">{estimatedFare}</p>
                        </div>
                      )}

                      <Button 
                        className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                <Button variant="ghost" size="icon" onClick={() => setState('LANDING')} className="text-foreground hover:bg-muted">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold text-foreground">Ride Summary</h2>
              </div>

              <Card className="glass-morphism border-border shadow-xl overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Selected Service</p>
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                          {rideType === 'Electric' ? <Zap className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-foreground">{rideType === 'Electric' ? 'Electric Ride' : 'Standard Ride'}</p>
                          <p className="text-xs text-muted-foreground">{rideType === 'Electric' ? 'Premium & Eco-friendly' : 'Reliable & Quick'}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-primary">{estimatedFare}</p>
                  </div>

                  <div className="h-px bg-border w-full" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="booking-for" className="text-base font-medium text-foreground">Book for someone else</Label>
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
                          className="h-12 bg-muted/50 border-border"
                          value={passengerName}
                          onChange={(e) => setPassengerName(e.target.value)}
                        />
                        <Input 
                          placeholder="Passenger Phone Number" 
                          className="h-12 bg-muted/50 border-border"
                          value={passengerPhone}
                          onChange={(e) => setPassengerPhone(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Payment Method</p>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#00BE00] px-2 py-0.5 rounded text-white text-[10px] font-black italic">M-PESA</div>
                        <span className="font-medium text-foreground">M-Pesa Express</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Default</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg"
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
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
                <div className="relative h-32 w-32 bg-background rounded-full flex items-center justify-center border-4 border-primary/20">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Searching for rider...</h2>
                <p className="text-muted-foreground">Matching you with the best available u-bike near you.</p>
              </div>
            </div>
          )}

          {/* 4. RIDE IN PROGRESS */}
          {state === 'RIDE_IN_PROGRESS' && matchedRider && (
            <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-6">
              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                    <Navigation className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Trip in progress</p>
                    <p className="text-xs text-muted-foreground">Arriving in approx. 8 mins</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">5.2 km</p>
                  <p className="text-xs text-muted-foreground">to destination</p>
                </div>
              </div>

              <div className="w-full aspect-video bg-muted rounded-2xl relative overflow-hidden group border border-border">
                <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/800/600')] bg-cover opacity-50 grayscale contrast-75" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                   <div className="relative h-12 w-12 bg-primary rounded-full border-2 border-white shadow-lg animate-bounce flex items-center justify-center">
                     <Bike className="w-6 h-6 text-white" />
                   </div>
                </div>
              </div>

              <Card className="glass-morphism border-border shadow-2xl">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                        <User className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-foreground">{matchedRider.riderName}</h3>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-sm text-primary font-bold">
                            <Star className="w-4 h-4 fill-primary" /> {matchedRider.riderRating}
                          </span>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="text-sm text-muted-foreground">{matchedRider.bikeType} Bike</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" className="rounded-full border-border hover:bg-muted">
                        <MessageCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-12 border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive">
                      <ShieldAlert className="w-4 h-4 mr-2" /> Emergency
                    </Button>
                    <Button className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={completeRide}>
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
                <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Star className="w-10 h-10 fill-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">Rate your ride</h2>
                <p className="text-muted-foreground">How was your journey with {matchedRider?.riderName}?</p>
              </div>

              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setRating(s)}
                    className={`transition-all duration-200 transform hover:scale-125 ${rating >= s ? 'text-primary' : 'text-muted/20'}`}
                  >
                    <Star className={`w-10 h-10 ${rating >= s ? 'fill-primary' : ''}`} />
                  </button>
                ))}
              </div>

              <div className="space-y-4 max-w-sm mx-auto">
                <textarea 
                  className="w-full bg-muted/50 border border-border rounded-xl p-4 min-h-[100px] focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground"
                  placeholder="Tell us about your experience..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <Button 
                  className="w-full h-14 bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90"
                  onClick={submitFeedback}
                >
                  Submit Review
                </Button>
              </div>
            </div>
          )}

          {/* 6. RIDER DASHBOARD */}
          {state === 'RIDER_DASHBOARD' && (
            <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">Rider Dashboard</h2>
                <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-full border border-border">
                  <span className="text-sm font-medium text-muted-foreground">Available</span>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Card className="glass-morphism border-primary/20 shadow-xl overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                          <Zap className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-foreground">New Ride Request</span>
                      </div>
                      <span className="text-primary font-bold text-lg">KES 450</span>
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
                      <Button className="flex-1 bg-primary text-primary-foreground font-bold hover:bg-primary/90">Accept</Button>
                      <Button variant="outline" className="flex-1 border-border text-foreground hover:bg-muted">Decline</Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col gap-2 border-border bg-background hover:bg-muted text-foreground"
                    onClick={() => setState('RIDER_WALLET')}
                  >
                    <Wallet className="w-6 h-6 text-primary" />
                    <span>My Wallet</span>
                  </Button>
                  <Card className="bg-background border-border flex items-center justify-center flex-col gap-2">
                    <Star className="w-6 h-6 text-primary fill-primary" />
                    <span className="font-bold text-foreground">4.9 Rating</span>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* 7. RIDER WALLET */}
          {state === 'RIDER_WALLET' && (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setState('RIDER_DASHBOARD')} className="hover:bg-muted">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold text-foreground">Rider Wallet</h2>
              </div>

              <Card className="bg-primary border-none text-primary-foreground shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-8 space-y-6 relative z-10">
                  <div className="space-y-1">
                    <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-widest">Total Balance</p>
                    <p className="text-5xl font-black">KES 12,450</p>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-primary-foreground/70 text-xs">This Week</p>
                      <p className="font-bold">KES 3,200</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/70 text-xs">Trips</p>
                      <p className="font-bold">142</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Button className="w-full h-16 bg-foreground text-background hover:bg-foreground/90 text-lg font-bold rounded-2xl">
                  <CreditCard className="w-6 h-6 mr-3" /> Withdraw to M-Pesa
                </Button>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-bold px-1 text-foreground">Recent Activity</h3>
                  {[
                    { label: 'Trip #8492', date: 'Today, 2:45 PM', amount: '+ KES 450' },
                    { label: 'Trip #8491', date: 'Today, 1:12 PM', amount: '+ KES 320' },
                    { label: 'Withdrawal', date: 'Yesterday', amount: '- KES 2,000', color: 'text-primary' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border hover:bg-muted transition-colors cursor-pointer group">
                      <div>
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">{item.label}</p>
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
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-30">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        </div>
      </main>

      <footer className="p-6 text-center border-t border-border opacity-50 text-[10px] tracking-widest font-medium uppercase text-muted-foreground">
        © 2024 u-bike global • simple mobility
      </footer>
    </div>
  );
}
