"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from './Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Navigation, Zap, Bike, Star, ShieldAlert, MessageCircle, ArrowLeft, Loader2, User, Check, X, CloudRain, Sun, CloudDrizzle, Package, LogIn, UserPlus, Car } from 'lucide-react';
import { calculateFare, calculateErrandFare, MOCK_RIDERS, MOCK_TRAFFIC, MOCK_REQUESTS, type RideType, type RiderServiceType } from '@/lib/ride-service';
import { smartRiderMatcher, type SmartRiderMatcherOutput } from '@/ai/flows/smart-rider-matcher-flow';
import { analyzePostRideFeedback } from '@/ai/flows/post-ride-feedback-analyzer-flow';
import { cn } from '@/lib/utils';

type FlowState = 'LANDING' | 'BOOKING_PANEL' | 'ERRANDS_PANEL' | 'MATCHING' | 'RIDE_IN_PROGRESS' | 'POST_RIDE' | 'RIDER_DASHBOARD' | 'RIDER_AUTH';
type Weather = 'SUNNY' | 'RAINY' | 'DRIZZLE';
type ServiceType = 'RIDES' | 'ERRANDS' | 'MINI_CARS';

export default function RideShell() {
  const [state, setState] = useState<FlowState>('LANDING');
  const [weather, setWeather] = useState<Weather>('SUNNY');
  const [selectedService, setSelectedService] = useState<ServiceType>('RIDES');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [rideType, setRideType] = useState<RideType>('Normal');
  const [errandSize, setErrandSize] = useState('Small');
  const [itemDescription, setItemDescription] = useState('');
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [matchedRider, setMatchedRider] = useState<SmartRiderMatcherOutput | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [rideRequests, setRideRequests] = useState(MOCK_REQUESTS);
  
  // Rider Auth State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [isRiderLoggedIn, setIsRiderLoggedIn] = useState(false);

  const distance = (pickup && destination) ? 5.2 : 0;
  const estimatedFare = selectedService === 'ERRANDS' 
    ? calculateErrandFare(distance, errandSize)
    : calculateFare(distance, rideType);

  const startBooking = () => {
    if (pickup && destination) {
      if (selectedService === 'ERRANDS') {
        setState('ERRANDS_PANEL');
      } else {
        setState('BOOKING_PANEL');
      }
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
      setTimeout(() => setState('RIDE_IN_PROGRESS'), 3000);
    } catch (error) {
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
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-transparent">
      {/* Weather Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {weather === 'RAINY' && (
          <>
            <div className="absolute inset-0 bg-black/5 z-0 transition-opacity duration-1000" />
            <div className="absolute inset-0 weather-rain z-10" />
          </>
        )}
        {weather === 'DRIZZLE' && (
          <div className="absolute inset-0 weather-drizzle z-10" />
        )}
        {weather === 'SUNNY' && (
          <div className="absolute inset-0 weather-sunny z-10" />
        )}
      </div>

      {/* Navigation */}
      <header className="relative z-50 w-full bg-white/40 backdrop-blur-xl border-b border-white/40 shadow-sm">
        <nav className="flex items-center justify-between px-6 md:px-12 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center">
            <Logo 
              className="h-9 md:h-10 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => { setState('LANDING'); setSelectedService('RIDES'); }} 
            />
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden lg:flex items-center gap-8">
              <button 
                onClick={() => { setState('LANDING'); setSelectedService('RIDES'); }}
                className={cn("text-xs font-black uppercase tracking-widest transition-colors", selectedService === 'RIDES' && state === 'LANDING' ? "text-primary" : "text-foreground/40 hover:text-primary")}
              >
                Rides
              </button>
              <button 
                onClick={() => { setState('LANDING'); setSelectedService('ERRANDS'); }}
                className={cn("text-xs font-black uppercase tracking-widest transition-colors", selectedService === 'ERRANDS' || state === 'ERRANDS_PANEL' ? "text-primary" : "text-foreground/40 hover:text-primary")}
              >
                Errands
              </button>
            </div>

            {/* Weather Widget */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 shadow-sm border border-border/40">
              {weather === 'SUNNY' && <Sun className="w-4 h-4 text-orange-400" />}
              {weather === 'RAINY' && <CloudRain className="w-4 h-4 text-blue-400" />}
              {weather === 'DRIZZLE' && <CloudDrizzle className="w-4 h-4 text-blue-300" />}
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/60">{weather}</span>
            </div>

            <Button 
              variant="outline"
              size="sm"
              className="rounded-full border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-bold px-4 h-9"
              onClick={() => isRiderLoggedIn ? setState('RIDER_DASHBOARD') : setState('RIDER_AUTH')}
            >
              {isRiderLoggedIn ? 'Dashboard' : 'Driver Portal'}
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="relative z-30 flex-1 flex flex-col items-center justify-center p-6 pb-20">
        <div className="w-full max-w-xl animate-fade-in space-y-12">
          
          {/* LANDING / HERO */}
          {state === 'LANDING' && (
            <>
              <div className="space-y-10 text-center">
                <div className="space-y-6 flex flex-col items-center">
                  <h1 className="text-4xl md:text-6xl font-black tracking-widest text-foreground uppercase font-headline">
                    u-bike
                  </h1>

                  {/* WEATHER ICONS BETWEEN TEXTS */}
                  <div className="flex items-center gap-8 py-4 opacity-40">
                    <Sun className={cn("w-8 h-8 transition-all duration-700", weather === 'SUNNY' ? "text-orange-400 scale-125 opacity-100" : "text-foreground/20")} />
                    <CloudDrizzle className={cn("w-8 h-8 transition-all duration-700", weather === 'DRIZZLE' ? "text-blue-300 scale-125 opacity-100" : "text-foreground/20")} />
                    <CloudRain className={cn("w-8 h-8 transition-all duration-700", weather === 'RAINY' ? "text-blue-500 scale-125 opacity-100" : "text-foreground/20")} />
                  </div>

                  <p className="text-foreground/60 text-lg font-medium tracking-wide max-w-md">
                    premium motorbike mobility for Meru and rest of Kenya
                  </p>
                </div>

                {/* Service Selection Component */}
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setSelectedService('RIDES')}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-[2rem] transition-all duration-300 gap-2 border",
                      selectedService === 'RIDES' 
                        ? "bg-white shadow-xl border-white scale-105" 
                        : "bg-white/40 border-white/20 hover:bg-white/60"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl", selectedService === 'RIDES' ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
                      <Bike className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Rides</span>
                  </button>

                  <button 
                    onClick={() => setSelectedService('ERRANDS')}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-[2rem] transition-all duration-300 gap-2 border",
                      selectedService === 'ERRANDS' 
                        ? "bg-white shadow-xl border-white scale-105" 
                        : "bg-white/40 border-white/20 hover:bg-white/60"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl", selectedService === 'ERRANDS' ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Errands</span>
                  </button>

                  <div 
                    className="relative flex flex-col items-center justify-center p-4 rounded-[2rem] transition-all duration-300 gap-2 border bg-white/20 border-white/10 opacity-60 cursor-not-allowed group"
                  >
                    <div className="p-2 rounded-xl bg-foreground/5 text-foreground/40">
                      <Car className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Mini Cars</span>
                    <Badge variant="outline" className="absolute -top-2 px-2 py-0 h-4 text-[7px] font-black border-primary/20 text-primary bg-white/80">SOON</Badge>
                  </div>
                </div>

                <Card className="glass-morphism border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-0">
                    {selectedService === 'RIDES' ? (
                      <Tabs defaultValue="Normal" onValueChange={(v) => setRideType(v as RideType)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-16 bg-muted/30 p-2 gap-2">
                          <TabsTrigger value="Normal" className="rounded-[1.8rem] data-[state=active]:bg-white h-full transition-all">
                            <Bike className="w-4 h-4 mr-2" />
                            Standard
                          </TabsTrigger>
                          <TabsTrigger value="Electric" className="rounded-[1.8rem] data-[state=active]:bg-white h-full transition-all">
                            <Zap className="w-4 h-4 mr-2 text-primary" />
                            Electric
                          </TabsTrigger>
                        </TabsList>
                        
                        <div className="p-8 space-y-6">
                          <div className="space-y-4">
                            <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                              <Input placeholder="Where from?" className="pl-12 h-14 bg-white/90 border-none rounded-2xl text-lg shadow-sm" value={pickup} onChange={(e) => setPickup(e.target.value)} />
                            </div>
                            <div className="relative">
                              <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                              <Input placeholder="Where to?" className="pl-12 h-14 bg-white/90 border-none rounded-2xl text-lg shadow-sm" value={destination} onChange={(e) => setDestination(e.target.value)} />
                            </div>
                          </div>

                          {pickup && destination && (
                            <div className="pt-2 text-left">
                              <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1">Estimated Fare</p>
                              <p className="text-3xl font-bold text-primary">{estimatedFare}</p>
                            </div>
                          )}

                          <Button className="w-full h-16 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20" onClick={startBooking}>
                            Book Ride
                          </Button>
                        </div>
                      </Tabs>
                    ) : (
                      <div className="p-8 space-y-6">
                        <div className="space-y-4">
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                            <Input placeholder="Pickup Location" className="pl-12 h-14 bg-white/90 border-none rounded-2xl text-lg shadow-sm" value={pickup} onChange={(e) => setPickup(e.target.value)} />
                          </div>
                          <div className="relative">
                            <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                            <Input placeholder="Delivery Location" className="pl-12 h-14 bg-white/90 border-none rounded-2xl text-lg shadow-sm" value={destination} onChange={(e) => setDestination(e.target.value)} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-2">Item Size</Label>
                          <Select value={errandSize} onValueChange={setErrandSize}>
                            <SelectTrigger className="h-14 bg-white/90 border-none rounded-2xl shadow-sm">
                              <SelectValue placeholder="Select Size" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-xl">
                              <SelectItem value="Small">Small (Envelope, Phone)</SelectItem>
                              <SelectItem value="Medium">Medium (Shoebox, Small Bag)</SelectItem>
                              <SelectItem value="Large">Large (Box, Grocery Bag)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {pickup && destination && (
                          <div className="pt-2 text-left">
                            <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1">Estimated Errand Fare</p>
                            <p className="text-3xl font-bold text-primary">{estimatedFare}</p>
                          </div>
                        )}

                        <Button className="w-full h-16 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20" onClick={startBooking}>
                          Request Errand
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Available Riders Preview */}
              <div className="space-y-6">
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
                      <Card key={rider.id} className="w-[220px] shrink-0 glass-morphism border-none shadow-lg rounded-3xl overflow-hidden hover:scale-105 transition-all cursor-default">
                        <div className="relative h-28 w-full bg-muted">
                          <Image src={rider.imageUrl} alt={rider.name} fill className="object-cover opacity-80" data-ai-hint="motorbike" />
                          <div className="absolute top-2 right-2">
                            {rider.bikeType === 'Electric' ? <Badge className="bg-white/90 text-primary border-none"><Zap className="w-3 h-3" /></Badge> : <Badge className="bg-white/90 text-foreground/60 border-none"><Bike className="w-3 h-3" /></Badge>}
                          </div>
                        </div>
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-sm">{rider.name}</p>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                              <Star className="w-3 h-3 fill-primary" /> {rider.rating}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">{rider.bikeType}</p>
                            <Badge variant="secondary" className="text-[8px] h-4 bg-green-500/10 text-green-600 border-none">Available</Badge>
                          </div>
                          <div className="flex gap-1">
                            {rider.services === 'Both' || rider.services === 'PassengerRides' ? <User className="w-3 h-3 text-foreground/30" /> : null}
                            {rider.services === 'Both' || rider.services === 'Errands' ? <Package className="w-3 h-3 text-foreground/30" /> : null}
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

          {/* ERRANDS PANEL */}
          {state === 'ERRANDS_PANEL' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" onClick={() => setState('LANDING')} className="rounded-full hover:bg-muted">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold">Send a Rider for Errands</h2>
              </div>

              <Card className="glass-morphism rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <Input placeholder="Pickup Location" className="pl-12 h-14 bg-white/50 border-none rounded-2xl" value={pickup} onChange={e => setPickup(e.target.value)} />
                    </div>
                    <div className="relative">
                      <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <Input placeholder="Delivery Location" className="pl-12 h-14 bg-white/50 border-none rounded-2xl" value={destination} onChange={e => setDestination(e.target.value)} />
                    </div>
                    <Input placeholder="What are we picking up? (e.g. Documents, Groceries)" className="h-14 bg-white/50 border-none rounded-2xl" value={itemDescription} onChange={e => setItemDescription(e.target.value)} />
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-foreground/40 px-2">Item Size</Label>
                      <Select value={errandSize} onValueChange={setErrandSize}>
                        <SelectTrigger className="h-14 bg-white/50 border-none rounded-2xl">
                          <SelectValue placeholder="Select Size" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          <SelectItem value="Small">Small (Envelope, Phone)</SelectItem>
                          <SelectItem value="Medium">Medium (Shoebox, Small Bag)</SelectItem>
                          <SelectItem value="Large">Large (Box, Grocery Bag)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {pickup && destination && (
                    <div className="pt-2">
                      <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-1">Estimated Price</p>
                      <p className="text-3xl font-bold text-primary">{estimatedFare}</p>
                    </div>
                  )}

                  <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-bold text-xl rounded-2xl shadow-lg" onClick={findRider}>
                    Request Errand
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* RIDER AUTH */}
          {state === 'RIDER_AUTH' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" onClick={() => setState('LANDING')} className="rounded-full hover:bg-muted">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold">{authMode === 'LOGIN' ? 'Rider Login' : 'Rider Sign Up'}</h2>
              </div>

              <Card className="glass-morphism rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-5">
                    {authMode === 'SIGNUP' && (
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20" />
                        <Input placeholder="Full Name" className="pl-12 h-14 bg-white/50 border-none rounded-2xl" />
                      </div>
                    )}
                    <div className="relative">
                      <LogIn className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20" />
                      <Input placeholder="Phone Number" className="pl-12 h-14 bg-white/50 border-none rounded-2xl" />
                    </div>
                    {authMode === 'SIGNUP' && (
                      <div className="relative">
                        <Bike className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20" />
                        <Input placeholder="Bike Details (Model, Plate)" className="pl-12 h-14 bg-white/50 border-none rounded-2xl" />
                      </div>
                    )}
                    <Input type="password" placeholder="Password" className="h-14 bg-white/50 border-none rounded-2xl px-6" />
                  </div>

                  <Button 
                    className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-bold text-xl rounded-2xl shadow-lg"
                    onClick={() => { setIsRiderLoggedIn(true); setState('RIDER_DASHBOARD'); }}
                  >
                    {authMode === 'LOGIN' ? 'Login' : 'Join as Rider'}
                  </Button>

                  <div className="text-center">
                    <button 
                      className="text-sm font-bold text-primary hover:underline"
                      onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                    >
                      {authMode === 'LOGIN' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                  <p className="text-2xl font-black text-primary">{selectedService === 'ERRANDS' ? estimatedFare : 'KES 250'}</p>
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
                    <Button size="icon" variant="outline" className="h-14 w-14 rounded-2xl border-border shadow-sm">
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
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-2xl border-primary/20 text-primary" onClick={() => setIsRiderLoggedIn(false)}>Logout</Button>
                  <Button variant="ghost" className="rounded-2xl" onClick={() => setState('LANDING')}>Exit</Button>
                </div>
              </div>
              
              <Card className="bg-[#2E2B26] text-white rounded-[2.5rem] p-10 shadow-2xl border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                  <Bike className="w-32 h-32" />
                </div>
                <div className="relative z-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white/50 text-xs font-black uppercase tracking-[0.2em] mb-2">Available Balance</p>
                      <p className="text-5xl font-black">KES 14,200</p>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-none font-bold py-1.5 px-4 rounded-full">ACTIVE</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6 pt-4">
                    <div>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Weekly Trips</p>
                      <p className="text-2xl font-bold">42</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Avg Rating</p>
                      <p className="text-2xl font-bold flex items-center gap-1"><Star className="w-4 h-4 fill-primary text-primary" /> 4.96</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Level</p>
                      <p className="text-2xl font-bold">Gold</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">Errand Services</span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl">Withdraw to M-Pesa</Button>
                </div>
              </Card>

              {/* Nearby Ride Requests */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-bold tracking-tight">Nearby Ride Requests</h3>
                  <Badge variant="secondary" className="bg-muted text-foreground/40 border-none px-3">{rideRequests.length} active</Badge>
                </div>
                
                <div className="space-y-4">
                  {rideRequests.length > 0 ? (
                    rideRequests.map((req) => (
                      <Card key={req.id} className="glass-morphism border-none shadow-lg rounded-[2rem] overflow-hidden">
                        <CardContent className="p-8">
                          <div className="flex justify-between items-start mb-8">
                            <div className="space-y-5 flex-1">
                              <div className="flex items-start gap-4">
                                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Pickup</p>
                                  <p className="font-bold text-lg leading-tight">{req.pickup}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-4">
                                <Navigation className="w-4 h-4 text-primary shrink-0 mt-1" />
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-1">Destination</p>
                                  <p className="font-bold text-lg leading-tight">{req.destination}</p>
                                </div>
                              </div>
                              {req.category === 'Errand' && (
                                <div className="flex items-center gap-2 bg-primary/5 p-3 rounded-xl border border-primary/5">
                                  <Package className="w-4 h-4 text-primary" />
                                  <p className="text-xs font-medium">{req.description}</p>
                                </div>
                              )}
                            </div>
                            <div className="text-right space-y-3">
                              <Badge className="bg-primary/10 text-primary border-none font-black uppercase text-[9px] tracking-[0.2em] px-3">
                                {req.category === 'Errand' ? 'ERRAND' : 'PASSENGER'}
                              </Badge>
                              <p className="text-3xl font-black text-primary">{req.price}</p>
                              <p className="text-xs font-bold text-foreground/30">{req.distance}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-4 pt-2">
                            <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold text-foreground/40 hover:text-destructive transition-all" onClick={() => handleRequestAction(req.id)}>
                              Decline
                            </Button>
                            <Button className="flex-1 h-14 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all" onClick={() => handleRequestAction(req.id)}>
                              Accept Request
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border/30">
                      <p className="text-foreground/20 font-black uppercase tracking-[0.4em] text-xs">Waiting for incoming requests</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="relative z-50 p-8 flex flex-col items-center gap-6">
        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground/10 pointer-events-none text-center">
          u-bike global • premium mobility nairobi
        </div>
      </footer>
    </div>
  );
}
