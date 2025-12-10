import React from 'react';

const Diagram = ({ 
  shadowLength, 
  rowSpacing, 
  panelHeightGL, 
  sunAltitude, 
  isMarginOk 
}) => {
  // SVG ViewBox settings
  const width = 600;
  const height = 300;
  const groundY = 250;
  const scale = 50; // pixels per meter (approx)

  // Calculate coordinates
  // Panel position (Left side)
  const panelX = 100;
  // Panel top point
  const panelTopY = groundY - (panelHeightGL * scale);
  
  // Shadow end point
  const shadowEndX = panelX + (shadowLength * scale);
  
  // Next row position (Recommended spacing)
  const nextRowX = panelX + (rowSpacing * scale);

  // Limit drawing if out of bounds
  const maxDrawX = width - 20;
  const effectiveShadowX = Math.min(shadowEndX, maxDrawX);
  const effectiveNextRowX = Math.min(nextRowX, maxDrawX);

  return (
    <div className="w-full border rounded-lg p-4 bg-white overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Ground */}
        <line x1="0" y1={groundY} x2={width} y2={groundY} stroke="#666" strokeWidth="2" />
        <text x="10" y={groundY + 20} fontSize="12" fill="#666">地面 (GL)</text>

        {/* Panel Post (Simplified) */}
        <line x1={panelX} y1={groundY} x2={panelX} y2={panelTopY} stroke="#333" strokeWidth="4" />
        {/* Panel Tilt Indication (Schematic) */}
        <line x1={panelX - 10} y1={panelTopY + 10} x2={panelX + 10} y2={panelTopY - 10} stroke="#2563eb" strokeWidth="6" />
        
        {/* Sun Ray */}
        <line 
          x1={panelX} 
          y1={panelTopY} 
          x2={effectiveShadowX} 
          y2={groundY} 
          stroke="#eab308" 
          strokeWidth="1" 
          strokeDasharray="4" 
        />
        
        {/* Shadow on Ground */}
        <line 
          x1={panelX} 
          y1={groundY} 
          x2={effectiveShadowX} 
          y2={groundY} 
          stroke="#000" 
          strokeWidth="4" 
          opacity="0.2" 
        />
        <text x={(panelX + effectiveShadowX) / 2} y={groundY - 5} fontSize="12" textAnchor="middle" fill="#666">
          影: {shadowLength.toFixed(2)}m
        </text>

        {/* Spacing Dimension */}
        {rowSpacing > 0 && (
          <>
            <line x1={panelX} y1={groundY + 40} x2={effectiveNextRowX} y2={groundY + 40} stroke="#2563eb" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
            <line x1={panelX} y1={groundY} x2={panelX} y2={groundY + 45} stroke="#ccc" strokeWidth="1" />
            <line x1={effectiveNextRowX} y1={groundY} x2={effectiveNextRowX} y2={groundY + 45} stroke="#ccc" strokeWidth="1" />
            <text x={(panelX + effectiveNextRowX) / 2} y={groundY + 35} fontSize="14" fontWeight="bold" textAnchor="middle" fill="#2563eb">
              推奨間隔: {rowSpacing.toFixed(2)}m
            </text>

            {/* Next Panel Ghost */}
            <g opacity="0.5">
              <line x1={effectiveNextRowX} y1={groundY} x2={effectiveNextRowX} y2={panelTopY} stroke="#999" strokeWidth="2" strokeDasharray="4" />
              <line x1={effectiveNextRowX - 10} y1={panelTopY + 10} x2={effectiveNextRowX + 10} y2={panelTopY - 10} stroke="#999" strokeWidth="4" />
              <text x={effectiveNextRowX} y={panelTopY - 20} fontSize="12" textAnchor="middle" fill="#666">次列</text>
            </g>
          </>
        )}

        {/* Definitions */}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
          </marker>
        </defs>
      </svg>
    </div>
  );
};

export default Diagram;
