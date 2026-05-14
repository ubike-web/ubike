"use client";

import React, { useState, useEffect } from 'react';
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
  ArrowLeft, Loader2, User, Package, Map as MapIcon, Plus, ArrowUpRight, 
  History, BarChart3, ChevronRight, CreditCard, Settings,
  AlertCircle, CheckCircle2, Phone, Search, ChevronLeft
} from 'lucide-react';
import { 
  calculateFare, calculateCommission, formatFare,
  MOCK_RIDERS, MOCK_TRAFFIC, MOCK_REQUESTS, getGoogleMapsUrl, 
  ADJUSTMENT_REASONS, MIN_ADJUSTMENT_PCT, MAX_ADJUSTMENT_PCT,
  type RideType 
} from '@/lib/ride-service';
import { smartRiderMatcher, type SmartRiderMatcherOutput } from '@/ai/flows/smart-rider-matcher-flow';
import { cn } from '@/lib/utils';

type FlowState = 'LANDING' | 'BOOKING_PANEL' | 'MATCHING' | 'RIDE_IN_PROGRESS' | 'POST_RIDE' | 'RIDER_DASHBOARD' | 'RIDER_AUTH_CHOICE' | 'RIDER_LOGIN' | 'RIDER_SIGNUP' | 'RIDER_OTP' | 'RIDER_WALLET' | 'RIDER_WITHDRAW' | 'RIDER_WITHDRAW_SUCCESS';

function MapCard({ pickup, destination, isTracking = false }: { pickup: string; destination: string; isTracking?: boolean }) {
  return (
    <div className="relative w-full h-48 md:h-64 bg-[#0F172A] rounded-[3.5rem] overflow-hidden shadow-inner group border border-white/5">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
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
        <Badge variant="outline" className="mt-2 bg-white/90 border-none text-[8px] font-black uppercase tracking-tighter text-black">{pickup || 'Pickup'}</Badge>
      </div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 flex flex-col items-center">
        <div className="bg-white p-2 rounded-2xl shadow-lg shadow-white/40 ring-4 ring-white/10">
          <Navigation className="w-3 h-3 text-[#0F172A]" strokeWidth={2.5} />
        </div>
        <Badge variant="outline" className="mt-2 bg-white/90 border-none text-[8px] font-black uppercase tracking-tighter text-black">{destination || 'Destination'}</Badge>
      </div>
    </div>
  );
}

