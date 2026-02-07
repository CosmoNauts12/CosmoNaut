"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: "bottom" | "top" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-activity-bar",
    title: "Activities",
    description: "Switch between Collections, History, and Flows to manage your work.",
    position: "right",
  },
  {
    targetId: "tour-sidebar-content",
    title: "Contextual Sidebar",
    description: "Manage your items, search, and perform quick actions here.",
    position: "right",
  },
  {
    targetId: "tour-header-breadcrumbs",
    title: "Navigation",
    description: "Keep track of where you are in your workspace.",
    position: "bottom",
  },
  {
    targetId: "tour-invite-btn",
    title: "Collaboration",
    description: "Invite your teammates to collaborate on this workspace.",
    position: "bottom",
  },
  {
    targetId: "tour-tabs-bar",
    title: "Tabs Bar",
    description: "Easily switch between your open requests.",
    position: "bottom",
  },
  {
    targetId: "tour-main-content",
    title: "Workspace Area",
    description: "This is where the magic happens. Build and test your APIs here.",
    position: "top",
  },
  {
    targetId: "tour-footer-actions",
    title: "Footer Utilities",
    description: "Quick access to Cloud View, Console, and other helpful tools.",
    position: "top",
  },
];

const STORAGE_PREFIX = "cosmonaut_demo_v5_";

export default function DemoTour() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!user) return;

    const userKey = `${STORAGE_PREFIX}${user.uid}`;
    console.log(`DemoTour: Initial check for user ${user.uid}`);
    
    try {
      const hasSeenDemo = localStorage.getItem(userKey);
      if (!hasSeenDemo || hasSeenDemo === "false") {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200); // 1.2s delay to be absolutely sure
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error("DemoTour: Store access error", e);
    }
  }, [user]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 40; 
    
    if (isVisible) {
      const step = TOUR_STEPS[currentStep];
      if (!step) return;

      const findAndPos = () => {
        const element = document.getElementById(step.targetId);
        if (element) {
          const rect = element.getBoundingClientRect();
          
          if (rect.width === 0 || rect.height === 0) {
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              timeoutId = setTimeout(findAndPos, 200);
              return;
            }
          }

          const newCoords = {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          };
          
          setCoords(newCoords);
          element.scrollIntoView({ behavior: "smooth", block: "center" });

          // Calculate Tooltip Position
          let top = 0;
          let left = 0;
          const padding = 24;
          const tooltipWidth = 320;
          const tooltipHeight = 240; 

          if (step.position === "bottom") {
            top = newCoords.top + newCoords.height + padding;
            left = newCoords.left + (newCoords.width / 2) - (tooltipWidth / 2);
          } else if (step.position === "top") {
            top = newCoords.top - tooltipHeight - padding;
            left = newCoords.left + (newCoords.width / 2) - (tooltipWidth / 2);
          } else if (step.position === "right") {
            top = newCoords.top + (newCoords.height / 2) - (tooltipHeight / 2);
            left = newCoords.left + newCoords.width + padding;
          } else if (step.position === "left") {
            top = newCoords.top + (newCoords.height / 2) - (tooltipHeight / 2);
            left = newCoords.left - tooltipWidth - padding;
          }

          const viewPadding = 20;
          top = Math.max(viewPadding, Math.min(top, window.innerHeight - tooltipHeight - viewPadding));
          left = Math.max(viewPadding, Math.min(left, window.innerWidth - tooltipWidth - viewPadding));

          setTooltipPos({ top, left });
          setIsReady(true);
        } else {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            timeoutId = setTimeout(findAndPos, 300);
          } else {
            setCoords({ top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 });
            setTooltipPos({ top: window.innerHeight / 2 - 120, left: window.innerWidth / 2 - 160 });
            setIsReady(true);
          }
        }
      };

      findAndPos();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentStep, isVisible]);

  const handleNext = () => {
    setIsReady(false);
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (user) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${user.uid}`, "true");
      } catch (e) {
        console.error("DemoTour: Save error", e);
      }
    }
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  const x1 = coords.width > 0 ? coords.left - 8 : -10;
  const y1 = coords.width > 0 ? coords.top - 8 : -10;
  const x2 = coords.width > 0 ? coords.left + coords.width + 8 : -10;
  const y2 = coords.width > 0 ? coords.top + coords.height + 8 : -10;

  const holeClipPath = coords.width > 0 
    ? `polygon(0% 0%, 0% 100%, ${x1}px 100%, ${x1}px ${y1}px, ${x2}px ${y1}px, ${x2}px ${y2}px, ${x1}px ${y2}px, ${x1}px 100%, 100% 100%, 100% 0%)`
    : 'none';

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-[6px] pointer-events-auto transition-all duration-700 ease-in-out opacity-100" 
        style={{ clipPath: holeClipPath }}
        onClick={handleSkip} 
      />

      {isReady && coords.width > 0 && (
        <div
          className="absolute border-2 border-primary shadow-[0_0_60px_var(--primary-glow)] transition-all duration-500 rounded-xl pointer-events-none z-[10000] animate-in fade-in duration-500"
          style={{
            top: y1,
            left: x1,
            width: x2 - x1,
            height: y2 - y1,
          }}
        />
      )}

      {isReady && (
        <div
          className="absolute z-[10001] pointer-events-auto transition-all duration-500 ease-out"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
          }}
        >
          <div className="liquid-glass p-10 rounded-[2.5rem] border-primary/40 w-[340px] shadow-[0_40px_80px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom-8 fade-in duration-700">
            <div className="flex justify-between items-center mb-6">
               <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest ring-1 ring-primary/20">Step {currentStep + 1} of {TOUR_STEPS.length}</span>
               <button onClick={handleSkip} className="text-muted hover:text-foreground text-[10px] transition-colors font-black tracking-tighter uppercase opacity-50 hover:opacity-100">Skip Tour</button>
            </div>
            
            <h3 className="text-2xl font-bold text-foreground mb-4 leading-tight tracking-tight">
              {step.title}
            </h3>
            
            <p className="text-sm text-muted leading-relaxed mb-10 opacity-90 font-medium">
              {step.description}
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={handleSkip}
                className="flex-1 glass-btn-secondary py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Skip
              </button>
              <button 
                onClick={handleNext}
                className="flex-[2] glass-btn-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                {currentStep < TOUR_STEPS.length - 1 && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


