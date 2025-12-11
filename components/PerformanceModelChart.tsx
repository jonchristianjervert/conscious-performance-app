
import React from 'react';
import { Scores } from '../types';

interface PerformanceModelChartProps {
  scores: Scores;
  previousScores?: Scores | null;
  type?: 'personal' | 'corporate';
}

const PerformanceModelChart: React.FC<PerformanceModelChartProps> = ({ scores, previousScores, type = 'personal' }) => {
  const width = 550;
  const height = 550;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width / 2 - 110; 
  const levels = 7;
  const accentColor = type === 'corporate' ? '#3b82f6' : '#f97316'; // Blue for corporate, Orange for personal
  const prevColor = '#94a3b8'; // Slate 400 for previous

  // --- Helper Functions ---
  const polarToCartesian = (angleInDegrees: number, r: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(startAngle, r);
    const end = polarToCartesian(endAngle, r);
    const angleRange = (endAngle - startAngle + 360) % 360;
    const largeArcFlag = angleRange > 180 ? '1' : '0';
    // Always draw clockwise
    const d = ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 1, end.x, end.y].join(" ");
    return d;
  };
  
  // --- Chart Configuration ---
  // If type is corporate, we map the labels differently based on the Zerkers Corporate Model
  const getLabel = (key: string) => {
      if (type !== 'corporate') return key;
      const map: Record<string, string> = {
          'Love': 'Culture',
          'Career': 'Engagement',
          'Abundance': 'Performance',
          'Fitness': 'Wellness'
      };
      return map[key] || key;
  };

  const coreLabelConfigs = [
    { key: 'Energy', angle: -22.5 },
    { key: 'Awareness', angle: 22.5 },
    { key: 'Love', angle: 67.5 },
    { key: 'Tribe', angle: 112.5 },
    { key: 'Career', angle: 157.5 },
    { key: 'Abundance', angle: 202.5 },
    { key: 'Fitness', angle: 247.5 },
    { key: 'Health', angle: 292.5 },
  ];

  const categoryLabels = ['CONSCIOUSNESS', 'CONNECTION', 'CONTRIBUTION', 'COMMITMENT'];
  
  const coreLabelRadius = radius + 15;
  const categoryLabelRadius = radius + 40;
  const adventureTrackInnerRadius = radius + 65;
  const adventureTrackOuterRadius = radius + 85;

  // --- Data Calculation (Current) ---
  const dataPoints = coreLabelConfigs.map(config => scores[config.key as keyof Scores]);
  const scorePolygonPoints = dataPoints
    .map((value, i) => {
      const angle = coreLabelConfigs[i].angle;
      const { x, y } = polarToCartesian(angle, (value / levels) * radius);
      return `${x},${y}`;
    })
    .join(' ');

  // --- Data Calculation (Previous) ---
  let prevPolygonPoints = '';
  if (previousScores) {
    const prevDataPoints = coreLabelConfigs.map(config => previousScores[config.key as keyof Scores]);
    prevPolygonPoints = prevDataPoints
      .map((value, i) => {
        const angle = coreLabelConfigs[i].angle;
        const { x, y } = polarToCartesian(angle, (value / levels) * radius);
        return `${x},${y}`;
      })
      .join(' ');
  }

  // --- Adventure Scale Calculation ---
  const scoreToAngle = (score: number) => {
      // Maps score 1->315, 4->180, 7->45.
      if (score < 1) score = 1;
      if (score > 7) score = 7;
      return 360 - 45 * score;
  };
  
  const adventureFillPath = () => {
    if (scores.Adventure < 1) return '';

    const startAngle = 315; // Corresponds to score 1
    const currentAngle = scoreToAngle(scores.Adventure);

    const startOuter = polarToCartesian(startAngle, adventureTrackOuterRadius);
    const endOuter = polarToCartesian(currentAngle, adventureTrackOuterRadius);
    const startInner = polarToCartesian(startAngle, adventureTrackInnerRadius);
    const endInner = polarToCartesian(currentAngle, adventureTrackInnerRadius);
    
    const angleDiff = startAngle >= currentAngle ? startAngle - currentAngle : startAngle + 360 - currentAngle;
    const largeArcFlag = angleDiff > 180 ? 1 : 0;
    
    return `M ${startOuter.x} ${startOuter.y} 
            A ${adventureTrackOuterRadius} ${adventureTrackOuterRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}
            L ${endInner.x} ${endInner.y}
            A ${adventureTrackInnerRadius} ${adventureTrackInnerRadius} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}
            Z`;
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Conscious Human Performance Model Chart">
        <defs>
          {/* Defs for Category text paths */}
          <path id="consciousnessPath" d={describeArc(categoryLabelRadius, -45, 45)} />
          <path id="connectionPath" d={describeArc(categoryLabelRadius, 45, 135)} />
          <path id="contributionPath" d={describeArc(categoryLabelRadius, 135, 225)} />
          <path id="commitmentPath" d={describeArc(categoryLabelRadius, 225, 315)} />

           {/* Defs for Adventure Text */}
          <path id="adventureTextPath" d={describeArc((adventureTrackInnerRadius + adventureTrackOuterRadius)/2, -60, 60)} />
        </defs>

        {/* Adventure outer track */}
        <circle cx={centerX} cy={centerY} r={adventureTrackOuterRadius} fill="none" stroke="#4B5563" strokeWidth="1" />
        <circle cx={centerX} cy={centerY} r={adventureTrackInnerRadius} fill="#1F2937" stroke="#4B5563" strokeWidth="1" />
        
        {/* Adventure Score Fill */}
        {scores.Adventure > 0 && <path d={adventureFillPath()} fill={accentColor} opacity="0.8" />}

        {/* Adventure Text */}
        <text dy="6">
          <textPath href="#adventureTextPath" startOffset="50%" textAnchor="middle" fill={accentColor} fontSize="18" fontWeight="bold" letterSpacing="0.1em">
            ADVENTURE
          </textPath>
        </text>

        {/* Adventure Scale Numbers */}
        {Array.from({ length: 7 }).map((_, i) => {
            const scoreValue = i + 1;
            const angle = 360 - 45 * scoreValue; // Using the direct formula
            const { x, y } = polarToCartesian(angle, adventureTrackOuterRadius + 12);
            return <text key={`adv-num-${i}`} x={x} y={y} textAnchor="middle" dy="0.3em" fill="#D1D5DB" fontSize="12">{scoreValue}</text>
        })}

        {/* Grid Lines */}
        {Array.from({ length: levels }).map((_, i) => (
          <circle key={`grid-${i}`} cx={centerX} cy={centerY} r={(radius * (i + 1)) / levels} fill="none" stroke="#374151" strokeWidth="1"/>
        ))}
        
        {/* Category Arcs */}
        <circle cx={centerX} cy={centerY} r={radius + 25} fill="none" stroke="#4B5563" strokeWidth="1" />
        <circle cx={centerX} cy={centerY} r={radius + 55} fill="none" stroke="#4B5563" strokeWidth="1" />
        
        {/* Category Texts */}
        <text fill="#D1D5DB" fontSize="14" fontWeight="500" letterSpacing="0.05em">
            <textPath href="#consciousnessPath" startOffset="50%" textAnchor="middle">CONSCIOUSNESS</textPath>
            <textPath href="#connectionPath" startOffset="50%" textAnchor="middle">CONNECTION</textPath>
            <textPath href="#contributionPath" startOffset="50%" textAnchor="middle">CONTRIBUTION</textPath>
            <textPath href="#commitmentPath" startOffset="50%" textAnchor="middle">COMMITMENT</textPath>
        </text>

        {/* Axes and Core Labels */}
        {coreLabelConfigs.map(({ key, angle }) => {
          const endPoint = polarToCartesian(angle, radius);
          const labelPoint = polarToCartesian(angle, coreLabelRadius);
          return (
            <g key={`axis-${key}`}>
              <line x1={centerX} y1={centerY} x2={endPoint.x} y2={endPoint.y} stroke="#4B5563" strokeWidth="1"/>
              <text x={labelPoint.x} y={labelPoint.y} dy="0.3em" textAnchor="middle" fill="#D1D5DB" fontSize="12">{getLabel(key)}</text>
            </g>
          );
        })}
        
        <circle cx={centerX} cy={centerY} r="3" fill={accentColor} />

        {/* PREVIOUS Data Polygon (The Ghost Chart) */}
        {previousScores && (
            <>
                <polygon points={prevPolygonPoints} fill="none" stroke={prevColor} strokeWidth="2" strokeDasharray="5,5" opacity="0.7" />
                {/* Previous Data Points */}
                {previousScores && coreLabelConfigs.map((config, i) => {
                   const val = previousScores[config.key as keyof Scores];
                   const angle = config.angle;
                   const { x, y } = polarToCartesian(angle, (val / levels) * radius);
                   return <circle key={`prev-point-${i}`} cx={x} cy={y} r="3" fill={prevColor} />;
                })}
            </>
        )}

        {/* CURRENT Data Polygon */}
        <polygon points={scorePolygonPoints} fill={type === 'corporate' ? "rgba(59, 130, 246, 0.3)" : "rgba(249, 115, 22, 0.3)"} stroke={accentColor} strokeWidth="3"/>

        {/* Current Data Points */}
        {dataPoints.map((value, i) => {
           const angle = coreLabelConfigs[i].angle;
           const { x, y } = polarToCartesian(angle, (value / levels) * radius);
           return <circle key={`point-${i}`} cx={x} cy={y} r="5" fill={accentColor} stroke="#1F2937" strokeWidth="1" />;
        })}

      </svg>

      {/* Legend */}
      {previousScores && (
          <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 ${type === 'corporate' ? 'bg-blue-500/30 border-blue-500' : 'bg-orange-500/30 border-orange-500'} border rounded-sm`}></div>
                  <span className={`${type === 'corporate' ? 'text-blue-500' : 'text-orange-500'} font-bold`}>Current</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-4 h-0 border-b-2 border-dashed border-slate-400"></div>
                  <span className="text-slate-400 font-bold">Previous</span>
              </div>
          </div>
      )}
    </div>
  );
};

export default PerformanceModelChart;
