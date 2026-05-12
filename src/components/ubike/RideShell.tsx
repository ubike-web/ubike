"use client";

import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, Navigation, Zap, Bike, Star, ShieldAlert, MessageCircle, 
  ArrowLeft, Loader2, User, Check, X, CloudRain, Sun, CloudDrizzle, 
  Package, LogIn, ExternalLink, Map as MapIcon, Plus, ArrowUpRight, 
  History, TrendingUp, PieChart, CreditCard, ArrowLeftRight, Settings,
  DollarSign, Clock, BarChart3, ChevronRight
} from 'lucide-react';
import { calculateFare, calculateErrandFare, MOCK_RIDERS, MOCK_TRAFFIC, MOCK_REQUESTS, getGoogleMapsUrl, type RideType, type RiderServiceType } from '@/lib/ride-service';
import { smartRiderMatcher, type SmartRiderMatcherOutput } from '@/ai/flows/smart-rider-matcher-flow';
import { analyzePostRideFeedback } from '@/ai/flows/post-ride-feedback-analyzer-flow';
import { cn } from '@/lib/utils';

type FlowState = 'LANDING' | 'BOOKING_PANEL' | 'ERRANDS_PANEL' | 'MATCHING' | 'RIDE_IN_PROGRESS' | 'POST_RIDE' | 'RIDER_DASHBOARD' | 'RIDER_AUTH' | 'RIDER_WALLET' | 'RIDER_ANALYTICS';
type Weather = 'SUNNY' | 'RAINY' | 'DRIZZLE';
type ServiceType = 'RIDES' | 'ERRANDS';

/**
 * Premium Dark Map Component for Route Preview and Tracking
 */
