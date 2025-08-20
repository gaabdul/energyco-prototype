'use client';

import { useState, useEffect, useRef } from 'react';
import billSample from '../../data/bill_sample.json';
import offers from '../../data/offers.json';
import rules from '../../data/rules.json';
import concepts from '../../data/concepts.json';
import { BillInput, Offer, Rule, Concept } from '../../data/types';

interface BillAnalysis {
  prevBill: number;
  currBill: number;
  delta: number;
  usageEffect: number;
  rateEffect: number;
  seasonalEffect: number;
  drivers: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

interface SavingsRecommendation {
  title: string;
  recommendation: string;
  savings: number;
  hasRecommendation: boolean;
}

interface LoyaltyTier {
  name: string;
  color: string;
  subtext: string;
  benefits: string[];
  progressToNext: number;
  actionsToNext: number;
}

interface Persona {
  id: string;
  name: string;
  displayName: string;
  painPoints: string[];
  bestFeature: string;
}

export default function Home() {
  const [selectedPersona, setSelectedPersona] = useState<string>('young-family');
  const [billData, setBillData] = useState<BillInput | null>({ ...billSample, curr_kwh: 920, curr_rate: 0.14 } as BillInput);
  const [analysis, setAnalysis] = useState<BillAnalysis | null>(null);
  const [savingsRecommendation, setSavingsRecommendation] = useState<SavingsRecommendation | null>(null);
  const [loyaltyTier, setLoyaltyTier] = useState<LoyaltyTier | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [applyRecommendation, setApplyRecommendation] = useState(false);

  // Refs for storyboard connectors
  const storyboardRef = useRef<HTMLDivElement | null>(null);
  const painRefs = useRef<Array<HTMLDivElement | null>>([]);
  const barRef = useRef<HTMLDivElement | null>(null);
  const rateRef = useRef<HTMLDivElement | null>(null);
  const projectionRef = useRef<HTMLDivElement | null>(null);
  const [connectors, setConnectors] = useState<Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    title: string;
    text: string;
  }>>([]);

  // Persona definitions with feature mapping
  const personas: Persona[] = [
    {
      id: 'young-family',
      name: 'Alex',
      displayName: 'Young Family',
      painPoints: [
        'Bills fluctuate month to month',
        'Doesn\'t know what actions reduce costs',
        'Feels anxious when bills spike'
      ],
      bestFeature: 'bill-explainer'
    },
    {
      id: 'senior-fixed-income',
      name: 'Maria',
      displayName: 'Senior on Fixed Income',
      painPoints: [
        'Lives on a fixed budget',
        'Bills feel confusing',
        'Wants predictability and peace of mind'
      ],
      bestFeature: 'savings-coach'
    },
    {
      id: 'ev-owner',
      name: 'Jordan',
      displayName: 'EV Owner',
      painPoints: [
        'EV charging significantly increased monthly bills',
        'Need to optimize charging during off-peak hours',
        'Want to maximize renewable energy usage'
      ],
      bestFeature: 'offer-matchmaker'
    },
    {
      id: 'student',
      name: 'Sam',
      displayName: 'Student',
      painPoints: [
        'Tight budget with limited disposable income',
        'Living in shared housing with split bills',
        'Need simple, affordable energy solutions'
      ],
      bestFeature: 'budget-buddy'
    }
  ];

  const currentPersona = personas.find(p => p.id === selectedPersona) || personas[0];

