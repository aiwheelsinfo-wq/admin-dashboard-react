import React, { useState, useMemo } from 'react';
import SliderInput from '../common/SliderInput';
import RevenueSplitBar from './RevenueSplitBar';
import Badge from '../common/Badge';
import { Calculator, Sparkles } from 'lucide-react';

const LiveSimulator = ({ globalSettings, vehicles }) => {
  const [selectedVehicle, setSelectedVehicle] = useState('Sedan');
  const [distanceKm, setDistanceKm] = useState(148); // Mumbai to Pune default
  const [overrideDemand, setOverrideDemand] = useState(10);
  const [useOverride, setUseOverride] = useState(false);

  const currentVehicle = useMemo(() => {
    return (vehicles && vehicles[selectedVehicle]) || {
      base_rate: 14,
      min_distance: 100,
      driver_allowance: 250,
      min_floor_rate: 11.20,
      max_ceiling_rate: 19.60,
    };
  }, [vehicles, selectedVehicle]);

  // Real-time calculation logic matching backend engine
  const calculation = useMemo(() => {
    const billableKm = Math.max(distanceKm, currentVehicle.min_distance || 100);
    const baseKmRate = currentVehicle.base_rate || 14;

    // Dynamic Demand calculations
    const refDemand = globalSettings.lookback_reference_demand || 6;
    const activeDemand = useOverride ? overrideDemand : (globalSettings.today_demand || 10);
    
    let dynamicKmRate = baseKmRate;
    let demandShiftPct = 0;
    let priceAdjPct = 0;
    let isCapped = false;
    let capType = 'none';

    if (globalSettings.dynamic_pricing_active) {
      const demandRatio = refDemand > 0 ? (activeDemand / refDemand) : 1.0;
      demandShiftPct = (demandRatio - 1.0) * 100;
      const sensitivity = (globalSettings.pricing_sensitivity || 50) / 100;
      priceAdjPct = demandShiftPct * sensitivity;

      const rawDynamicRate = baseKmRate * (1.0 + (priceAdjPct / 100));
      const minFloor = currentVehicle.min_floor_rate || (baseKmRate * 0.80);
      const maxCeiling = currentVehicle.max_ceiling_rate || (baseKmRate * 1.40);

      if (rawDynamicRate < minFloor) {
        dynamicKmRate = minFloor;
        isCapped = true;
        capType = 'floor';
      } else if (rawDynamicRate > maxCeiling) {
        dynamicKmRate = maxCeiling;
        isCapped = true;
        capType = 'ceiling';
      } else {
        dynamicKmRate = rawDynamicRate;
      }
    }

    const dynamicBaseFare = billableKm * dynamicKmRate;
    const staticBaseFare = billableKm * baseKmRate;

    const allowance = globalSettings.driver_allowance_active ? (currentVehicle.driver_allowance || 250) : 0;
    const toll = globalSettings.toll_charges_active ? ((distanceKm / 100) * (globalSettings.toll_rate_per_100km || 225)) : 0;
    const parking = globalSettings.parking_charges_active ? (globalSettings.parking_charge_amount || 0) : 0;

    const preTaxSubtotal = dynamicBaseFare + allowance + toll + parking;
    const gstPct = globalSettings.gst_active ? (globalSettings.gst_rate || 5) : 0;
    const gstAmount = preTaxSubtotal * (gstPct / 100);
    const finalCustomerFare = preTaxSubtotal + gstAmount;

    // Platform share & Driver Payout
    let companyProfit = 0;
    if (globalSettings.company_share_active) {
      if (globalSettings.company_share_type === 'flat') {
        companyProfit = globalSettings.company_share_value || 350;
      } else {
        companyProfit = preTaxSubtotal * ((globalSettings.company_share_value || 10) / 100);
      }
    }
    const driverNetPayout = Math.max(preTaxSubtotal - companyProfit, 0);

    const isDiscounted = finalCustomerFare < (staticBaseFare + allowance + toll + parking) * (1 + gstPct / 100);
    const discountPct = isDiscounted
      ? Math.round((1 - (dynamicKmRate / baseKmRate)) * 100)
      : 0;

    return {
      billableKm,
      baseKmRate,
      dynamicKmRate,
      demandShiftPct,
      priceAdjPct,
      isCapped,
      capType,
      dynamicBaseFare,
      staticBaseFare,
      allowance,
      toll,
      parking,
      preTaxSubtotal,
      gstAmount,
      finalCustomerFare,
      companyProfit,
      driverNetPayout,
      isDiscounted,
      discountPct,
      activeDemand,
      refDemand
    };
  }, [distanceKm, currentVehicle, globalSettings, overrideDemand, useOverride]);

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="section-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="section-title">
            <Calculator style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
            <span>Live Interactive Fare & Revenue Simulator</span>
          </div>
          <div className="section-subtitle">
            Simulate real-world customer search results, dynamic demand elasticity, and driver/company revenue splits in real time.
          </div>
        </div>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid-3">
        {/* Vehicle Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Vehicle Category</label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="form-select"
            style={{ width: '100%', padding: '9px 12px' }}
          >
            {Object.keys(vehicles || { Sedan: {}, SUV: {}, Innova: {}, Crysta: {} }).map((v) => (
              <option key={v} value={v}>{v} (Base: ₹{vehicles?.[v]?.base_rate || 14}/KM)</option>
            ))}
          </select>
        </div>

        {/* Distance Slider */}
        <SliderInput
          label="Trip Distance (KM)"
          value={distanceKm}
          onChange={setDistanceKm}
          min={50}
          max={800}
          step={5}
          unit=" KM"
          subtext={`e.g. Mumbai → Pune (148 KM), Mumbai → Shirdi (245 KM)`}
        />

        {/* Demand Scenario Override */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>Demand Simulation</label>
            <button
              onClick={() => setUseOverride(!useOverride)}
              style={{
                background: useOverride ? '#fff7ed' : '#f3f4f6',
                border: useOverride ? '1px solid #fed7aa' : '1px solid #e5e7eb',
                borderRadius: '6px',
                color: useOverride ? '#c2410c' : '#6b7280',
                padding: '2px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {useOverride ? 'Custom Active' : 'Use Live DB'}
            </button>
          </div>

          {useOverride ? (
            <SliderInput
              label="Simulated Today's Bookings"
              value={overrideDemand}
              onChange={setOverrideDemand}
              min={0}
              max={30}
              step={1}
              unit=" Bookings"
              subtext={`Ref Baseline: ${calculation.refDemand} bookings/day`}
            />
          ) : (
            <div style={{
              background: '#f9fafb',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '0.8125rem',
              color: '#4b5563'
            }}>
              Using live database volume: <b style={{ color: '#111827' }}>{calculation.activeDemand} bookings today</b> (vs {calculation.refDemand} baseline).
            </div>
          )}
        </div>
      </div>

      {/* Simulator Results Breakdown Card */}
      <div style={{
        background: '#f9fafb',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {/* Customer Price Highlight */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Simulated Customer Final Fare
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                ₹{calculation.finalCustomerFare.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
              {calculation.isDiscounted && (
                <span style={{ fontSize: '1.125rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                  ₹{(calculation.staticBaseFare + calculation.allowance + calculation.toll) * 1.05}
                </span>
              )}
              {calculation.isDiscounted ? (
                <Badge variant="green">🏷️ SAVE {calculation.discountPct}%</Badge>
              ) : calculation.priceAdjPct > 0 ? (
                <Badge variant="amber">🔥 SURGE +{Math.round(calculation.priceAdjPct)}%</Badge>
              ) : (
                <Badge variant="blue">Standard Rate</Badge>
              )}
            </div>
          </div>

          {/* Dynamic Rate Badge */}
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Dynamic KM Rate</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
              ₹{calculation.dynamicKmRate.toFixed(2)} / KM
            </div>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Base: ₹{calculation.baseKmRate.toFixed(2)}/KM</span>
          </div>
        </div>

        {/* Revenue Distribution Chart */}
        <div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>
            Estimated Revenue Distribution
          </span>
          <RevenueSplitBar
            driverPayout={calculation.driverNetPayout}
            companyShare={calculation.companyProfit}
            gstAmount={calculation.gstAmount}
          />
        </div>

        {/* Explainability Banner */}
        <div style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.8125rem',
          color: '#c2410c',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Sparkles style={{ width: '16px', height: '16px', flexShrink: 0, color: '#f59e0b' }} />
          <span>
            {calculation.demandShiftPct > 0
              ? `Demand is ${Math.abs(calculation.demandShiftPct).toFixed(1)}% higher than reference baseline (${calculation.activeDemand} vs ${calculation.refDemand}). Rate adjusted by +${calculation.priceAdjPct.toFixed(1)}% (Base: ₹${calculation.baseKmRate} → Final: ₹${calculation.dynamicKmRate.toFixed(2)}/KM).`
              : calculation.demandShiftPct < 0
              ? `Demand is ${Math.abs(calculation.demandShiftPct).toFixed(1)}% lower than reference baseline (${calculation.activeDemand} vs ${calculation.refDemand}). Rate adjusted by ${calculation.priceAdjPct.toFixed(1)}% (Base: ₹${calculation.baseKmRate} → Final: ₹${calculation.dynamicKmRate.toFixed(2)}/KM).`
              : `Demand is in exact equilibrium with reference baseline. Standard base rate ₹${calculation.baseKmRate}/KM applied.`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveSimulator;
