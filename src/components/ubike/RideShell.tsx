"use client";

import React, { useState } from 'react';
import { Logo } from './Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  MapPin, Navigation, Zap, Bike, Star, ShieldAlert, MessageCircle, 
  ArrowLeft, Loader2, User, CloudRain, Sun, CloudDrizzle, 
  Package, ExternalLink, Map as MapIcon, Plus, ArrowUpRight, 
  History, BarChart3, ChevronRight, CreditCard, ArrowLeftRight, Settings,
  AlertCircle
} from 'lucide-react';
import { 
  calculateFare, calculateErrandFare, calculateCommission, formatFare,
  MOCK_RIDERS, MOCK_TRAFFIC, MOCK_REQUESTS, getGoogleMapsUrl, 
  ADJUSTMENT_REASONS, MIN_ADJUSTMENT_PCT, MAX_ADJUSTMENT_PCT,
  type RideType 
} from '@/lib/ride-service';
import { smartRiderMatcher, type SmartRiderMatcherOutput } from '@/ai/flows/smart-rider-matcher-flow';
import { analyzePostRideFeedback } from '@/ai/flows/post-ride-feedback-analyzer-flow';
import { cn } from '@/lib/utils';

type FlowState = 'LANDING' | 'BOOKING_PANEL' | 'ERRANDS_PANEL' | 'MATCHING' | 'RIDE_IN_PROGRESS' | 'POST_RIDE' | 'RIDER_DASHBOARD' | 'RIDER_AUTH' | 'RIDER_WALLET' | 'RIDER_ANALYTICS';
type Weather = 'SUNNY' | 'RAINY' | 'DRIZZLE';
type ServiceType = 'RIDES' | 'ERRANDS';

function MapCard({ pickup, destination, isTracking = false }: { pickup: string; destination: string; isTracking?: boolean }) {
  return (
    <div className="relative w-full h-48 md:h-64 bg-[#0F172A] rounded-[3.5rem] overflow-hidden shadow-inner group">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
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
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="bg-primary p-2 rounded-2xl shadow-lg shadow-primary/40 ring-4 ring-primary/20 animate-bounce">
          <MapPin className="w-3 h-3 text-white" strokeWidth={2.5} />
        </div>
        <Badge variant="outline" className="mt-2 bg-white/90 border-none text-[8px] font-black uppercase tracking-tighter">{pickup || 'Pickup'}</Badge>
      </div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 flex flex-col items-center">
        <div className="bg-white p-2 rounded-2xl shadow-lg shadow-white/40 ring-4 ring-white/10">
          <Navigation className="w-3 h-3 text-[#0F172A]" strokeWidth={2.5} />
        </div>
        <Badge variant="outline" className="mt-2 bg-white/90 border-none text-[8px] font-black uppercase tracking-tighter">{destination || 'Destination'}</Badge>
      </div>
    </div>
  );
}

