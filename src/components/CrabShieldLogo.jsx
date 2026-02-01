/**
 * Pixel art crab shield logo - retro style
 * Preserved from the original MoltBot Guardian UI
 */
export default function CrabShieldLogo({ alert, className = "w-8 h-8" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} shapeRendering="crispEdges">
      {/* Shield outline */}
      <rect x="4" y="2" width="24" height="2" fill={alert ? "#dc2626" : "#dc2626"}/>
      <rect x="2" y="4" width="28" height="2" fill={alert ? "#ef4444" : "#ef4444"}/>
      <rect x="2" y="6" width="28" height="4" fill={alert ? "#f87171" : "#f87171"}/>
      <rect x="2" y="10" width="28" height="2" fill={alert ? "#ef4444" : "#ef4444"}/>
      <rect x="4" y="12" width="24" height="2" fill={alert ? "#dc2626" : "#dc2626"}/>
      <rect x="4" y="14" width="24" height="2" fill={alert ? "#b91c1c" : "#b91c1c"}/>
      <rect x="6" y="16" width="20" height="2" fill={alert ? "#b91c1c" : "#b91c1c"}/>
      <rect x="6" y="18" width="20" height="2" fill={alert ? "#991b1b" : "#991b1b"}/>
      <rect x="8" y="20" width="16" height="2" fill={alert ? "#991b1b" : "#991b1b"}/>
      <rect x="10" y="22" width="12" height="2" fill={alert ? "#7f1d1d" : "#7f1d1d"}/>
      <rect x="12" y="24" width="8" height="2" fill={alert ? "#7f1d1d" : "#7f1d1d"}/>
      <rect x="14" y="26" width="4" height="2" fill={alert ? "#450a0a" : "#450a0a"}/>

      {/* Crab body */}
      <rect x="12" y="8" width="8" height="4" fill="#0d0d12"/>
      <rect x="10" y="10" width="12" height="4" fill="#0d0d12"/>

      {/* Crab eyes - glowing cyan */}
      <rect x="12" y="9" width="2" height="2" fill="#00ffff"/>
      <rect x="18" y="9" width="2" height="2" fill="#00ffff"/>
      <rect x="13" y="9" width="1" height="1" fill="#ffffff"/>
      <rect x="19" y="9" width="1" height="1" fill="#ffffff"/>

      {/* Crab claws */}
      <rect x="6" y="10" width="4" height="2" fill="#1f1f2b"/>
      <rect x="22" y="10" width="4" height="2" fill="#1f1f2b"/>
      <rect x="6" y="8" width="2" height="2" fill="#2a2a3a"/>
      <rect x="24" y="8" width="2" height="2" fill="#2a2a3a"/>

      {/* Crab legs */}
      <rect x="8" y="14" width="2" height="2" fill="#1f1f2b"/>
      <rect x="22" y="14" width="2" height="2" fill="#1f1f2b"/>
      <rect x="10" y="16" width="2" height="2" fill="#1f1f2b"/>
      <rect x="20" y="16" width="2" height="2" fill="#1f1f2b"/>
    </svg>
  )
}