export default function RideShell() {
  const [state, setState] = useState<FlowState>('LANDING');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [rideType, setRideType] = useState<RideType>('Normal');
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [matchedRider, setMatchedRider] = useState<SmartRiderMatcherOutput | null>(null);
  const [rideRequests, setRideRequests] = useState(MOCK_REQUESTS);
  const [isRiderLoggedIn, setIsRiderLoggedIn] = useState(false);
  
  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawPIN, setWithdrawPIN] = useState('');

  // Fare Negotiation State
  const [isAdjusted, setIsAdjusted] = useState(false);
  const [pendingAdjustment, setPendingAdjustment] = useState<{ amount: number, reason: string, pct: number } | null>(null);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState(ADJUSTMENT_REASONS[0]);
  const [adjustmentPct, setAdjustmentPct] = useState(20);

  const distanceValue = (pickup && destination) ? 5.2 : 0;
  const basePriceAmount = calculateFare(distanceValue, rideType);
  const displayFare = isAdjusted && pendingAdjustment 
    ? formatFare(pendingAdjustment.amount)
    : formatFare(basePriceAmount);

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
  };

  const openInGoogleMaps = (location: string) => {
    window.open(getGoogleMapsUrl(location), '_blank');
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-transparent">
      {/* Header */}
      <header className="relative z-50 w-full bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5">
        <nav className="flex items-center justify-between px-6 md:px-12 py-4 max-w-7xl mx-auto w-full">
          <Logo className="h-8 md:h-10 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setState('LANDING')} />
          <div className="flex items-center gap-4">
            {!isRiderLoggedIn ? (
              <Button 
                variant="outline"
                size="sm"
                className="rounded-full border-primary/20 text-primary hover:bg-primary hover:text-white font-black uppercase text-[10px] tracking-widest h-9 px-6"
                onClick={() => setState('RIDER_AUTH_CHOICE')}
              >
                Rider Portal
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Wallet</p>
                  <p className="text-sm font-black text-primary">KES 7,584</p>
                </div>
                <Button 
                  size="sm"
                  className="rounded-full bg-primary text-white font-black uppercase text-[10px] tracking-widest h-9 px-6"
                  onClick={() => setState('RIDER_DASHBOARD')}
                >
                  Console
                </Button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="relative z-30 flex-1 flex flex-col items-center justify-center p-6 pb-24">
        <div className="w-full max-w-7xl animate-fade-in">
          
          {state === 'LANDING' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {/* SECTION 1: Welcome Panel */}
              <Card className="glass-morphism border-none rounded-[4rem] pill-shadow overflow-hidden flex flex-col p-12 min-h-[500px] relative">
                <div className="relative z-10 space-y-8">
                  <div className="space-y-4">
                    <p className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">Welcome to u-bike</p>
                    <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">Fast. Reliable. Premium.</h1>
                    <p className="text-foreground/60 font-medium text-lg leading-relaxed">The next generation of urban mobility for standard and electric bikes.</p>
                  </div>
                  <Logo className="h-24 md:h-32 opacity-100" />
                </div>
                {/* Silhouette Placeholder */}
                <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                <div className="mt-auto relative z-10">
                   <Bike className="w-48 h-48 text-primary opacity-20 absolute -bottom-12 -right-12" strokeWidth={1} />
                </div>
              </Card>

              {/* SECTION 2: Live Map Preview */}
              <Card className="glass-morphism border-none rounded-[4rem] pill-shadow overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-8 pb-0">
                  <Badge className="bg-primary/20 text-primary border-none font-black uppercase tracking-[0.2em] text-[10px] px-4 py-2 rounded-2xl mb-4">Live Tracking</Badge>
                </div>
                <div className="flex-1 px-8 pb-8 relative">
                  <div className="w-full h-full bg-[#0F172A] rounded-[3rem] overflow-hidden border border-white/5 relative">
                     <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                     <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <path d="M 50 300 Q 150 100 250 200 T 350 50" fill="none" stroke="#F97316" strokeWidth="3" strokeDasharray="10,5" className="animate-[dash_5s_linear_infinite]" />
                     </svg>
                     <div className="absolute top-1/2 left-1/3 bg-primary p-2 rounded-xl animate-pulse">
                        <MapPin className="w-3 h-3 text-white" />
                     </div>
                     <div className="absolute bottom-1/4 right-1/4 bg-white/20 backdrop-blur-md p-4 rounded-[2rem] border border-white/10 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                           <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                           <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Matched Rider</p>
                           <p className="text-[10px] font-black">Samuel K. • 4.9 ★</p>
                        </div>
                     </div>
                  </div>
                </div>
              </Card>

              {/* SECTION 3: Quick Book Panel */}
              <Card className="glass-morphism border-none rounded-[4rem] pill-shadow flex flex-col p-12 min-h-[500px]">
                <div className="space-y-8 h-full flex flex-col">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black uppercase tracking-tight">Ready to ride?</h2>
                    <div className="space-y-4">
                       <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                          <Input placeholder="Enter pickup" className="pl-12 h-16 bg-white/5 border-none rounded-3xl" value={pickup} onChange={e => setPickup(e.target.value)} />
                       </div>
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                          <Input placeholder="Where to?" className="pl-12 h-16 bg-white/5 border-none rounded-3xl" value={destination} onChange={e => setDestination(e.target.value)} />
                       </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 p-6 rounded-[2.5rem] space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Arrival</p>
                        <p className="text-xl font-black">4 min</p>
                     </div>
                     <div className="bg-white/5 p-6 rounded-[2.5rem] space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Standard</p>
                        <p className="text-xl font-black">KES 250</p>
                     </div>
                  </div>

                  <Button className="mt-auto h-20 bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase tracking-[0.2em] rounded-3xl shadow-2xl" onClick={startBooking}>
                    Get Started
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {state === 'BOOKING_PANEL' && (
             <div className="max-w-xl mx-auto space-y-8">
                <div className="flex items-center gap-6">
                   <Button variant="ghost" size="icon" onClick={() => setState('LANDING')} className="rounded-2xl hover:bg-white/5 h-14 w-14">
                      <ChevronLeft className="w-8 h-8" />
                   </Button>
                   <h2 className="text-3xl font-black uppercase tracking-tight">Review Booking</h2>
                </div>
                <Card className="glass-morphism border-none rounded-[4rem] p-10 space-y-8 pill-shadow">
                   <MapCard pickup={pickup} destination={destination} />
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="icon-pill-container bg-primary/10 p-4 text-primary">
                               {rideType === 'Electric' ? <Zap className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
                            </div>
                            <div>
                               <p className="font-black text-lg uppercase tracking-tight">{rideType} Ride</p>
                               <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-black">{distanceValue} KM • 12 MIN</p>
                            </div>
                         </div>
                         <p className="text-4xl font-black text-primary tracking-tighter">{displayFare}</p>
                      </div>
                      <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl">
                         <Label htmlFor="for-else" className="text-xs font-black uppercase tracking-widest">Book for someone else</Label>
                         <Switch id="for-else" checked={forSomeoneElse} onCheckedChange={setForSomeoneElse} />
                      </div>
                   </div>
                   <Button className="w-full h-18 bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase tracking-[0.2em] rounded-3xl" onClick={findRider}>
                      Confirm Booking
                   </Button>
                </Card>
             </div>
          )}

          {state === 'MATCHING' && (
             <div className="text-center space-y-12 py-16">
                <div className="relative flex items-center justify-center">
                   <div className="absolute h-56 w-56 animate-ping rounded-full bg-primary/10" />
                   <div className="relative h-32 w-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                      <Loader2 className="w-12 h-12 text-primary animate-spin" strokeWidth={1.5} />
                   </div>
                </div>
                <div className="space-y-4">
                   <h2 className="text-3xl font-black uppercase tracking-tight">Matching...</h2>
                   <p className="text-foreground/50 font-medium tracking-wide">Finding the best premium rider for you.</p>
                </div>
             </div>
          )}

          {state === 'RIDER_AUTH_CHOICE' && (
             <div className="max-w-xl mx-auto space-y-8 text-center">
                <h2 className="text-4xl font-black uppercase tracking-tighter">Rider Portal</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card 
                     className="glass-morphism border-none rounded-[4rem] p-12 cursor-pointer hover:bg-white/10 transition-all group"
                     onClick={() => setState('RIDER_LOGIN')}
                   >
                      <div className="icon-pill-container bg-primary/10 p-6 text-primary mb-6 group-hover:scale-110">
                         <User className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-widest">Sign In</h3>
                   </Card>
                   <Card 
                     className="glass-morphism border-none rounded-[4rem] p-12 cursor-pointer hover:bg-white/10 transition-all group"
                     onClick={() => setState('RIDER_SIGNUP')}
                   >
                      <div className="icon-pill-container bg-primary/10 p-6 text-primary mb-6 group-hover:scale-110">
                         <Bike className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-widest">Join Fleet</h3>
                   </Card>
                </div>
                <Button variant="ghost" onClick={() => setState('LANDING')} className="text-xs font-black uppercase tracking-widest opacity-40">Back to app</Button>
             </div>
          )}

          {state === 'RIDER_LOGIN' && (
             <div className="max-w-xl mx-auto space-y-8">
                <Button variant="ghost" onClick={() => setState('RIDER_AUTH_CHOICE')} className="gap-2 font-black uppercase text-[10px] tracking-widest">
                   <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Card className="glass-morphism border-none rounded-[4rem] p-12 space-y-10 pill-shadow">
                   <div className="space-y-6">
                      <h2 className="text-3xl font-black uppercase tracking-tight text-center">Login</h2>
                      <div className="space-y-4">
                         <Input placeholder="Phone number" className="h-16 bg-white/5 border-none rounded-3xl px-8" />
                         <Input type="password" placeholder="Password" className="h-16 bg-white/5 border-none rounded-3xl px-8" />
                      </div>
                   </div>
                   <Button className="w-full h-18 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-3xl" onClick={() => { setIsRiderLoggedIn(true); setState('RIDER_DASHBOARD'); }}>
                      Enter Console
                   </Button>
                </Card>
             </div>
          )}

          {state === 'RIDER_DASHBOARD' && (
             <div className="space-y-12">
                <div className="flex items-center justify-between">
                   <h2 className="text-4xl font-black uppercase tracking-tighter">Rider Console</h2>
                   <Button variant="ghost" onClick={() => setIsRiderLoggedIn(false)} className="text-xs font-black uppercase tracking-widest opacity-40">Sign Out</Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   {/* Wallet Quick Card */}
                   <Card 
                     className="bg-gradient-to-br from-[#4f46e5] via-[#a855f7] to-[#ec4899] border-none rounded-[4rem] p-10 text-white relative overflow-hidden pill-shadow cursor-pointer hover:scale-[1.02] transition-all"
                     onClick={() => setState('RIDER_WALLET')}
                   >
                      <div className="relative z-10 space-y-6">
                         <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Available Balance</p>
                            <Badge className="bg-white/20 text-white border-none rounded-full">+4.3%</Badge>
                         </div>
                         <h3 className="text-5xl font-black tracking-tighter">KES 7,584</h3>
                         <div className="flex items-center gap-4">
                            <div className="icon-pill-container bg-white/20 p-3">
                               <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-white/80">Manage your earnings</span>
                         </div>
                      </div>
                      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                   </Card>

                   {/* Stats Cards */}
                   <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="glass-morphism border-none rounded-[4rem] p-10 flex flex-col justify-center gap-4">
                         <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Total Earnings</p>
                         <p className="text-3xl font-black">KES 42,150</p>
                      </Card>
                      <Card className="glass-morphism border-none rounded-[4rem] p-10 flex flex-col justify-center gap-4">
                         <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Completed Rides</p>
                         <p className="text-3xl font-black">128</p>
                      </Card>
                   </div>
                </div>

                <div className="space-y-8">
                   <h3 className="text-xl font-black uppercase tracking-widest px-4">Available Requests</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {rideRequests.map(req => (
                         <Card key={req.id} className="glass-morphism border-none rounded-[4rem] p-10 space-y-8 pill-shadow">
                            <div className="flex justify-between items-start">
                               <div className="space-y-4">
                                  <div className="flex items-center gap-3">
                                     <div className="h-2 w-2 rounded-full bg-primary" />
                                     <p className="font-bold text-lg">{req.pickup}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                     <Navigation className="w-4 h-4 text-primary" />
                                     <p className="font-bold text-lg">{req.destination}</p>
                                  </div>
                               </div>
                               <p className="text-2xl font-black text-primary">{formatFare(req.price)}</p>
                            </div>
                            <div className="flex gap-4">
                               <Button variant="outline" className="flex-1 h-16 rounded-3xl font-black uppercase tracking-widest border-primary/20 text-primary" onClick={() => openInGoogleMaps(req.pickup)}>
                                  <MapIcon className="w-5 h-5 mr-2" /> Map
                               </Button>
                               <Button className="flex-1 h-16 bg-primary text-white font-black uppercase tracking-widest rounded-3xl">
                                  Accept
                               </Button>
                            </div>
                         </Card>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {state === 'RIDER_WALLET' && (
             <div className="max-w-xl mx-auto space-y-10">
                <div className="flex items-center justify-between">
                   <Button variant="ghost" onClick={() => setState('RIDER_DASHBOARD')} className="gap-2 font-black uppercase text-[10px] tracking-widest">
                      <ChevronLeft className="w-4 h-4" /> Console
                   </Button>
                   <h2 className="text-2xl font-black uppercase tracking-tight">Earnings Hub</h2>
                </div>

                <Card className="bg-gradient-to-br from-[#4f46e5] via-[#a855f7] to-[#ec4899] border-none rounded-[4rem] p-12 text-white relative overflow-hidden pill-shadow">
                   <div className="relative z-10 space-y-8 text-center">
                      <div className="space-y-2">
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Withdrawable Balance</p>
                         <h3 className="text-7xl font-black tracking-tighter leading-none">7,584</h3>
                         <p className="text-sm font-bold text-white/40">KES</p>
                      </div>
                      
                      <div className="flex justify-center gap-6">
                         <div className="flex flex-col items-center gap-2">
                            <button className="h-16 w-16 rounded-[2rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all">
                               <Plus className="w-7 h-7" />
                            </button>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Add</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                            <button 
                              className="h-16 w-16 rounded-[2rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/30 transition-all"
                              onClick={() => setState('RIDER_WITHDRAW')}
                            >
                               <ArrowUpRight className="w-7 h-7" />
                            </button>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Send</span>
                         </div>
                         <div className="flex flex-col items-center gap-2">
                            <button className="h-16 w-16 rounded-[2rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all">
                               <History className="w-7 h-7" />
                            </button>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">History</span>
                         </div>
                      </div>
                   </div>
                </Card>

                <div className="space-y-6">
                   <h3 className="text-xl font-black uppercase tracking-widest px-4">Performance</h3>
                   <div className="grid gap-4">
                      {[
                        { label: 'Standard Rides', amount: '24,500', commission: '20%', icon: Bike, color: 'text-orange-400' },
                        { label: 'Adjusted Rides', amount: '12,400', commission: '25%', icon: AlertCircle, color: 'text-purple-400' },
                        { label: 'Platform Fees', amount: '-8,240', commission: 'Deducted', icon: CreditCard, color: 'text-pink-400' }
                      ].map((item, i) => (
                         <Card key={i} className="glass-morphism border-none rounded-[3rem] p-8 flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer">
                            <div className="flex items-center gap-6">
                               <div className={cn("icon-pill-container bg-white/5 p-4", item.color)}>
                                  <item.icon className="w-6 h-6" />
                               </div>
                               <div>
                                  <p className="font-bold text-lg">{item.label}</p>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{item.commission} Rate</p>
                               </div>
                            </div>
                            <p className="text-xl font-black">KES {item.amount}</p>
                         </Card>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {state === 'RIDER_WITHDRAW' && (
             <div className="max-w-xl mx-auto space-y-10">
                <div className="flex items-center gap-6">
                   <Button variant="ghost" size="icon" onClick={() => setState('RIDER_WALLET')} className="rounded-2xl h-14 w-14">
                      <ChevronLeft className="w-8 h-8" />
                   </Button>
                   <h2 className="text-3xl font-black uppercase tracking-tight">Withdraw Funds</h2>
                </div>

                <Card className="glass-morphism border-none rounded-[4rem] p-12 space-y-10 pill-shadow">
                   <div className="space-y-8">
                      <div className="space-y-4">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-4">M-Pesa Number</Label>
                         <Input 
                           placeholder="07XX XXX XXX" 
                           className="h-16 bg-white/5 border-none rounded-3xl px-8"
                           value={withdrawPhone}
                           onChange={e => setWithdrawPhone(e.target.value)}
                         />
                      </div>
                      <div className="space-y-4">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-4">Amount (KES)</Label>
                         <Input 
                           placeholder="Enter amount" 
                           className="h-16 bg-white/5 border-none rounded-3xl px-8"
                           value={withdrawAmount}
                           onChange={e => setWithdrawAmount(e.target.value)}
                         />
                      </div>
                      <div className="space-y-4">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-4">Security PIN</Label>
                         <Input 
                           type="password"
                           placeholder="XXXX" 
                           maxLength={4}
                           className="h-16 bg-white/5 border-none rounded-3xl px-8 text-center text-3xl tracking-[1em]"
                           value={withdrawPIN}
                           onChange={e => setWithdrawPIN(e.target.value)}
                         />
                      </div>
                   </div>

                   <div className="bg-white/5 p-8 rounded-[2.5rem] space-y-4">
                      <div className="flex justify-between items-center text-sm">
                         <span className="opacity-40 font-bold">Transfer Fee</span>
                         <span className="font-black">KES 15.00</span>
                      </div>
                      <div className="flex justify-between items-center text-lg">
                         <span className="opacity-40 font-bold">Total Deduction</span>
                         <span className="font-black text-primary">KES {(Number(withdrawAmount) + 15).toLocaleString()}</span>
                      </div>
                   </div>

                   <Button className="w-full h-20 bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase tracking-[0.2em] rounded-3xl" onClick={() => setState('RIDER_WITHDRAW_SUCCESS')}>
                      Confirm Transfer
                   </Button>
                </Card>
             </div>
          )}

          {state === 'RIDER_WITHDRAW_SUCCESS' && (
             <div className="max-w-xl mx-auto text-center space-y-12 py-16">
                <div className="flex flex-col items-center gap-6">
                   <div className="h-24 w-24 bg-green-500/20 rounded-[2.5rem] flex items-center justify-center text-green-500 pill-shadow">
                      <CheckCircle2 className="w-12 h-12" />
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-4xl font-black uppercase tracking-tight">Withdrawal Successful</h2>
                      <p className="text-foreground/50 font-medium tracking-wide">Your funds are on the way to M-Pesa.</p>
                   </div>
                </div>
                <Card className="glass-morphism border-none rounded-[3.5rem] p-10 space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="opacity-40 font-bold uppercase text-[10px] tracking-widest">Amount</span>
                      <span className="font-black text-xl">KES {Number(withdrawAmount).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="opacity-40 font-bold uppercase text-[10px] tracking-widest">To</span>
                      <span className="font-black">{withdrawPhone}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="opacity-40 font-bold uppercase text-[10px] tracking-widest">Ref ID</span>
                      <span className="font-mono text-xs opacity-60">TXN-8X92K10</span>
                   </div>
                </Card>
                <Button className="w-full h-18 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-3xl" onClick={() => setState('RIDER_DASHBOARD')}>
                   Done
                </Button>
             </div>
          )}

          {state === 'RIDE_IN_PROGRESS' && matchedRider && (
             <div className="max-w-xl mx-auto space-y-8">
                {/* Fare Adjustment Request from Rider */}
                {!isAdjusted && pendingAdjustment && !isRiderLoggedIn && (
                   <div className="bg-primary/10 border-2 border-primary/20 p-10 rounded-[3.5rem] animate-in slide-in-from-top-4 duration-500 space-y-8">
                      <div className="flex items-center gap-4 text-primary">
                         <AlertCircle className="w-10 h-10" />
                         <h3 className="font-black text-2xl uppercase tracking-tight leading-none">Price Adjustment</h3>
                      </div>
                      <div className="flex justify-between items-center px-4">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 line-through">{formatFare(basePriceAmount)}</p>
                            <p className="text-4xl font-black text-primary tracking-tighter">{formatFare(pendingAdjustment.amount)}</p>
                         </div>
                         <Badge className="bg-primary text-white font-black px-6 py-3 rounded-2xl text-lg">+{pendingAdjustment.pct}%</Badge>
                      </div>
                      <div className="bg-white/5 p-8 rounded-3xl">
                         <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-3">Reason for increase</p>
                         <p className="font-bold text-xl text-foreground/80">"{pendingAdjustment.reason}"</p>
                      </div>
                      <div className="flex gap-4">
                         <Button variant="outline" className="flex-1 h-16 rounded-3xl font-black uppercase tracking-widest border-primary/20 text-primary" onClick={() => setPendingAdjustment(null)}>Decline</Button>
                         <Button className="flex-1 h-16 bg-primary text-white font-black uppercase tracking-widest rounded-3xl" onClick={() => setIsAdjusted(true)}>Accept New Fare</Button>
                      </div>
                   </div>
                )}

                <div className="glass-morphism border-none p-10 rounded-[4rem] flex justify-between items-center pill-shadow">
                   <div className="flex items-center gap-6">
                      <div className="icon-pill-container bg-primary p-5 text-white shadow-lg">
                         <Navigation className="w-8 h-8" />
                      </div>
                      <div>
                         <p className="text-2xl font-black tracking-tight uppercase">En Route</p>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Arriving in {matchedRider.estimatedPickupTime}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      {isAdjusted && <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] mb-2 px-3">ADJUSTED</Badge>}
                      <p className="text-4xl font-black text-primary tracking-tighter">{displayFare}</p>
                   </div>
                </div>

                <MapCard pickup={pickup} destination={destination} isTracking={true} />

                <Card className="glass-morphism border-none rounded-[4rem] p-10 space-y-10 pill-shadow">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                         <div className="h-24 w-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center border-4 border-white/10 shadow-xl">
                            <User className="w-12 h-12 text-primary" />
                         </div>
                         <div>
                            <h3 className="font-black text-3xl tracking-tight uppercase">{matchedRider.riderName}</h3>
                            <div className="flex items-center gap-4">
                               <span className="flex items-center gap-2 text-[10px] font-black bg-primary/10 text-primary px-4 py-2 rounded-full uppercase">
                                  <Star className="w-3 h-3 fill-primary" /> {matchedRider.riderRating}
                               </span>
                               <span className="text-[10px] text-foreground/40 font-black uppercase tracking-widest">{matchedRider.bikeType}</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <Button size="icon" variant="outline" className="h-16 w-16 rounded-[2rem] border-white/10 bg-white/5">
                            <Phone className="w-6 h-6 text-primary" />
                         </Button>
                         <Button size="icon" variant="outline" className="h-16 w-16 rounded-[2rem] border-white/10 bg-white/5">
                            <MessageCircle className="w-6 h-6 text-primary" />
                         </Button>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      {isRiderLoggedIn ? (
                         <>
                            <Button variant="outline" className="h-18 rounded-3xl font-black uppercase tracking-widest border-primary/20 text-primary" onClick={() => setShowAdjustmentDialog(true)}>
                               Adjust Fare
                            </Button>
                            <Button className="h-18 bg-primary text-white font-black uppercase tracking-widest rounded-3xl shadow-xl">
                               Arrived
                            </Button>
                         </>
                      ) : (
                         <>
                            <Button variant="ghost" className="h-18 rounded-3xl text-foreground/40 font-black uppercase tracking-widest hover:text-destructive">
                               <ShieldAlert className="w-6 h-6 mr-3" /> SOS
                            </Button>
                            <Button className="h-18 bg-primary text-white font-black uppercase tracking-widest rounded-3xl shadow-xl" onClick={() => setState('LANDING')}>
                               End Trip
                            </Button>
                         </>
                      )}
                   </div>
                </Card>
             </div>
          )}

        </div>
      </main>

      {/* Fare Adjustment Modal for Rider */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent className="glass-morphism rounded-[3.5rem] border-none p-12 max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase tracking-tight text-center">Adjust Fare</DialogTitle>
          </DialogHeader>
          <div className="space-y-12 py-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-4">Reason for Adjustment</Label>
              <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                <SelectTrigger className="h-16 bg-white/5 border-none rounded-3xl px-8 font-bold">
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent className="rounded-3xl border-none shadow-2xl bg-[#1e293b] text-white">
                  {ADJUSTMENT_REASONS.map(reason => (
                    <SelectItem key={reason} value={reason} className="font-bold py-4">{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-end px-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Percentage Increase</Label>
                <p className="text-4xl font-black text-primary">+{adjustmentPct}%</p>
              </div>
              <div className="px-4">
                <Slider 
                  value={[adjustmentPct]} 
                  onValueChange={(val) => setAdjustmentPct(val[0])}
                  min={MIN_ADJUSTMENT_PCT}
                  max={MAX_ADJUSTMENT_PCT}
                  step={1}
                  className="py-4"
                />
              </div>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-foreground/20 px-4">
                <span>Min 20%</span>
                <span>Max 30%</span>
              </div>
            </div>

            <div className="bg-primary/5 p-8 rounded-3xl flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-foreground/40 uppercase tracking-widest mb-2">New Estimated Fare</p>
                <p className="text-3xl font-black text-primary tracking-tighter">
                  {formatFare(basePriceAmount + Math.round(basePriceAmount * (adjustmentPct / 100)))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-foreground/40 uppercase tracking-widest mb-2">Commission (25%)</p>
                <p className="font-bold text-foreground/60">
                  {formatFare(calculateCommission(basePriceAmount + Math.round(basePriceAmount * (adjustmentPct / 100)), true))}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-4">
            <DialogClose asChild>
              <Button variant="ghost" className="h-16 flex-1 rounded-3xl font-black uppercase tracking-widest opacity-40">Cancel</Button>
            </DialogClose>
            <Button className="h-16 flex-1 bg-primary text-white font-black uppercase tracking-widest rounded-3xl" onClick={proposeAdjustment}>
              Send Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="relative z-50 p-12 flex flex-col items-center gap-4 opacity-20 pointer-events-none">
        <div className="text-[10px] font-black uppercase tracking-[0.8em] text-foreground text-center">u-bike • premium mobility</div>
      </footer>
    </div>
  );
}
