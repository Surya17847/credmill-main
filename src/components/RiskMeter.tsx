import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RiskMeterProps {
  score: number;
  riskLevel: string;
}

export function RiskMeter({ score, riskLevel }: RiskMeterProps) {
  // Calculate percentage for progress bar (300-900 range)
  const percentage = ((score - 300) / 600) * 100;

  // Determine color based on score
  const getColorClass = () => {
    if (score >= 760) return "text-green-600 dark:text-green-500";
    if (score >= 660) return "text-lime-600 dark:text-lime-500";
    if (score >= 540) return "text-yellow-600 dark:text-yellow-500";
    if (score >= 420) return "text-orange-600 dark:text-orange-500";
    return "text-red-600 dark:text-red-500";
  };

  const getBarColor = () => {
    if (score >= 760) return "bg-green-500";
    if (score >= 660) return "bg-lime-500";
    if (score >= 540) return "bg-yellow-500";
    if (score >= 420) return "bg-orange-500";
    return "bg-red-500";
  };

  // Risk ranges for display
  const riskRanges = [
    { min: 760, max: 900, label: "Very Low Risk", emoji: "🟢", color: "text-green-600 dark:text-green-500" },
    { min: 660, max: 759, label: "Low Risk", emoji: "🟩", color: "text-lime-600 dark:text-lime-500" },
    { min: 540, max: 659, label: "Medium Risk", emoji: "🟨", color: "text-yellow-600 dark:text-yellow-500" },
    { min: 420, max: 539, label: "High Risk", emoji: "🟧", color: "text-orange-600 dark:text-orange-500" },
    { min: 300, max: 419, label: "Very High Risk", emoji: "🔴", color: "text-red-600 dark:text-red-500" },
  ];

  // Calculate needle angle (0-180 degrees for semi-circle)
  const needleAngle = (percentage / 100) * 180;

  return (
    <div className="space-y-6">
      {/* Semi-circular Gauge Meter */}
      <div className="relative w-full max-w-md mx-auto">
        <svg viewBox="0 0 200 120" className="w-full h-auto">
          {/* Background arcs for each risk level */}
          {/* Very High Risk - Red (300-419) */}
          <path
            d="M 20 100 A 80 80 0 0 1 46.1 34.1"
            fill="none"
            stroke="hsl(0 84.2% 60.2%)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* High Risk - Orange (420-539) */}
          <path
            d="M 46.1 34.1 A 80 80 0 0 1 82 14"
            fill="none"
            stroke="hsl(25 95% 53%)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* Medium Risk - Yellow (540-659) */}
          <path
            d="M 82 14 A 80 80 0 0 1 118 14"
            fill="none"
            stroke="hsl(48 96% 53%)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* Low Risk - Lime (660-759) */}
          <path
            d="M 118 14 A 80 80 0 0 1 153.9 34.1"
            fill="none"
            stroke="hsl(84 81% 44%)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* Very Low Risk - Green (760-900) */}
          <path
            d="M 153.9 34.1 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="hsl(142 76% 36%)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Center circle */}
          <circle cx="100" cy="100" r="12" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
          
          {/* Needle */}
          <g transform={`rotate(${needleAngle - 90} 100 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="35"
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="6" fill="hsl(var(--foreground))" />
          </g>
          
          {/* Labels */}
          <text x="30" y="110" className="text-xs fill-muted-foreground" fontSize="10" textAnchor="middle">300</text>
          <text x="100" y="20" className="text-xs fill-muted-foreground" fontSize="10" textAnchor="middle">600</text>
          <text x="170" y="110" className="text-xs fill-muted-foreground" fontSize="10" textAnchor="middle">900</text>
        </svg>
        
        {/* Score Display */}
        <div className="text-center mt-4">
          <div className={cn("text-5xl font-bold", getColorClass())}>
            {score}
          </div>
          <div className="text-sm font-semibold text-muted-foreground mt-1">
            Credit Risk Score
          </div>
          <div className={cn("text-xl font-bold mt-2", getColorClass())}>
            {riskLevel}
          </div>
        </div>
      </div>

      {/* Risk Range Legend */}
      <div className="space-y-2 pt-4 border-t">
        <h3 className="text-sm font-semibold mb-3">Risk Level Ranges</h3>
        {riskRanges.map((range) => (
          <div 
            key={range.min}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg text-sm transition-colors",
              score >= range.min && score <= range.max ? "bg-accent" : "bg-muted/30"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{range.emoji}</span>
              <span className={cn("font-medium", score >= range.min && score <= range.max ? range.color : "text-muted-foreground")}>
                {range.label}
              </span>
            </div>
            <span className="text-muted-foreground">
              {range.min} – {range.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