function MapCard({ pickup, destination, isTracking = false }: { pickup: string; destination: string; isTracking?: boolean }) {
  return (
    <div className="relative w-full h-48 md:h-64 bg-[#0F172A] rounded-[3.5rem] overflow-hidden shadow-inner group">
      {/* Abstract Map Grid */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      {/* Route Path (Animated SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none px-12 py-12">
        <path
          d="M 50 150 Q 150 50 350 100"
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          className={cn("transition-all duration-1000", isTracking ? "animate-[dash_3s_linear_infinite]" : "opacity-60")}
          style={{ strokeDasharray: '10, 5' }}
        />
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
        </defs>
      </svg>

      {/* Pins */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="bg-primary p-1.5 rounded-full shadow-lg shadow-primary/40 ring-4 ring-primary/20 animate-bounce">
          <MapPin className="w-3 h-3 text-white" />
        </div>
        <Badge variant="outline" className="mt-1 bg-white/90 border-none text-[8px] font-black uppercase">{pickup || 'Pickup'}</Badge>
      </div>

      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 flex flex-col items-center">
        <div className="bg-white p-1.5 rounded-full shadow-lg shadow-white/40 ring-4 ring-white/10">
          <Navigation className="w-3 h-3 text-[#0F172A]" />
        </div>
        <Badge variant="outline" className="mt-1 bg-white/90 border-none text-[8px] font-black uppercase">{destination || 'Destination'}</Badge>
      </div>

      {isTracking && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-pulse">
          <div className="bg-primary/20 p-4 rounded-full border border-primary/40">
            <Bike className="w-5 h-5 text-primary" />
          </div>
        </div>
      )}

      {/* Map Labels/Overlay */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <Badge className="bg-white/10 text-white/40 border-none text-[7px] font-black tracking-widest uppercase">Premium Map Engine</Badge>
        {isTracking && <Badge className="bg-green-500/20 text-green-400 border-none text-[7px] font-black tracking-widest uppercase animate-pulse">Live Tracking</Badge>}
      </div>
    </div>
  );
}

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
  
  // Rider Wallet State
  const [riderBalance, setRiderBalance] = useState(7584.00);
  const [weeklyGrowth, setWeeklyGrowth] = useState(4.34);

  // Rider Auth State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [isRiderLoggedIn, setIsRiderLoggedIn] = useState(false);

  const distanceValue = (pickup && destination) ? 5.2 : 0;
  const estimatedFare = selectedService === 'ERRANDS' 
    ? calculateErrandFare(distanceValue, errandSize)
    : calculateFare(distanceValue, rideType);

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

  const openInGoogleMaps = (location: string) => {
    window.open(getGoogleMapsUrl(location), '_blank');
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-transparent">
      {/* Weather Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {weather === 'RAINY' && <div className="absolute inset-0 weather-rain z-10" />}
        {weather === 'DRIZZLE' && <div className="absolute inset-0 weather-drizzle z-10" />}
        {weather === 'SUNNY' && <div className="absolute inset-0 weather-sunny z-10" />}
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

            <Button 
              variant="outline"
              size="sm"
              className="rounded-full border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-bold px-4 h-9"
              onClick={() => isRiderLoggedIn ? setState('RIDER_DASHBOARD') : setState('RIDER_AUTH')}
            >
              {isRiderLoggedIn ? 'Dashboard' : 'Rider Portal'}
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
                  <h1 className="text-4xl md:text-6xl font-black tracking-widest text-foreground uppercase">
                    u-bike
                  </h1>
                  <p className="text-foreground/60 text-lg font-medium tracking-wide max-w-md">
                    premium urban mobility with smart location tracking
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setSelectedService('RIDES')}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-[3.5rem] transition-all duration-300 gap-2 border",
                      selectedService === 'RIDES' 
                        ? "bg-white shadow-xl border-white scale-105" 
                        : "bg-white/40 border-white/20 hover:bg-white/60"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl", selectedService === 'RIDES' ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
                      <Bike className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Book Ride</span>
                  </button>

                  <button 
                    onClick={() => setSelectedService('ERRANDS')}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-[3.5rem] transition-all duration-300 gap-2 border",
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
                </div>

                <Card className="glass-morphism border-none shadow-2xl rounded-[3.5rem] overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-8 space-y-6">
                      <div className="space-y-4">
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                          <Input placeholder="Pickup Location" className="pl-12 h-14 bg-white/90 border-none rounded-2xl text-lg shadow-sm" value={pickup} onChange={(e) => setPickup(e.target.value)} />
                        </div>
                        <div className="relative">
                          <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                          <Input placeholder="Where to?" className="pl-12 h-14 bg-white/90 border-none rounded-2xl text-lg shadow-sm" value={destination} onChange={(e) => setDestination(e.target.value)} />
                        </div>
                      </div>

                      {pickup && destination && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                          <MapCard pickup={pickup} destination={destination} />
                          <div className="pt-2 text-left flex justify-between items-end">
                            <div>
                              <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mb-1">Estimated Fare</p>
                              <p className="text-3xl font-bold text-primary">{estimatedFare}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Distance</p>
                              <p className="text-sm font-bold">{distanceValue} KM</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button className="w-full h-16 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20" onClick={startBooking}>
                        Review Booking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* BOOKING PANEL */}
          {state === 'BOOKING_PANEL' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" onClick={() => setState('LANDING')} className="rounded-full hover:bg-muted">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold">Confirm Your Ride</h2>
              </div>

              <Card className="glass-morphism rounded-[3.5rem] overflow-hidden shadow-2xl">
                <CardContent className="p-8 space-y-8">
                  <MapCard pickup={pickup} destination={destination} />
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                          {rideType === 'Electric' ? <Zap className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{rideType} Ride</p>
                          <p className="text-xs text-foreground/40 uppercase tracking-widest font-black">{distanceValue} KM • 12 MIN</p>
                        </div>
                      </div>
                      <p className="text-3xl font-black text-primary">{estimatedFare}</p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/20">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="for-else" className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Book for someone else</Label>
                        <Switch id="for-else" checked={forSomeoneElse} onCheckedChange={setForSomeoneElse} />
                      </div>
                      {forSomeoneElse && (
                        <div className="space-y-3 animate-in slide-in-from-top-4">
                          <Input placeholder="Passenger Name" className="h-12 bg-white/50 border-none rounded-xl" value={passengerName} onChange={e => setPassengerName(e.target.value)} />
                          <Input placeholder="Phone Number" className="h-12 bg-white/50 border-none rounded-xl" value={passengerPhone} onChange={e => setPassengerPhone(e.target.value)} />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-bold text-xl rounded-2xl shadow-lg shadow-primary/20" onClick={findRider}>
                    Confirm & Request
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* RIDER DASHBOARD */}
          {state === 'RIDER_DASHBOARD' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Rider Console</h2>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-full border-primary/20 text-primary font-bold" onClick={() => setIsRiderLoggedIn(false)}>Logout</Button>
                  <Button variant="ghost" className="rounded-full" onClick={() => setState('LANDING')}>Exit</Button>
                </div>
              </div>

              {/* Wallet Summary Card */}
              <Card 
                className="bg-gradient-to-br from-[#8E2DE2] via-[#4A00E0] to-[#FF0080] border-none text-white rounded-[3.5rem] shadow-2xl p-8 cursor-pointer transform transition-transform hover:scale-[1.02]"
                onClick={() => setState('RIDER_WALLET')}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <p className="text-white/60 text-xs font-black uppercase tracking-widest">Current Balance</p>
                    <h3 className="text-4xl font-black tracking-tight">KES {riderBalance.toLocaleString()}</h3>
                  </div>
                  <Badge className="bg-white/20 text-white border-none font-bold">+ {weeklyGrowth}%</Badge>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <div className="bg-white/20 p-2 rounded-full">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white/80">View detailed performance insights</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </div>
              </Card>

              <div className="space-y-6">
                <h3 className="text-xl font-bold tracking-tight px-2">Active Opportunities</h3>
                <div className="space-y-4">
                  {rideRequests.map((req) => (
                    <Card key={req.id} className="glass-morphism border-none shadow-lg rounded-[3.5rem] overflow-hidden">
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div className="space-y-4 flex-1">
                            <div className="flex items-start gap-4">
                              <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-0.5">Pickup Location</p>
                                <p className="font-bold text-lg">{req.pickup}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4">
                              <Navigation className="w-4 h-4 text-primary shrink-0 mt-1" />
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-0.5">Final Destination</p>
                                <p className="font-bold text-lg">{req.destination}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] tracking-widest">{req.category}</Badge>
                            <p className="text-3xl font-black text-primary">{req.price}</p>
                            <p className="text-[10px] font-bold text-foreground/30">{req.distance}</p>
                          </div>
                        </div>

                        <div className="bg-muted/30 rounded-[2.5rem] mb-6 overflow-hidden">
                          <MapCard pickup={req.pickup} destination={req.destination} />
                        </div>
                        
                        <div className="flex gap-3">
                          <Button 
                            variant="outline" 
                            className="flex-1 h-14 rounded-full font-bold border-primary/20 text-primary" 
                            onClick={() => openInGoogleMaps(req.pickup)}
                          >
                            <MapIcon className="w-4 h-4 mr-2" /> Navigate
                          </Button>
                          <Button className="flex-1 h-14 bg-primary text-white font-bold rounded-full shadow-lg" onClick={() => handleRequestAction(req.id)}>
                            Accept Ride
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RIDER WALLET VIEW - MATCHING THE INSPIRATION IMAGE */}
          {state === 'RIDER_WALLET' && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setState('RIDER_DASHBOARD')} className="rounded-full">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-orange-400 p-0.5">
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <p className="font-bold">Hello, Samuel</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/20 backdrop-blur-md">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>

              {/* Main Wallet Card */}
              <div className="bg-gradient-to-br from-[#8E2DE2] via-[#4A00E0] to-[#FF0080] p-10 rounded-[4rem] text-white shadow-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="space-y-2 relative z-10">
                  <p className="text-white/70 font-black uppercase tracking-[0.2em] text-[10px]">Wallet (KES)</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-6xl font-black tracking-tighter">${riderBalance.toLocaleString()}</h2>
                    <Badge className="bg-green-400 text-green-900 border-none font-black text-xs px-2">+ {weeklyGrowth}%</Badge>
                  </div>
                </div>

                {/* Quick Action Buttons - Frosted Glass Style */}
                <div className="grid grid-cols-4 gap-4 mt-12">
                  {[
                    { icon: Plus, label: 'Add' },
                    { icon: ArrowUpRight, label: 'Withdraw' },
                    { icon: History, label: 'History' },
                    { icon: BarChart3, label: 'Stats' }
                  ].map((action, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <button className="h-14 w-14 rounded-3xl bg-white/15 backdrop-blur-xl flex items-center justify-center border border-white/20 transition-all hover:bg-white/30 hover:scale-110 active:scale-95">
                        <action.icon className="w-6 h-6 text-white" />
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{action.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black uppercase tracking-widest">Performance</h3>
                  <button className="text-xs font-bold text-primary hover:underline" onClick={() => setState('RIDER_ANALYTICS')}>View All</button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { icon: Bike, label: 'Passenger Rides', amount: 5240.00, growth: '+5.24%', color: 'bg-orange-500' },
                    { icon: Package, label: 'Errands Completed', amount: 2344.00, growth: '+1.34%', color: 'bg-indigo-500' },
                    { icon: CreditCard, label: 'Platform Commission', amount: -758.00, growth: '-2.10%', color: 'bg-pink-500' }
                  ].map((item, i) => (
                    <Card key={i} className="bg-white/60 backdrop-blur-xl border-none rounded-[2.5rem] p-6 shadow-sm flex items-center justify-between group cursor-pointer hover:bg-white transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg", item.color)}>
                          <item.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.label}</p>
                          <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{item.amount > 0 ? 'Monthly Gain' : 'Monthly Fee'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg">KES {Math.abs(item.amount).toLocaleString()}</p>
                        <p className={cn("text-[10px] font-bold", item.growth.startsWith('+') ? 'text-green-500' : 'text-red-500')}>{item.growth}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Bottom Nav Simulation */}
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
                <div className="bg-[#0B0E11] rounded-full h-20 flex items-center justify-between px-10 shadow-3xl border border-white/5 relative">
                  <button className="text-white/40"><MapIcon className="w-6 h-6" /></button>
                  <button className="text-white/40"><History className="w-6 h-6" /></button>
                  <button className="h-14 w-14 bg-gradient-to-tr from-[#8E2DE2] to-[#FF0080] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(142,45,226,0.5)] transform -translate-y-2 border-4 border-[#0B0E11]">
                    <ArrowLeftRight className="w-6 h-6 text-white" />
                  </button>
                  <button className="text-primary"><CreditCard className="w-6 h-6" /></button>
                  <button className="text-white/40"><Settings className="w-6 h-6" /></button>
                </div>
              </div>
            </div>
          )}

          {/* RIDER ANALYTICS - CHART VIEW INSPIRED BY IMAGE */}
          {state === 'RIDER_ANALYTICS' && (
            <div className="space-y-8 animate-in slide-in-from-right-12 duration-500 pb-32">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setState('RIDER_WALLET')} className="rounded-full">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h3 className="text-xl font-black uppercase tracking-widest text-center">Earnings Chart</h3>
                <Button variant="ghost" size="icon" className="rounded-full"><Settings className="w-5 h-5" /></Button>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Current Weekly Total</p>
                <div className="flex items-center justify-center gap-3">
                  <h2 className="text-5xl font-black tracking-tight">$353.29</h2>
                  <Badge className="bg-green-400 text-green-900 border-none font-bold">+4.34%</Badge>
                </div>
              </div>

              {/* Simulated Chart Container */}
              <div className="bg-[#0B0E11] rounded-[3.5rem] p-8 space-y-8 text-white shadow-2xl min-h-[400px] flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-widest">
                  <span>1H</span>
                  <span>2H</span>
                  <span>8H</span>
                  <span className="text-primary bg-primary/10 px-2 py-1 rounded-lg">1D</span>
                  <span>1W</span>
                  <span>1M</span>
                  <span>1Y</span>
                </div>

                {/* Abstract Bar Graph Simulation */}
                <div className="flex items-end justify-between h-48 gap-1 px-2">
                  {[40, 70, 45, 90, 65, 80, 50, 60, 85, 45, 75, 55].map((h, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 rounded-full transition-all duration-700", 
                        i === 3 ? "bg-primary shadow-[0_0_15px_rgba(249,115,22,0.5)] h-[90%]" : "bg-white/10"
                      )} 
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-xs font-bold text-white/40">Opening Balance</span>
                    <span className="font-mono font-bold">$342.56</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-xs font-bold text-white/40">Closing Balance</span>
                    <span className="font-mono font-bold">$356.13</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white/40">Weekly Range</span>
                    <span className="font-mono font-bold">$145.35 - $360.25</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button className="h-16 rounded-[2.5rem] bg-white/10 hover:bg-white/20 text-white font-bold text-lg border-none shadow-xl">
                  Transfer
                </Button>
                <Button className="h-16 rounded-[2.5rem] bg-gradient-to-r from-[#8E2DE2] to-[#FF0080] hover:opacity-90 text-white font-bold text-lg border-none shadow-2xl">
                  Withdraw
                </Button>
              </div>
            </div>
          )}

          {/* RIDER AUTH */}
          {state === 'RIDER_AUTH' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" onClick={() => setState('LANDING')} className="rounded-full hover:bg-muted">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold">{authMode === 'LOGIN' ? 'Rider Login' : 'Join the Fleet'}</h2>
              </div>

              <Card className="glass-morphism rounded-[3.5rem] overflow-hidden border-none shadow-2xl">
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-5">
                    {authMode === 'SIGNUP' && (
                      <Input placeholder="Full Name" className="h-14 bg-white/50 border-none rounded-2xl px-6" />
                    )}
                    <Input placeholder="Phone Number" className="h-14 bg-white/50 border-none rounded-2xl px-6" />
                    <Input type="password" placeholder="Password" className="h-14 bg-white/50 border-none rounded-2xl px-6" />
                  </div>

                  <Button 
                    className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-bold text-xl rounded-2xl shadow-lg"
                    onClick={() => { setIsRiderLoggedIn(true); setState('RIDER_DASHBOARD'); }}
                  >
                    {authMode === 'LOGIN' ? 'Login' : 'Apply Now'}
                  </Button>

                  <div className="text-center">
                    <button 
                      className="text-sm font-bold text-primary hover:underline"
                      onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                    >
                      {authMode === 'LOGIN' ? "New here? Join our fleet" : "Already registered? Login"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* MATCHING */}
          {state === 'MATCHING' && (
            <div className="text-center space-y-8 py-12">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-40 w-40 animate-ping rounded-full bg-primary/5" />
                <div className="relative h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Scanning for premium riders...</h2>
                <p className="text-foreground/50">Smart matching engine finding the best route.</p>
              </div>
              <div className="px-6">
                <MapCard pickup={pickup} destination={destination} isTracking={true} />
              </div>
            </div>
          )}

          {/* RIDE IN PROGRESS */}
          {state === 'RIDE_IN_PROGRESS' && matchedRider && (
            <div className="space-y-6">
              <div className="bg-white border border-border/50 p-6 rounded-3xl shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-primary p-3 rounded-2xl text-white">
                    <MapIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">En Route</p>
                    <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Arriving in {matchedRider.estimatedPickupTime}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => openInGoogleMaps(pickup)}>
                  <ExternalLink className="w-5 h-5 text-primary" />
                </Button>
              </div>

              <MapCard pickup={pickup} destination={destination} isTracking={true} />

              <Card className="glass-morphism border-none rounded-[3.5rem] overflow-hidden shadow-2xl">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
                        <User className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">{matchedRider.riderName}</h3>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-primary" /> {matchedRider.riderRating}
                          </span>
                          <span className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">{matchedRider.bikeType}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl border-border">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="ghost" className="h-14 rounded-2xl text-foreground/40 font-bold hover:text-destructive">
                      <ShieldAlert className="w-4 h-4 mr-2" /> SOS
                    </Button>
                    <Button className="h-14 bg-primary text-white font-bold rounded-2xl shadow-lg" onClick={completeRide}>
                      I Have Arrived
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* POST RIDE FEEDBACK */}
          {state === 'POST_RIDE' && (
            <div className="text-center space-y-12">
              <div className="space-y-4">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <Star className="w-10 h-10 fill-primary" />
                </div>
                <h2 className="text-4xl font-bold">Rate Your Experience</h2>
                <p className="text-foreground/50">Your feedback helps maintain u-bike premium standards.</p>
              </div>

              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className={`transition-all duration-300 transform hover:scale-110 ${rating >= s ? 'text-primary' : 'text-foreground/10'}`}>
                    <Star className={`w-12 h-12 ${rating >= s ? 'fill-primary' : ''}`} />
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <textarea 
                  className="w-full bg-muted/30 border-none rounded-3xl p-6 min-h-[140px] focus:ring-2 focus:ring-primary/20 outline-none text-lg"
                  placeholder="Tell us about the ride..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <Button className="w-full h-16 bg-primary text-white font-bold text-xl rounded-2xl shadow-xl shadow-primary/20" onClick={submitFeedback}>
                  Submit Review
                </Button>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="relative z-50 p-8 flex flex-col items-center gap-4 opacity-20 pointer-events-none">
        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground text-center">
          u-bike premium mobility
        </div>
      </footer>
    </div>
  );
}