  const calculateBillAnalysis = (data: BillInput) => {
    const prevBill = data.prev_kwh * data.prev_rate;
    const currBill = data.curr_kwh * data.curr_rate;
    const delta = currBill - prevBill;
    const usageEffect = (data.curr_kwh - data.prev_kwh) * data.curr_rate;
    const rateEffect = data.curr_kwh * (data.curr_rate - data.prev_rate);
    const seasonalEffect = (data.weather_idx_curr - data.weather_idx_prev) * 0.05 * (data.curr_kwh * data.curr_rate);

    const drivers = [
      {
        name: 'Usage Change',
        value: usageEffect,
        percentage: Math.abs(usageEffect) > 0 ? (usageEffect / Math.abs(delta)) * 100 : 0
      },
      {
        name: 'Rate Change',
        value: rateEffect,
        percentage: Math.abs(rateEffect) > 0 ? (rateEffect / Math.abs(delta)) * 100 : 0
      },
      {
        name: 'Seasonal Effect',
        value: seasonalEffect,
        percentage: Math.abs(seasonalEffect) > 0 ? (seasonalEffect / Math.abs(delta)) * 100 : 0
      }
    ];

    setAnalysis({
      prevBill,
      currBill,
      delta,
      usageEffect,
      rateEffect,
      seasonalEffect,
      drivers
    });
  };

  const calculateSavingsRecommendation = (data: BillInput) => {
    const currBill = data.curr_kwh * data.curr_rate;
    
    if (data.plan_type === "variable") {
      const annualSavings = Math.round(currBill * 0.05 * 12);
      setSavingsRecommendation({
        title: "Switch to Fixed-Index Blend",
        recommendation: "Lock in predictable pricing and avoid rate volatility",
        savings: annualSavings,
        hasRecommendation: true
      });
    } else if (data.plan_type === "fixed" && data.digital_activity_score < 30) {
      setSavingsRecommendation({
        title: "Enable Digital Features",
        recommendation: "Get autopay discounts and real-time monitoring",
        savings: 40,
        hasRecommendation: true
      });
    } else {
      setSavingsRecommendation({
        title: "Your Plan is Optimized",
        recommendation: "No immediate changes needed",
        savings: 0,
        hasRecommendation: false
      });
    }
  };

  const calculateLoyaltyTier = (data: BillInput) => {
    const tenureMonths = data.tenure_months;
    const digitalActivity = data.digital_activity_score / 100;

    if (tenureMonths >= 24 && digitalActivity >= 0.7) {
      setLoyaltyTier({
        name: "Platinum",
        color: "bg-gradient-to-r from-purple-500 to-pink-500",
        subtext: "Premium rewards unlocked",
        benefits: ["Exclusive offers", "Priority support", "Max savings"],
        progressToNext: 100,
        actionsToNext: 0
      });
    } else if (tenureMonths >= 12 && digitalActivity >= 0.3) {
      setLoyaltyTier({
        name: "Gold",
        color: "bg-gradient-to-r from-yellow-400 to-orange-500",
        subtext: "Maintain activity for 12 months to unlock Platinum",
        benefits: ["Partner discounts", "Bonus rewards"],
        progressToNext: 60,
        actionsToNext: 2
      });
    } else {
      setLoyaltyTier({
        name: "Silver",
        color: "bg-gradient-to-r from-gray-400 to-gray-600",
        subtext: "Engage with 2 more offers to unlock Gold",
        benefits: ["Verified savings on energy bill"],
        progressToNext: 30,
        actionsToNext: 2
      });
    }
  };

  // Load sample data based on persona
  const loadPersonaData = () => {
    // Each persona gets their own scenario data
    let data: BillInput;
    switch (currentPersona.id) {
      case 'young-family':
        data = { ...billSample, prev_kwh: 850, curr_kwh: 920, prev_rate: 0.12, curr_rate: 0.14 } as BillInput; // Previous: $102.00, Current: $128.80
        break;
      case 'senior-fixed-income':
        data = { ...billSample, curr_rate: 0.12, weather_idx_curr: 0.8 } as BillInput; // Stable scenario
        break;
      case 'ev-owner':
        data = { ...billSample, curr_kwh: 1100, curr_rate: 0.15 } as BillInput; // High usage scenario
        break;
      case 'student':
        data = { ...billSample, curr_kwh: 600, curr_rate: 0.11 } as BillInput; // Low usage scenario
        break;
      default:
        data = billSample as BillInput;
    }
    
    setBillData(data);
    calculateBillAnalysis(data);
    calculateSavingsRecommendation(data);
    calculateLoyaltyTier(data);
  };

