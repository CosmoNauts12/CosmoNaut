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

export default function DemoTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const hasSeenDemo = localStorage.getItem("has_seen_demo");
    if (!hasSeenDemo) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      const step = TOUR_STEPS[currentStep];
      const element = document.getElementById(step.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentStep, isVisible]);

  const handleNext = () => {
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
    localStorage.setItem("has_seen_demo", "true");
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Overlay Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" onClick={handleSkip} />

      {/* Highlight Box */}
      <div
        className="absolute border-2 border-primary shadow-[0_0_20px_var(--primary-glow)] transition-all duration-500 rounded-lg pointer-events-none z-[101]"
        style={{
          top: coords.top - 4,
          left: coords.left - 4,
          width: coords.width + 8,
          height: coords.height + 8,
        }}
      />

      {/* Tooltip Content */}
      <div
        className="absolute z-[102] pointer-events-auto transition-all duration-500"
        style={{
          top: step.position === "bottom" ? coords.top + coords.height + 16 : 
               step.position === "top" ? coords.top - 180 : 
               coords.top + (coords.height / 2) - 80,
          left: step.position === "right" ? coords.left + coords.width + 16 : 
                step.position === "left" ? coords.left - 320 : 
                coords.left + (coords.width / 2) - 150,
        }}
      >
        <div className="liquid-glass p-6 rounded-2xl border-primary/30 w-[300px] shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-2">
             <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Step {currentStep + 1} of {TOUR_STEPS.length}</span>
             <button onClick={handleSkip} className="text-muted hover:text-foreground text-xs transition-colors">Skip</button>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-muted leading-relaxed mb-6">
            {step.description}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={handleSkip}
              className="flex-1 glass-btn-secondary py-2 rounded-xl text-xs font-bold"
            >
              Skip Tour
            </button>
            <button 
              onClick={handleNext}
              className="flex-[1.5] glass-btn-primary py-2 rounded-xl text-xs font-bold"
            >
              {currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
