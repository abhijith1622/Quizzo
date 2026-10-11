import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
export { LiquidMetalButton };

export default function LiquidMetalButtonDemo() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-xl">
      <div className="text-center space-y-1">
        <h3 className="text-sm font-semibold text-slate-200">Interactive Liquid Metal Shader</h3>
        <p className="text-xs text-slate-400">WebGL shader canvas with 3D perspective, hover acceleration & ripple feedback</p>
      </div>
      <div className="flex items-center gap-8">
        <LiquidMetalButton label="Get Started" />
        <LiquidMetalButton viewMode="icon" />
      </div>
    </div>
  );
}