  // Load data when persona changes
  useEffect(() => {
    loadPersonaData();
  }, [selectedPersona]);

  const getAutoFilteredOffers = () => {
    if (!billData) return [];
    
    // Auto-filter based on plan type and digital activity
    const targetPersonas = ['eco-conscious'];
    if (billData.plan_type === 'variable') targetPersonas.push('price-sensitive');
    if (billData.digital_activity_score > 70) targetPersonas.push('tech-savvy');
    
    return (offers as Offer[]).filter(offer => 
      offer.persona.some(persona => targetPersonas.includes(persona))
    ).slice(0, 3);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'renewable': return '🌱';
      case 'smart-home': return '🏠';
      case 'fixed-rate': return '🔒';
      case 'time-of-use': return '⏰';
      default: return '⚡';
    }
  };

  const projectedBill = analysis && savingsRecommendation && applyRecommendation 
    ? analysis.currBill - (savingsRecommendation.savings / 12)
    : analysis?.currBill || 0;

  const getFeatureDisplayName = (featureId: string) => {
    switch (featureId) {
      case 'bill-explainer': return 'Bill Explainer';
      case 'savings-coach': return 'Savings Coach';
      case 'offer-matchmaker': return 'Offer Matchmaker';
      case 'budget-buddy': return 'Budget Buddy';
      default: return '';
    }
  };

  // Calculate analysis if not already done
  if (billData && !analysis) {
    calculateBillAnalysis(billData);
    calculateSavingsRecommendation(billData);
    calculateLoyaltyTier(billData);
  }

  // Compute absolute connector positions and update state
  useEffect(() => {
    const compute = () => {
      if (!storyboardRef.current) return;
      const next: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; title: string; text: string }>= [];

      const root = storyboardRef.current.getBoundingClientRect();
      const fromCenter = (el: HTMLElement | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.right - root.left, y: r.top - root.top + r.height / 2 };
      };
      const toLeftEdge = (el: HTMLElement | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left - root.left, y: r.top - root.top + r.height / 2 };
      };

      const pain1 = fromCenter(painRefs.current[0] as HTMLElement);
      const pain2 = fromCenter(painRefs.current[1] as HTMLElement);
      const pain3 = fromCenter(painRefs.current[2] as HTMLElement);
      const bar = toLeftEdge(barRef.current as HTMLElement);
      const rate = toLeftEdge(rateRef.current as HTMLElement);
      const proj = toLeftEdge(projectionRef.current as HTMLElement);

      if (pain1 && bar) {
        next.push({
          from: pain1,
          to: { x: bar.x + 8, y: bar.y },
          title: 'Explains fluctuations',
          text: 'Breaks down usage, rate, seasonal.'
        });
      }
      if (pain2 && rate) {
        next.push({
          from: pain2,
          to: { x: rate.x + 8, y: rate.y },
          title: 'Highlights main driver',
          text: 'This month: rate hikes.'
        });
      }
      if (pain3 && proj) {
        next.push({
          from: pain3,
          to: { x: proj.x + 8, y: proj.y },
          title: 'Helps budget ahead',
          text: "Projection builds confidence."
        });
      }

      setConnectors(next);
    };

    // compute on mount and on resize
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [selectedPersona, analysis]);

  // Render the appropriate feature based on selected persona
  const renderFocusedFeature = () => {
    switch (currentPersona.bestFeature) {
      case 'bill-explainer':
        return (
          <div ref={storyboardRef} className="relative">
            {/* Bill Explainer Visualization - Full Width */}
            <div className="bg-white rounded-lg shadow-md p-8 relative flex flex-col">
              {analysis && (
                <>
                  {/* Storyboard Headline */}
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                      Bill Explainer: Helping Alex understand unpredictable bills
                    </h2>
                  </div>

                  {/* Legend */}
                  <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-gray-700">
                    <span className="inline-flex items-center"><span className="inline-block h-3 w-3 bg-gray-400 rounded mr-2"></span>Previous bill</span>
                    <span className="inline-flex items-center"><span className="inline-block h-3 w-3 bg-red-300 rounded mr-2"></span>Usage increase</span>
                    <span className="inline-flex items-center"><span className="inline-block h-3 w-3 bg-red-500 rounded mr-2"></span>Rate increase</span>
                    <span className="inline-flex items-center"><span className="inline-block h-3 w-3 bg-red-700 rounded mr-2"></span>Seasonal increase</span>
                  </div>

                  {/* Bar Chart */}
                  <div className="mb-4">
                        <div className="relative">
                      <div ref={barRef} className="flex w-full h-12 rounded overflow-hidden">
                        {/* Previous amount - grey */}
                        <div className="relative bg-gray-400 flex items-center justify-center text-xs font-semibold text-white" style={{ width: '50%' }}>
                          Previous: $102.00
                            </div>
                        {/* Usage increase - light red */}
                        <div className="relative bg-red-300 flex items-center justify-center text-xs font-semibold text-white" style={{ width: '20%' }}>
                          +$9.80
                            </div>
                        {/* Rate increase - medium red */}
                        <div ref={rateRef} className="relative bg-red-500 flex items-center justify-center text-xs font-semibold text-white" style={{ width: '25%' }}>
                          +$18.40
                          </div>
                        {/* Seasonal increase - dark red */}
                        <div className="relative bg-red-700 flex items-center justify-center text-xs font-semibold text-white" style={{ width: '5%' }}>
                          +$0.60
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Current total after bar */}
                  <div className="mb-6 text-right">
                    <div className="text-lg font-semibold text-gray-900">Current: $128.80</div>
                  </div>

                  {/* Delta line (bold) */}
                  <div className="mb-8 text-center">
                    <p className="text-xl font-bold text-gray-900">
                      Your bill is $18.40 higher this month mainly because we had the week of 90 degree weather last week so your AC used more power
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Quick tip: raising your thermostat by just 2 degrees could save you around $10 next month
                    </p>
                  </div>

                  {/* Projected Next Month */}
                  <div ref={projectionRef} className="bg-red-50 border border-red-200 rounded-lg p-6 text-center relative">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Projected Next Month</h3>
                    <div className="text-4xl font-bold text-red-600 mb-1">
                      $122
                    </div>
                    <div className="text-sm text-gray-600">±$15</div>
                  </div>

                  {/* Connectors rendered at grid root */}
                </>
              )}
            </div>
            {/* SVG Connectors overlay across both panels (no destination callouts) */}
            <svg className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
              {connectors.map((c, idx) => {
                const toYOffset = [-16, 0, 16][idx % 3];
                const c1x = c.from.x + 60;
                const c1y = c.from.y;
                const c2x = c.to.x - 60;
                const c2y = c.to.y + toYOffset;
                const toY = c.to.y + toYOffset;
                const d = `M ${c.from.x} ${c.from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${c.to.x} ${toY}`;
                return (
                  <g key={idx}>
                    <path d={d} stroke="#9CA3AF" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                    <circle cx={c.to.x} cy={toY} r="4" fill="#9CA3AF" />
                  </g>
                );
              })}
            </svg>
          </div>
        );

      case 'savings-coach':
        return (
          <div className="relative">
            {/* Maria's Savings Coach - Predictability Focus */}
              <div className="bg-white rounded-lg shadow-md p-8">
              {analysis && savingsRecommendation && (
                <>
                  {/* Hero Section */}
                  <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                      💰 Savings Coach keeps your bills steady
                  </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                      Hey Maria! Based on your current usage pattern, you can save <span className="font-semibold text-green-600">$80</span> by switching to our time-of-day plan.
                  </p>
                </div>

                  {/* Before/After Volatility Chart */}
                  <div className="mb-12">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                      See how Savings Coach smooths out your bills
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Before - Volatile */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">❌ Before: Unpredictable spikes</h4>
                        <div className="bg-white rounded-lg p-4 h-32 relative">
                          <svg className="w-full h-full" viewBox="0 0 200 80">
                            <path 
                              d="M 10 60 Q 30 20 50 45 Q 70 70 90 30 Q 110 15 130 55 Q 150 75 170 35 Q 180 25 190 50"
                              fill="none" 
                              stroke="#6b7280" 
                              strokeWidth="3"
                            />
                            <text x="10" y="75" fill="#6b7280" fontSize="10" fontWeight="bold">Bills jump around</text>
                          </svg>
                        </div>
                        <p className="text-gray-700 text-sm mt-2">Stressful monthly surprises</p>
                      </div>

                      {/* After - Smooth */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-green-800 mb-4">✅ After: Steady & predictable</h4>
                        <div className="bg-white rounded-lg p-4 h-32 relative">
                          <svg className="w-full h-full" viewBox="0 0 200 80">
                            <path 
                              d="M 10 45 Q 30 43 50 44 Q 70 42 90 43 Q 110 41 130 42 Q 150 40 170 41 Q 180 39 190 40"
                              fill="none" 
                              stroke="#10b981" 
                              strokeWidth="3"
                            />
                            <text x="10" y="75" fill="#059669" fontSize="10" fontWeight="bold">Bills stay flat</text>
                          </svg>
                        </div>
                        <p className="text-green-700 text-sm mt-2">Peaceful monthly budgeting</p>
                      </div>
                    </div>
                  </div>

                  {/* Simple Plan Comparison - Focused on Stability */}
                  <div className="mb-12">
                    <div className="max-w-2xl mx-auto">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Current Plan */}
                        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 text-center">
                          <h4 className="font-semibold text-gray-800 mb-3">Current Variable Plan</h4>
                          <div className="text-3xl font-bold text-gray-600 mb-2">$110.40</div>
                          <div className="text-gray-700 text-sm">⚠️ Bills can spike unexpectedly</div>
                        </div>
                        
                        {/* Recommended Plan */}
                        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center relative">
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                            RECOMMENDED FOR PEACE OF MIND
                          </div>
                          <h4 className="font-semibold text-green-800 mb-3 mt-3">Fixed-Index Blend</h4>
                          <div className="text-3xl font-bold text-green-600 mb-2">$104.90</div>
                          <div className="text-green-700 text-sm">✅ Steady bills, save $66/year</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Smoothing Explanation */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-12">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                      How Fixed-Index Blend keeps bills steady
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="text-3xl mb-2">🔒</div>
                        <h4 className="font-semibold text-gray-800 mb-2">Fixed Base Rate</h4>
                        <p className="text-gray-700 text-sm">Most of your bill stays the same every month</p>
                      </div>
                      <div>
                        <div className="text-3xl mb-2">📊</div>
                        <h4 className="font-semibold text-gray-800 mb-2">Small Index Portion</h4>
                        <p className="text-gray-700 text-sm">Tiny adjustments only if market prices drop</p>
                      </div>
                      <div>
                        <div className="text-3xl mb-2">😌</div>
                        <h4 className="font-semibold text-gray-800 mb-2">Peace of Mind</h4>
                        <p className="text-gray-700 text-sm">Budget confidently with predictable bills</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="text-center bg-gray-50 rounded-lg p-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Ready for steady, predictable bills?</h3>
                    <label className="flex items-center justify-center cursor-pointer mb-4">
                          <input
                            type="checkbox"
                            checked={applyRecommendation}
                            onChange={(e) => setApplyRecommendation(e.target.checked)}
                            className="sr-only"
                          />
                      <div className={`relative inline-flex h-12 w-20 items-center rounded-full transition-colors ${
                            applyRecommendation ? 'bg-green-600' : 'bg-gray-300'
                          }`}>
                        <span className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform ${
                          applyRecommendation ? 'translate-x-10' : 'translate-x-1'
                            }`} />
                          </div>
                          <span className="ml-4 text-xl font-medium text-gray-700">
                        Switch to steady bills
                          </span>
                        </label>
                    {applyRecommendation && (
                      <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-full text-base font-medium">
                        ✅ Locked in — Your bills will now stay steady and predictable
                      </div>
                    )}
                      </div>
                </>
                      )}
                    </div>
                  </div>
        );

                        case 'offer-matchmaker':
        return (
          <div className="relative">
            {/* Jordan's EV Matchmaker - Charging Optimization Focus */}
            <div className="bg-white rounded-lg shadow-md p-8">
              {analysis && (
                <>
                  {/* Hero Section */}
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                      ⚡ EV Matchmaker finds the best charging plan for your lifestyle
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                      Stop paying peak rates to charge your EV. Get <span className="font-semibold text-green-600">EV-only discounts</span> and 
                      <span className="font-semibold text-gray-800"> smarter overnight charging</span> that saves you hundreds.
                      </p>
                    </div>

                  {/* 24-Hour Charging Cost Heatmap */}
                  <div className="mb-12">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                      Your optimal charging windows
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-12 gap-1 mb-4">
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i;
                          const isPeakHour = hour >= 16 && hour <= 21;
                          const isOffPeakHour = hour >= 23 || hour <= 6;
                          const bgColor = isPeakHour ? 'bg-red-500' : isOffPeakHour ? 'bg-green-500' : 'bg-gray-400';
                          const textColor = isPeakHour ? 'text-white' : isOffPeakHour ? 'text-white' : 'text-white';
                          
                          return (
                            <div key={i} className={`${bgColor} ${textColor} p-2 rounded text-center text-xs font-semibold`}>
                              {hour === 0 ? '12am' : hour <= 12 ? `${hour}am` : `${hour-12}pm`}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-center space-x-8 text-sm">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                          <span>Peak rates ($0.32/kWh)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                          <span>Standard rates ($0.18/kWh)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                          <span>Off-peak rates ($0.12/kWh)</span>
                        </div>
                      </div>
                      <p className="text-center text-gray-600 mt-4">
                        💡 <strong>Best charging time:</strong> 11pm - 6am saves you 63% on charging costs
                      </p>
                    </div>
                    </div>

                  {/* Horizontal Scrolling Plans */}
                  <div className="mb-12">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                      EV plans matched to your needs
                    </h3>
                    <div className="flex overflow-x-auto space-x-6 pb-4">
                                            {/* Current Plan */}
                      <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 min-w-[20rem] flex-none break-words">
                        <div className="text-center">
                          <h4 className="font-semibold text-gray-800 mb-3">❌ Current Standard Plan</h4>
                          <div className="text-3xl font-bold text-gray-600 mb-2">$165.40/mo</div>
                          <div className="text-gray-700 text-base mb-4">No EV benefits • Same rate 24/7</div>
                          <div className="bg-gray-100 rounded-lg p-3">
                            <p className="text-gray-800 text-base font-semibold">Annual charging cost: $1,980</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recommended Plan */}
                      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 min-w-[20rem] flex-none break-words">
                        <div className="mx-auto mb-3 inline-block bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold text-center break-words whitespace-normal">
                          🏆 BEST FOR EV OWNERS
                        </div>
                        <div className="text-center break-words whitespace-normal">
                          <h4 className="text-xl font-semibold text-green-800 mb-3">✅ EV Time-of-Use</h4>
                          <div className="text-3xl font-bold text-green-600 mb-2">$142.90/mo</div>
                          <div className="text-green-700 text-base mb-4">63% off overnight charging</div>
                          <div className="bg-green-100 rounded-lg p-3">
                            <p className="text-green-800 text-base font-semibold">Annual charging cost: $1,440</p>
                            <p className="text-green-600 text-sm mt-1">Save $540/year on charging!</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Premium Option */}
                      <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 min-w-[20rem] flex-none break-words">
                        <div className="text-center">
                          <h4 className="font-semibold text-gray-800 mb-3">🌱 EV + Renewable</h4>
                          <div className="text-3xl font-bold text-gray-600 mb-2">$158.20/mo</div>
                          <div className="text-gray-700 text-base mb-4">100% clean energy + EV rates</div>
                          <div className="bg-gray-100 rounded-lg p-3">
                            <p className="text-gray-800 text-base font-semibold">Annual charging cost: $1,620</p>
                            <p className="text-gray-600 text-sm mt-1">Save $360/year + go green!</p>
                          </div>
                        </div>
                      </div>
                        </div>
                  </div>

                  {/* Annual Savings Highlight */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-12 text-center">
                    <h3 className="text-3xl font-bold text-gray-800 mb-4">
                      Your potential annual savings
                    </h3>
                    <div className="text-6xl font-bold text-green-600 mb-2">$540</div>
                    <p className="text-xl text-gray-600 mb-4">
                      Just by charging during off-peak hours (11pm - 6am)
                    </p>
                    <div className="flex justify-center space-x-8 text-sm text-gray-600">
                      <div>⚡ <strong>Current:</strong> $1,980/year</div>
                      <div>→</div>
                      <div>✨ <strong>With EV plan:</strong> $1,440/year</div>
                      </div>
                  </div>

                  {/* CTA Section */}
                  <div className="text-center bg-gray-50 rounded-lg p-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Ready to optimize your EV charging?</h3>
                    <label className="flex items-center justify-center cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        checked={applyRecommendation}
                        onChange={(e) => setApplyRecommendation(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative inline-flex h-12 w-20 items-center rounded-full transition-colors ${
                        applyRecommendation ? 'bg-green-600' : 'bg-gray-300'
                      }`}>
                        <span className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform ${
                          applyRecommendation ? 'translate-x-10' : 'translate-x-1'
                        }`} />
                </div>
                      <span className="ml-4 text-xl font-medium text-gray-700">
                        Switch to EV Time-of-Use
                      </span>
                    </label>
                    {applyRecommendation && (
                      <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-full text-base font-medium">
                        🚗⚡ Locked in — You&apos;ll save $540/year on EV charging!
              </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );

                                    case 'budget-buddy':
        return (
          <div className="relative">
            {/* Sam's Budget Buddy - Stay on Budget Focus */}
            <div className="bg-white rounded-lg shadow-md p-8">
              {analysis && (
                <>
                  {/* Hero Section */}
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                      💰 Budget Buddy helps you stay within your allowance
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                      <span className="font-semibold text-gray-800">Stay on track, stress-free.</span> No more bill surprises 
                      or budget blowouts. Just simple alerts and smart savings to keep you within your monthly allowance.
                    </p>
                  </div>

                  {/* Budget Gauge/Progress Bar */}
                  <div className="mb-12">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                      Your monthly energy budget tracker
                </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Current Plan - Over Budget */}
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                        <h4 className="text-base font-semibold text-red-800 mb-4 text-center">⚠️ Going over budget</h4>
                        <div className="relative overflow-hidden">
                          {/* Progress Bar Container */}
                          <div className="w-full bg-gray-200 rounded-full h-8 mb-4 relative overflow-hidden">
                            <div className="bg-red-500 h-8 rounded-full absolute" style={{ width: '100%' }}>
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-sm font-bold">
                                $78
              </div>
                            </div>
                            {/* Overflow indicator */}
                            <div className="absolute right-0 top-0 w-3 h-8 bg-red-600 opacity-75"></div>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>$0</span>
                            <span className="font-semibold">$70 allowance</span>
                            <span>$100</span>
                          </div>
                          <div className="text-center mt-3">
                            <div className="text-red-600 font-semibold text-sm">⚠ $8 over budget</div>
                          </div>
                        </div>
                    </div>
                    
                      {/* Recommended Plan - Within Budget */}
                      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                        <h4 className="text-base font-semibold text-green-800 mb-4 text-center">✅ Staying on track</h4>
                        <div className="relative">
                    {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-8 mb-4">
                            <div className="bg-green-500 h-8 rounded-full relative" style={{ width: '94%' }}>
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-sm font-bold">
                                $66
                        </div>
                        </div>
                      </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>$0</span>
                            <span className="font-semibold">$70 allowance</span>
                            <span>$100</span>
                          </div>
                          <div className="text-center mt-3">
                            <div className="text-green-600 font-semibold text-sm">✅ $4 under budget</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alert Examples */}
                  <div className="mb-12">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                      Smart alerts keep you informed
                    </h3>
                    <div className="space-y-4">
                                            {/* Overspend Warning */}
                      <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-center">
                        <div className="text-2xl mr-4">⚠️</div>
                    <div>
                          <div className="font-semibold text-red-800">Overspend Warning</div>
                          <div className="text-red-700 text-sm">You&apos;re at 85% of your $70 monthly allowance. Consider reducing usage this week.</div>
                        </div>
                    </div>
                    
                      {/* Within Budget */}
                      <div className="bg-green-50 border border-green-300 rounded-lg p-4 flex items-center">
                        <div className="text-2xl mr-4">✅</div>
                        <div>
                          <div className="font-semibold text-green-800">Within Budget</div>
                          <div className="text-green-700 text-sm">Great job! You&apos;re on track to stay under your $70 allowance this month.</div>
                    </div>
                  </div>
                    </div>
                  </div>

                  {/* Simple Plan Comparison */}
                  <div className="mb-12">
                    <div className="max-w-2xl mx-auto">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Current Plan */}
                        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 text-center">
                          <h4 className="font-semibold text-gray-800 mb-3">Current Standard Plan</h4>
                          <div className="text-3xl font-bold text-gray-600 mb-2">$78.40</div>
                          <div className="text-gray-700 text-sm">❌ No budget protection</div>
                          <div className="text-red-600 text-xs mt-2">Likely to exceed $70 allowance</div>
                        </div>
                        
                        {/* Recommended Plan */}
                        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center relative">
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                            STUDENT FRIENDLY
                          </div>
                          <h4 className="font-semibold text-green-800 mb-3 mt-3">Student Saver Plan</h4>
                          <div className="text-3xl font-bold text-green-600 mb-2">$65.90</div>
                          <div className="text-green-700 text-sm">✅ Capped monthly spend</div>
                          <div className="text-green-600 text-xs mt-2">Stays within $70 allowance</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="text-center bg-gray-50 rounded-lg p-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Ready to stay on budget, stress-free?</h3>
                    <p className="text-gray-600 mb-6">Join thousands of students who never worry about their energy bills again.</p>
                    <label className="flex items-center justify-center cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        checked={applyRecommendation}
                        onChange={(e) => setApplyRecommendation(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`relative inline-flex h-12 w-20 items-center rounded-full transition-colors ${
                        applyRecommendation ? 'bg-green-600' : 'bg-gray-300'
                      }`}>
                        <span className={`inline-block h-10 w-10 transform rounded-full bg-white transition-transform ${
                          applyRecommendation ? 'translate-x-10' : 'translate-x-1'
                        }`} />
                      </div>
                      <span className="ml-4 text-xl font-medium text-gray-700">
                        Switch to Student Saver
                      </span>
                    </label>
                    {applyRecommendation && (
                      <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-full text-base font-medium">
                        🎓💰 Locked in — Budget Buddy will keep you on track and alert you before overspending!
                      </div>
                )}
              </div>
                </>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              EnergyCo Prototype
            </h1>
            <p className="text-gray-600 font-medium">
              See why your bill changed. Fix it in one tap. Get rewarded.
            </p>
          </div>
        </div>
      </div>

      {/* Persona Tabs - Centered */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center space-x-1">
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  selectedPersona === persona.id
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {persona.displayName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Persona Context Callout - Always Visible */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {currentPersona.name} — {currentPersona.displayName}
              </h2>
              <div className="space-y-2 mb-4">
                {currentPersona.painPoints.map((painPoint, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-red-500 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{painPoint}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-700 font-medium">
                For this persona, the most impactful feature is <span className="font-semibold">{getFeatureDisplayName(currentPersona.bestFeature)}</span>.
              </p>
            </div>
          </div>
        </div>

      {/* Focused Feature Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {renderFocusedFeature()}
      </div>

      {/* Details Drawer */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Bill Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <pre className="text-sm text-gray-700 bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(billData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}

