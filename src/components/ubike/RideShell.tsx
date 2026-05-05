"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Logo } from './Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MapPin, Navigation, Zap, Bike, Star, ShieldAlert, MessageCircle, ArrowLeft, Loader2, User, Check, X } from 'lucide-react';
import { calculateFare, MOCK_RIDERS, MOCK_TRAFFIC, MOCK_REQUESTS, type RideType } from '@/lib/ride-service';
import { smartRiderMatcher, type SmartRiderMatcherOutput } from '@/ai/flows/smart-rider-matcher-flow';
import { analyzePostRideFeedback } from '@/ai/flows/post-ride-feedback-analyzer-flow';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

type FlowState = 'LANDING' | 'BOOKING_PANEL' | 'MATCHING' | 'RIDE_IN_PROGRESS' | 'POST_RIDE' | 'RIDER_DASHBOARD';

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
  const [rideRequests, setRideRequests] = useState(MOCK_REQUESTS);

  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-motorbike');
  const distance = pickup && destination ? 5.2 : 0;
  const estimatedFare = calculateFare(distance, rideType);

  const startBooking = () => {
    if (pickup && destination) setState('BOOKING_PANEL');
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
      setTimeout(() => setState('RIDE_IN_PROGRESS'), 3000);
    } catch (error) {
      console.error(error);
      setState('BOOKING_PANEL');
    }
  };

  const completeRide = () => setState('POST_RIDE');

  const submitFeedback = async () => {
    if (feedback) await analyzePostRideFeedback({ comment: feedback });
    setState('LANDING');
    setPickup('');
    setDestination('');
    setFeedback('');
    setRating(0);
  };

  const handleRequestAction = (id: string) => {
    setRideRequests(prev => prev.filter(req => req.id !== id));
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-white overflow-hidden">
      {/* Enhanced Hero Background Section */}
      {state === 'LANDING' && (
        <div className="absolute inset-0 z-0 bg-white overflow-hidden">
          <div className="relative w-full h-full scale-105 animate-breathing">
            <Image
              src={heroImage?.imageUrl || "https://picsum.photos/seed/spiro-premium-moto/1920/1080"}
              alt="Premium Electric Motorbike"
              fill
              className="object-cover opacity-30 blur-[4px]"
              priority
              data-ai-hint="electric motorbike"
            />
          </div>
          {/* Refined Layered White Gradients for Readability */}
          <div className="absolute inset-0 bg-white/20 z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white z-20" />
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto">
        <Logo className="h-10 cursor-pointer" onClick={() => setState('LANDING')} />
        <div className="flex items-center gap-8">
          <button className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Safety</button>
          <button className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Support</button>
          <Button 
            variant="ghost" 
            className="text-foreground/70 hover:text-primary"
            onClick={() => setState('RIDER_DASHBOARD')}
          >
            Driver Portal
          </Button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-30 flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl animate-fade-in space-y-12">
          
          {/* LANDING / HERO FORM */}
          {state === 'LANDING' && (
            <>
              <div className="space-y-12 text-center">
                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground lowercase">
                    u-bike
                  </h1>
                  <p className="text-foreground/60 text-lg font-medium tracking-wide">
                    Premium motorbike mobility for the city.
                  </p>
                </div>

                <Card className="glass-morphism border-none shadow-2xl rounded-3xl overflow-hidden">
                  <CardContent className="p-0">
                    <Tabs defaultValue="Normal" onValueChange={(v) => setRideType(v as RideType)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-16 bg-white/20 p-2 gap-2">
                        <TabsTrigger 
                          value="Normal" 
                          className="rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg h-full transition-all"
                        >
                          <Bike className="w-4 h-4 mr-2" />
                          Standard
                        </TabsTrigger>
                        <TabsTrigger 
                          value="Electric" 
                          className="rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg h-full transition-all"
                        >
                          <Zap className="w-4 h-4 mr-2 text-primary" />
                          Electric
                        </TabsTrigger>
                      </TabsList>
                      
                      <div className="p-8 space-y-6">
                        <div className="space-y-4">
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                            <Input 
                              placeholder="Where from?" 
                              className="pl-12 h-14 bg-white/50 border-white/40 rounded-2xl text-lg focus:bg-white transition-all shadow-sm" 
                              value={pickup}
                              onChange={(e) => setPickup(e.target.value)}
                            />
                          </div>
                          <div className="relative">
                            <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                            <Input 
                              placeholder="Where to?" 
                              className="pl-12 h-14 bg-white/50 border-white/40 rounded-2xl text-lg focus:bg-white transition-all shadow-sm"
                              value={destination}
                              onChange={(e) => setDestination(e.target.value)}
                            />
                          </div>
                        </div>

                        {pickup && destination && (
                          <div className="pt-2 text-left">
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1">Estimated Fare</p>
                            <p className="text-3xl font-bold text-primary">{estimatedFare}</p>
                          </div>
                        )}

                        <Button 
                          className="w-full h-16 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]"
                          onClick={startBooking}
                        >
                          Book Ride
                        </Button>
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              {/* Feature 1: Available Riders Preview */}
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-bold tracking-tight">Available Riders Near You</h3>
                  <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2 animate-pulse" />
                    LIVE
                  </Badge>
                </div>
                
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex w-max space-x-4 p-1 pb-4">
                    {MOCK_RIDERS.map((rider) => (
                      <Card key={rider.id} className="w-[200px] shrink-0 glass-morphism border-none shadow-lg rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-default">
                        <div className="relative h-24 w-full bg-muted">
                          <Image
                            src={rider.imageUrl || `https://picsum.photos/seed/${rider.id}/400/300`}
                            alt={rider.name}
                            fill
                            className="object-cover opacity-80"
                            data-ai-hint="motorbike"
                          />
                          <div className="absolute top-2 right-2">
                            {rider.bikeType === 'Electric' ? (
                              <Badge className="bg-white/90 text-primary border-none shadow-sm"><Zap className="w-3 h-3" /></Badge>
                            ) : (
                              <Badge className="bg-white/90 text-foreground/60 border-none shadow-sm"><Bike className="w-3 h-3" /></Badge>
                            )}
                          </div>
                        </div>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm truncate">{rider.name}</p>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                              <Star className="w-3 h-3 fill-primary" /> {rider.rating}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-foreground/40 font-medium uppercase tracking-wider">{rider.bikeType}</p>
                            <p className="text-[9px] font-bold text-green-500 uppercase">Available</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </>
          )}

          {state === 'BOOKING_PANEL' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" onClick={() => setState('LANDING')} className="rounded-full hover:bg-muted">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold">Trip Details</h2>
              </div>

              <Card className="glass-morphism rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Service</p>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                          {rideType === 'Electric' ? <Zap className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-bold text-xl">{rideType} Ride</p>
                          <p className="text-sm text-foreground/50">Premium Motorbike</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-3xl font-black text-primary">{estimatedFare}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <Label htmlFor="for-else" className="text-base font-semibold">Book for someone else</Label>
                      <Switch id="for-else" checked={forSomeoneElse} onCheckedChange={setForSomeoneElse} />
                    </div>

                    {forSomeoneElse && (
                      <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <Input placeholder="Passenger Name" className="h-14 bg-white/50 border-none rounded-2xl" value={passengerName} onChange={e => setPassengerName(e.target.value)} />
                        <Input placeholder="Phone Number" className="h-14 bg-white/50 border-none rounded-2xl" value={passengerPhone} onChange={e => setPassengerPhone(e.target.value)} />
                      </div>
                    )}
                  </div>

                  <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-bold text-xl rounded-2xl shadow-lg" onClick={findRider}>
                    Confirm & Pay
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {state === 'MATCHING' && (
            <div className="text-center space-y-8 py-12">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-40 w-40 animate-ping rounded-full bg-primary/5" />
                <div className="relative h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Finding your rider...</h2>
                <p className="text-foreground/50">Smart matching technology in progress.</p>
              </div>
            </div>
          )}

          {state === 'RIDE_IN_PROGRESS' && matchedRider && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-border/50 p-6 rounded-3xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-primary p-3 rounded-2xl text-white">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">On our way</p>
                    <p className="text-sm text-foreground/50">Arrival in 6 minutes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">KES 250</p>
                </div>
              </div>

              <Card className="glass-morphism border-none rounded-3xl overflow-hidden shadow-2xl">
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                        <User className="w-12 h-12 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-2xl">{matchedRider.riderName}</h3>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                            <Star className="w-4 h-4 fill-primary" /> {matchedRider.riderRating}
                          </span>
                          <span className="text-sm text-foreground/40 font-medium">Boxer 150 • {matchedRider.bikeType}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="icon" variant="outline" className="h-14 w-14 rounded-2xl border-border hover:bg-muted shadow-sm">
                      <MessageCircle className="w-6 h-6" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="ghost" className="h-14 rounded-2xl text-foreground/40 hover:text-destructive">
                      <ShieldAlert className="w-4 h-4 mr-2" /> SOS
                    </Button>
                    <Button className="h-14 bg-primary text-white font-bold rounded-2xl" onClick={completeRide}>
                      Arrived
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {state === 'POST_RIDE' && (
            <div className="text-center space-y-12">
              <div className="space-y-4">
                <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Star className="w-12 h-12 fill-primary" />
                </div>
                <h2 className="text-4xl font-bold">Rate your trip</h2>
                <p className="text-foreground/50">Help us maintain our premium service standards.</p>
              </div>

              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className={`transition-all duration-300 transform hover:scale-125 ${rating >= s ? 'text-primary' : 'text-foreground/10'}`}>
                    <Star className={`w-12 h-12 ${rating >= s ? 'fill-primary' : ''}`} />
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <textarea 
                  className="w-full bg-muted/30 border-none rounded-3xl p-6 min-h-[140px] focus:ring-2 focus:ring-primary/20 outline-none text-lg"
                  placeholder="Leave a comment (optional)..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <Button className="w-full h-16 bg-primary text-white font-bold text-xl rounded-2xl shadow-xl shadow-primary/20" onClick={submitFeedback}>
                  Submit Review
                </Button>
              </div>
            </div>
          )}

          {state === 'RIDER_DASHBOARD' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Rider Portal</h2>
                <Button variant="ghost" className="rounded-2xl" onClick={() => setState('LANDING')}>Exit</Button>
              </div>
              
              <Card className="bg-foreground text-white rounded-3xl p-10 shadow-2xl border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Bike className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-8">
                  <div>
                    <p className="text-white/50 text-xs font-black uppercase tracking-[0.2em] mb-2">Available Balance</p>
                    <p className="text-5xl font-black">KES 14,200</p>
                  </div>
                  <div className="flex gap-10">
                    <div>
                      <p className="text-white/40 text-xs font-bold mb-1">Weekly Trips</p>
                      <p className="text-2xl font-bold">42</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs font-bold mb-1">Avg Rating</p>
                      <p className="text-2xl font-bold">4.96</p>
                    </div>
                  </div>
                  <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl">Cash Out</Button>
                </div>
              </Card>

              {/* Feature 2: Nearby Ride Requests */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-bold tracking-tight">Nearby Ride Requests</h3>
                  <p className="text-xs font-medium text-foreground/40">{rideRequests.length} active requests</p>
                </div>
                
                <div className="space-y-4">
                  {rideRequests.length > 0 ? (
                    rideRequests.map((req) => (
                      <Card key={req.id} className="glass-morphism border-none shadow-lg rounded-3xl overflow-hidden animate-in slide-in-from-right duration-500">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-6">
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Pickup</p>
                                  <p className="font-bold text-lg">{req.pickup}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Navigation className="w-4 h-4 text-primary shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Destination</p>
                                  <p className="font-bold text-lg">{req.destination}</p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <Badge className="bg-primary/10 text-primary border-none font-bold uppercase text-[10px] tracking-widest">
                                {req.type}
                              </Badge>
                              <p className="text-2xl font-black text-primary">{req.price}</p>
                              <p className="text-xs font-bold text-foreground/30">{req.distance}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 pt-2">
                            <Button 
                              variant="outline" 
                              className="flex-1 h-14 rounded-2xl border-border hover:bg-destructive/5 hover:text-destructive transition-all"
                              onClick={() => handleRequestAction(req.id)}
                            >
                              <X className="w-4 h-4 mr-2" /> Decline
                            </Button>
                            <Button 
                              className="flex-1 h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                              onClick={() => handleRequestAction(req.id)}
                            >
                              <Check className="w-4 h-4 mr-2" /> Accept
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
                      <p className="text-foreground/30 font-bold uppercase tracking-widest">Searching for requests...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="relative z-50 p-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 pointer-events-none">
        u-bike global • premium mobility nairobi
      </footer>
    </div>
  );
}