export default function RideShell() {
  const [state, setState] = useState<FlowState>('LANDING');
  const [weather] = useState<Weather>('SUNNY');
  const [selectedService, setSelectedService] = useState<ServiceType>('RIDES');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [rideType, setRideType] = useState<RideType>('Normal');
  const [errandSize] = useState('Small');
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [matchedRider, setMatchedRider] = useState<SmartRiderMatcherOutput | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [rideRequests, setRideRequests] = useState(MOCK_REQUESTS);
  const [isRiderLoggedIn, setIsRiderLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Fare Negotiation State
  const [isAdjusted, setIsAdjusted] = useState(false);
  const [pendingAdjustment, setPendingAdjustment] = useState<{ amount: number, reason: string, pct: number } | null>(null);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState(ADJUSTMENT_REASONS[0]);
  const [adjustmentPct, setAdjustmentPct] = useState(25); // Default 25%

  const distanceValue = (pickup && destination) ? 5.2 : 0;
  const basePriceAmount = calculateFare(distanceValue, rideType);
  const displayFare = isAdjusted && pendingAdjustment 
    ? formatFare(pendingAdjustment.amount)
    : formatFare(basePriceAmount);

  const startBooking = () => {
    if (pickup && destination) {
      setState(selectedService === 'ERRANDS' ? 'ERRANDS_PANEL' : 'BOOKING_PANEL');
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

  const proposeAdjustment = () => {
    const extra = Math.round(basePriceAmount * (adjustmentPct / 100));
    setPendingAdjustment({
      amount: basePriceAmount + extra,
      reason: adjustmentReason,
      pct: adjustmentPct
    });
    setShowAdjustmentDialog(false);
    // Notification logic would go here
  };

  const acceptAdjustment = () => {
    setIsAdjusted(true);
  };

  const declineAdjustment = () => {
    setPendingAdjustment(null);
    setIsAdjusted(false);
  };

  const completeRide = () => setState('POST_RIDE');

  const submitFeedback = async () => {
    if (feedback) await analyzePostRideFeedback({ comment: feedback });
    setState('LANDING');
    setPickup('');
    setDestination('');
    setFeedback('');
    setRating(0);
    setIsAdjusted(false);
    setPendingAdjustment(null);
  };

  const handleRequestAction = (id: string) => {
    setRideRequests(prev => prev.filter(req => req.id !== id));
  };

  const openInGoogleMaps = (location: string) => {
    window.open(getGoogleMapsUrl(location), '_blank');
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-transparent">
      <header className="relative z-50 w-full bg-white/40 backdrop-blur-xl border-b border-white/40">
        <nav className="flex items-center justify-between px-6 md:px-12 py-4 max-w-7xl mx-auto w-full">
          <Logo className="h-9 md:h-10 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setState('LANDING')} />
          <div className="flex items-center gap-6">
            <Button 
              variant="outline"
              size="sm"
              className="rounded-full border-primary/20 text-primary hover:bg-primary hover:text-white font-bold h-9 px-6 transition-all"
              onClick={() => isRiderLoggedIn ? setState('RIDER_DASHBOARD') : setState('RIDER_AUTH')}
            >
              {isRiderLoggedIn ? 'Dashboard' : 'Rider Portal'}
            </Button>
          </div>
        </nav>
      </header>

      <main className="relative z-30 flex-1 flex flex-col items-center justify-center p-6 pb-20">
        <div className="w-full max-w-xl animate-fade-in space-y-12">
          
          {state === 'LANDING' && (
            <div className="space-y-10 text-center">
              <div className="space-y-6 flex flex-col items-center">
                <h1 className="text-4xl md:text-6xl font-black tracking-[0.2em] text-foreground uppercase">u-bike</h1>
                <p className="text-foreground/60 text-lg font-medium tracking-wide max-w-md">premium urban mobility with smart location tracking</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setSelectedService('RIDES')}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-[3.5rem] transition-all duration-500 gap-4 border",
                    selectedService === 'RIDES' ? "bg-white pill-shadow border-white scale-105" : "bg-white/40 border-white/20 hover:bg-white/60"
                  )}
                >
                  <div className={cn("icon-pill-container p-4", selectedService === 'RIDES' ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
                    <Bike className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Book Ride</span>
                </button>

                <button 
                  onClick={() => setSelectedService('ERRANDS')}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-[3.5rem] transition-all duration-500 gap-4 border",
                    selectedService === 'ERRANDS' ? "bg-white pill-shadow border-white scale-105" : "bg-white/40 border-white/20 hover:bg-white/60"
                  )}
                >
                  <div className={cn("icon-pill-container p-4", selectedService === 'ERRANDS' ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
                    <Package className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Errands</span>
                </button>
              </div>

              <Card className="glass-morphism border-none pill-shadow rounded-[3.5rem] overflow-hidden">
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-primary/10 p-2 rounded-xl text-primary group-focus-within:bg-primary group-focus-within:text-white transition-colors">
                        <MapPin className="w-4 h-4" strokeWidth={2.5} />
                      </div>
                      <Input placeholder="Pickup Location" className="pl-16 h-16 bg-white/90 border-none rounded-3xl text-lg shadow-sm" value={pickup} onChange={(e) => setPickup(e.target.value)} />
                    </div>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-primary/10 p-2 rounded-xl text-primary group-focus-within:bg-primary group-focus-within:text-white transition-colors">
                        <Navigation className="w-4 h-4" strokeWidth={2.5} />
                      </div>
                      <Input placeholder="Where to?" className="pl-16 h-16 bg-white/90 border-none rounded-3xl text-lg shadow-sm" value={destination} onChange={(e) => setDestination(e.target.value)} />
                    </div>
                  </div>

                  {pickup && destination && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-6 duration-500">
                      <MapCard pickup={pickup} destination={destination} />
                      <div className="flex justify-between items-end px-2">
                        <div>
                          <p className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-1">Estimated Fare</p>
                          <p className="text-4xl font-black text-primary tracking-tighter">{displayFare}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-1">Distance</p>
                          <p className="text-lg font-bold tracking-tight">{distanceValue} KM</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button className="w-full h-18 text-xl font-black uppercase tracking-[0.2em] bg-primary hover:bg-primary/90 text-white rounded-3xl shadow-2xl shadow-primary/20" onClick={startBooking}>
                    Review Booking
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {state === 'BOOKING_PANEL' && (
            <div className="space-y-6">
              <div className="flex items-center gap-6 mb-2">
                <Button variant="ghost" size="icon" onClick={() => setState('LANDING')} className="rounded-2xl hover:bg-white/40 h-14 w-14">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-3xl font-black tracking-tight uppercase">Confirm Ride</h2>
              </div>

              <Card className="glass-morphism rounded-[3.5rem] overflow-hidden pill-shadow border-none">
                <CardContent className="p-10 space-y-8">
                  <MapCard pickup={pickup} destination={destination} />
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="icon-pill-container bg-primary/10 p-4 text-primary">
                          {rideType === 'Electric' ? <Zap className="w-6 h-6" strokeWidth={1.5} /> : <Bike className="w-6 h-6" strokeWidth={1.5} />}
                        </div>
                        <div>
                          <p className="font-black text-xl uppercase tracking-tight">{rideType} Ride</p>
                          <p className="text-[10px] text-foreground/40 uppercase tracking-[0.2em] font-black">{distanceValue} KM • 12 MIN</p>
                        </div>
                      </div>
                      <p className="text-4xl font-black text-primary tracking-tighter">{displayFare}</p>
                    </div>

                    <div className="pt-8 border-t border-white/20 space-y-6">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="for-else" className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">Book for someone else</Label>
                        <Switch id="for-else" checked={forSomeoneElse} onCheckedChange={setForSomeoneElse} />
                      </div>
                      {forSomeoneElse && (
                        <div className="grid gap-4 animate-in slide-in-from-top-4 duration-300">
                          <Input placeholder="Passenger Name" className="h-14 bg-white/50 border-none rounded-2xl px-6" value={passengerName} onChange={e => setPassengerName(e.target.value)} />
                          <Input placeholder="Phone Number" className="h-14 bg-white/50 border-none rounded-2xl px-6" value={passengerPhone} onChange={e => setPassengerPhone(e.target.value)} />
                        </div>
                      )}
                    </div>
                  </div>
                  <Button className="w-full h-18 bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase tracking-[0.2em] rounded-3xl shadow-2xl" onClick={findRider}>
                    Request Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {state === 'RIDER_DASHBOARD' && (
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black uppercase tracking-tight">Rider Console</h2>
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest" onClick={() => setIsRiderLoggedIn(false)}>Logout</Button>
                  <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => setState('LANDING')}>Exit</Button>
                </div>
              </div>

              <Card 
                className="bg-gradient-to-br from-[#8E2DE2] via-[#4A00E0] to-[#FF0080] border-none text-white rounded-[3.5rem] pill-shadow p-10 cursor-pointer group overflow-hidden relative"
                onClick={() => setState('RIDER_WALLET')}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                <div className="relative z-10 flex justify-between items-start mb-6">
                  <div className="space-y-2">
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Wallet Balance</p>
                    <h3 className="text-5xl font-black tracking-tighter">KES 7,584</h3>
                  </div>
                  <Badge className="bg-white/20 text-white border-none font-black text-xs px-3 py-1 rounded-full">+ 4.3%</Badge>
                </div>
                <div className="relative z-10 flex items-center gap-4 mt-6">
                  <div className="icon-pill-container bg-white/20 p-3">
                    <BarChart3 className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-bold text-white/80">View detailed performance insights</span>
                  <ChevronRight className="w-5 h-5 ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                </div>
              </Card>

              <div className="space-y-8">
                <h3 className="text-xl font-black uppercase tracking-widest px-2">Active Opportunities</h3>
                <div className="grid gap-6">
                  {rideRequests.map((req) => (
                    <Card key={req.id} className="glass-morphism border-none pill-shadow rounded-[3.5rem] overflow-hidden">
                      <CardContent className="p-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className="space-y-6 flex-1">
                            <div className="flex items-start gap-4">
                              <div className="mt-1.5 h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-1">Pickup</p>
                                <p className="font-black text-xl tracking-tight">{req.pickup}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="icon-pill-container bg-primary/10 p-2 text-primary">
                                <Navigation className="w-4 h-4" strokeWidth={2.5} />
                              </div>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-1">Destination</p>
                                <p className="font-black text-xl tracking-tight">{req.destination}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-3">
                            <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] tracking-[0.2em] px-3">{req.category}</Badge>
                            <p className="text-4xl font-black text-primary tracking-tighter">{formatFare(req.price)}</p>
                            <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{req.distance}</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <Button variant="outline" className="flex-1 h-16 rounded-3xl font-black uppercase tracking-widest border-primary/20 text-primary" onClick={() => openInGoogleMaps(req.pickup)}>
                            <MapIcon className="w-5 h-5 mr-3" /> Map
                          </Button>
                          <Button className="flex-1 h-16 bg-primary text-white font-black uppercase tracking-widest rounded-3xl shadow-xl" onClick={() => { handleRequestAction(req.id); setState('MATCHING'); findRider(); }}>
                            Accept
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {state === 'RIDER_WALLET' && (
            <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500 pb-32">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setState('RIDER_DASHBOARD')} className="rounded-2xl h-14 w-14">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-orange-400 p-0.5 shadow-lg">
                    <div className="h-full w-full rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                      <User className="w-7 h-7 text-primary" strokeWidth={1.5} />
                    </div>
                  </div>
                  <p className="font-black tracking-tight">Samuel's Wallet</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-2xl h-14 w-14 bg-white/20">
                  <Settings className="w-6 h-6" strokeWidth={1.5} />
                </Button>
              </div>

              <div className="bg-gradient-to-br from-[#8E2DE2] via-[#4A00E0] to-[#FF0080] p-12 rounded-[4rem] text-white pill-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-white/20 transition-all duration-1000" />
                <div className="space-y-4 relative z-10">
                  <p className="text-white/70 font-black uppercase tracking-[0.4em] text-[10px]">Total Balance (KES)</p>
                  <div className="flex items-baseline gap-4">
                    <h2 className="text-7xl font-black tracking-tighter">7,584</h2>
                    <Badge className="bg-green-400 text-green-900 border-none font-black text-xs px-3 rounded-full">+ 4.3%</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 mt-16">
                  {[
                    { icon: Plus, label: 'Add' },
                    { icon: ArrowUpRight, label: 'Withdraw' },
                    { icon: History, label: 'History' },
                    { icon: BarChart3, label: 'Stats' }
                  ].map((action, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <button className="h-16 w-16 rounded-[2rem] bg-white/15 backdrop-blur-xl flex items-center justify-center border border-white/20 transition-all hover:bg-white/30 hover:scale-110 active:scale-95 group/btn">
                        <action.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{action.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black uppercase tracking-[0.2em]">Performance</h3>
                  <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">View All</button>
                </div>
                
                <div className="grid gap-4">
                  {[
                    { icon: Bike, label: 'Standard Rides', amount: 5240, growth: '+20% Commission', color: 'bg-orange-500' },
                    { icon: Zap, label: 'Adjusted Rides', amount: 2344, growth: '+25% Commission', color: 'bg-indigo-500' },
                    { icon: CreditCard, label: 'Total Commissions', amount: -1258, growth: 'Automatic Deduction', color: 'bg-pink-500' }
                  ].map((item, i) => (
                    <Card key={i} className="bg-white/60 backdrop-blur-xl border-none rounded-[3rem] p-8 pill-shadow flex items-center justify-between group cursor-pointer hover:bg-white transition-all duration-300">
                      <div className="flex items-center gap-6">
                        <div className={cn("h-16 w-16 rounded-[1.75rem] flex items-center justify-center text-white shadow-xl icon-pill-container", item.color)}>
                          <item.icon className="w-7 h-7" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="font-black text-lg tracking-tight">{item.label}</p>
                          <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">{item.growth}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-2xl tracking-tighter">KES {Math.abs(item.amount).toLocaleString()}</p>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest text-foreground/30")}>MONTHLY</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {state === 'RIDER_AUTH' && (
            <div className="space-y-8">
              <div className="flex items-center gap-6 mb-2">
                <Button variant="ghost" size="icon" onClick={() => setState('LANDING')} className="rounded-2xl h-14 w-14 hover:bg-white/40">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-3xl font-black uppercase tracking-tight">{authMode === 'LOGIN' ? 'Rider Login' : 'Join Fleet'}</h2>
              </div>

              <Card className="glass-morphism rounded-[3.5rem] overflow-hidden border-none pill-shadow">
                <CardContent className="p-12 space-y-10">
                  <div className="space-y-6">
                    {authMode === 'SIGNUP' && (
                      <Input placeholder="Full Name" className="h-16 bg-white/50 border-none rounded-2xl px-8 text-lg" />
                    )}
                    <Input placeholder="Phone Number" className="h-16 bg-white/50 border-none rounded-2xl px-8 text-lg" />
                    <Input type="password" placeholder="Password" className="h-16 bg-white/50 border-none rounded-2xl px-8 text-lg" />
                  </div>
                  <Button className="w-full h-18 bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase tracking-[0.2em] rounded-3xl shadow-2xl" onClick={() => { setIsRiderLoggedIn(true); setState('RIDER_DASHBOARD'); }}>
                    {authMode === 'LOGIN' ? 'Sign In' : 'Join Now'}
                  </Button>
                  <div className="text-center">
                    <button className="text-xs font-black uppercase tracking-[0.2em] text-primary hover:underline" onClick={() => setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}>
                      {authMode === 'LOGIN' ? "New here? Join our fleet" : "Already registered? Login"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {state === 'MATCHING' && (
            <div className="text-center space-y-12 py-16">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-56 w-56 animate-ping rounded-full bg-primary/5" />
                <div className="relative h-32 w-32 bg-white rounded-[2.5rem] flex items-center justify-center pill-shadow">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black uppercase tracking-tight">Scanning Fleet...</h2>
                <p className="text-foreground/50 font-medium tracking-wide">Smart matching engine finding the best premium rider.</p>
              </div>
              <div className="px-6">
                <MapCard pickup={pickup} destination={destination} isTracking={true} />
              </div>
            </div>
          )}

          {state === 'RIDE_IN_PROGRESS' && matchedRider && (
            <div className="space-y-8">
              {/* Fare Adjustment Notification for Client */}
              {!isAdjusted && pendingAdjustment && !isRiderLoggedIn && (
                <div className="bg-primary/10 border-2 border-primary/20 p-8 rounded-[3rem] animate-in slide-in-from-top-4 duration-500 space-y-6">
                  <div className="flex items-center gap-4 text-primary">
                    <AlertCircle className="w-8 h-8" />
                    <h3 className="font-black text-xl uppercase tracking-tight">Price Adjusted</h3>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 line-through">{formatFare(basePriceAmount)}</p>
                      <p className="text-3xl font-black text-primary tracking-tighter">{formatFare(pendingAdjustment.amount)}</p>
                    </div>
                    <Badge className="bg-primary text-white font-black px-4 py-2 rounded-2xl">+{pendingAdjustment.pct}%</Badge>
                  </div>
                  <div className="bg-white/50 p-6 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">Reason provided by rider</p>
                    <p className="font-bold text-lg text-foreground/80">"{pendingAdjustment.reason}"</p>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest border-primary/20 text-primary" onClick={declineAdjustment}>Decline</Button>
                    <Button className="flex-1 h-14 bg-primary text-white font-black uppercase tracking-widest rounded-2xl" onClick={acceptAdjustment}>Accept</Button>
                  </div>
                </div>
              )}

              <div className="bg-white/80 backdrop-blur-xl border-none p-8 rounded-[3.5rem] pill-shadow flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="icon-pill-container bg-primary p-4 text-white shadow-lg">
                    <MapIcon className="w-7 h-7" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xl font-black tracking-tight uppercase">En Route</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Arriving in {matchedRider.estimatedPickupTime}</p>
                  </div>
                </div>
                <div className="text-right">
                  {isAdjusted && <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] mb-1">ADJUSTED</Badge>}
                  <p className="text-3xl font-black text-primary tracking-tighter">{displayFare}</p>
                </div>
              </div>

              <MapCard pickup={pickup} destination={destination} isTracking={true} />

              <Card className="glass-morphism border-none rounded-[4rem] overflow-hidden pill-shadow">
                <CardContent className="p-10 space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-[2rem] bg-muted flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                        <User className="w-12 h-12 text-primary" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-black text-2xl tracking-tight uppercase">{matchedRider.riderName}</h3>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">
                            <Star className="w-3 h-3 fill-primary" /> {matchedRider.riderRating}
                          </span>
                          <span className="text-[10px] text-foreground/40 font-black uppercase tracking-[0.2em]">{matchedRider.bikeType}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="icon" variant="outline" className="h-16 w-16 rounded-[2rem] border-border/50 bg-white/50">
                      <MessageCircle className="w-7 h-7" strokeWidth={1.5} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {isRiderLoggedIn ? (
                      <>
                        <Button variant="outline" className="h-16 rounded-3xl font-black uppercase tracking-widest border-primary/20 text-primary" onClick={() => setShowAdjustmentDialog(true)}>
                          Adjust Fare
                        </Button>
                        <Button className="h-16 bg-primary text-white font-black uppercase tracking-widest rounded-3xl shadow-xl" onClick={completeRide}>
                          Arrived
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" className="h-16 rounded-3xl text-foreground/40 font-black uppercase tracking-widest hover:text-destructive">
                          <ShieldAlert className="w-5 h-5 mr-3" strokeWidth={2.5} /> SOS
                        </Button>
                        <Button className="h-16 bg-primary text-white font-black uppercase tracking-widest rounded-3xl shadow-xl" onClick={completeRide}>
                          End Ride
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {state === 'POST_RIDE' && (
            <div className="text-center space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-700">
              <div className="space-y-6">
                <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary pill-shadow">
                  <Star className="w-12 h-12 fill-primary" strokeWidth={1.5} />
                </div>
                <h2 className="text-5xl font-black uppercase tracking-tight">Rate Ride</h2>
                <p className="text-foreground/50 font-medium tracking-wide">Your feedback helps maintain premium standards.</p>
              </div>

              <div className="flex justify-center gap-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className={cn("transition-all duration-500 transform hover:scale-125", rating >= s ? 'text-primary' : 'text-foreground/10')}>
                    <Star className={cn("w-14 h-14", rating >= s ? 'fill-primary' : '')} strokeWidth={1.5} />
                  </button>
                ))}
              </div>

              <div className="space-y-8">
                <textarea 
                  className="w-full bg-white/60 backdrop-blur-xl border-none rounded-[3.5rem] p-10 min-h-[160px] outline-none text-xl font-medium placeholder:text-foreground/30 pill-shadow"
                  placeholder="Tell us about the ride..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <Button className="w-full h-20 bg-primary text-white font-black text-2xl uppercase tracking-[0.2em] rounded-3xl shadow-2xl" onClick={submitFeedback}>
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fare Adjustment Modal for Rider */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent className="glass-morphism rounded-[3.5rem] border-none p-10 max-w-md w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-center">Adjust Fare</DialogTitle>
          </DialogHeader>
          <div className="space-y-10 py-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 ml-2">Reason for Adjustment</Label>
              <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                <SelectTrigger className="h-16 bg-white/50 border-none rounded-2xl px-6 font-bold">
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {ADJUSTMENT_REASONS.map(reason => (
                    <SelectItem key={reason} value={reason} className="font-bold">{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-end px-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Percentage Increase</Label>
                <p className="text-3xl font-black text-primary">+{adjustmentPct}%</p>
              </div>
              <div className="px-2">
                <Slider 
                  value={[adjustmentPct]} 
                  onValueChange={(val) => setAdjustmentPct(val[0])}
                  min={20}
                  max={30}
                  step={1}
                  className="py-4"
                />
              </div>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-foreground/20 px-2">
                <span>Min 20%</span>
                <span>Max 30%</span>
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-foreground/40 uppercase tracking-widest mb-1">New Estimated Fare</p>
                <p className="text-3xl font-black text-primary tracking-tighter">
                  {formatFare(basePriceAmount + Math.round(basePriceAmount * (adjustmentPct / 100)))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-foreground/40 uppercase tracking-widest mb-1">Commission (25%)</p>
                <p className="font-bold text-foreground/60">
                  {formatFare(calculateCommission(basePriceAmount + Math.round(basePriceAmount * (adjustmentPct / 100)), true))}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-4">
            <DialogClose asChild>
              <Button variant="ghost" className="h-16 flex-1 rounded-2xl font-black uppercase tracking-widest text-foreground/40">Cancel</Button>
            </DialogClose>
            <Button className="h-16 flex-1 bg-primary text-white font-black uppercase tracking-widest rounded-2xl" onClick={proposeAdjustment}>
              Send Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="relative z-50 p-12 flex flex-col items-center gap-4 opacity-30 pointer-events-none">
        <div className="text-[10px] font-black uppercase tracking-[0.6em] text-foreground text-center">u-bike premium mobility</div>
      </footer>
    </div>
  );
}
