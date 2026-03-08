import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface WellnessState {
    latestJournalScore: number | null;
    phq9Score: number | null;
    gad7Score: number | null;
    activeTreatmentPlan: string | null;
}

interface WellnessContextType extends WellnessState {
    setLatestJournalScore: (score: number | null) => void;
    setPHQ9Score: (score: number | null) => void;
    setGAD7Score: (score: number | null) => void;
    setActiveTreatmentPlan: (plan: string | null) => void;
}

const WellnessContext = createContext<WellnessContextType | undefined>(undefined);

export function WellnessProvider({ children }: { children: ReactNode }) {
    // Add simple localStorage persistence so it doesn't drop on refresh
    const [state, setState] = useState<WellnessState>(() => {
        const saved = localStorage.getItem('manosathi_wellness_state');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse wellness state");
            }
        }
        return {
            latestJournalScore: null,
            phq9Score: null,
            gad7Score: null,
            activeTreatmentPlan: null
        };
    });

    useEffect(() => {
        localStorage.setItem('manosathi_wellness_state', JSON.stringify(state));
    }, [state]);

    const setLatestJournalScore = (score: number | null) =>
        setState(prev => ({ ...prev, latestJournalScore: score }));

    const setPHQ9Score = (score: number | null) =>
        setState(prev => ({ ...prev, phq9Score: score }));

    const setGAD7Score = (score: number | null) =>
        setState(prev => ({ ...prev, gad7Score: score }));

    const setActiveTreatmentPlan = (plan: string | null) =>
        setState(prev => ({ ...prev, activeTreatmentPlan: plan }));

    return (
        <WellnessContext.Provider value={{
            ...state,
            setLatestJournalScore,
            setPHQ9Score,
            setGAD7Score,
            setActiveTreatmentPlan
        }}>
            {children}
        </WellnessContext.Provider>
    );
}

export function useWellness() {
    const context = useContext(WellnessContext);
    if (context === undefined) {
        throw new Error('useWellness must be used within a WellnessProvider');
    }
    return context;
}
