import { FC } from "react";
import { TooltipProvider } from "../ui/tooltip";
import { TopMenuBar } from "../layout/TopMenuBar";

const HomeWrapper: FC = () => {
    return (
        <TooltipProvider delayDuration={200}>
            <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
                <TopMenuBar />
            </div>

            <div className="flex-1 flex overflow-hidden">
                TOOL SIDEBAR
            </div>
        </TooltipProvider>
    )
}

export default HomeWrapper;