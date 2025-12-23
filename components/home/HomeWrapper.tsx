import { FC } from "react";
import { TooltipProvider } from "../ui/tooltip";
import { TopMenuBar } from "../layout/TopMenuBar";
import { ToolSidebar } from "../toolbar/ToolSidebar";
import { BrushPanel } from "../panels/BrushPanel";

const HomeWrapper: FC = () => {
    return (
    <TooltipProvider delayDuration={200}>
      <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
        {/* Top Menu Bar */}
        <TopMenuBar />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Tool Sidebar */}
          <ToolSidebar />

          CANVAS

          {/* Right Panels */}
          <div className="w-72 flex flex-col gap-2 p-2 overflow-y-auto scrollbar-thin">
            <BrushPanel />
          </div>
        </div>

        STATUS BAR
      </div>
    </TooltipProvider>
  );
}

export default HomeWrapper;