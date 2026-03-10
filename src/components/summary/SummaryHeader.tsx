import { ChevronLeft } from 'lucide-react';
import type { CopyState, CopyPhase } from '../../types';

interface SummaryHeaderProps {
    userName: string;
    copyState: CopyState;
    copyPhase: CopyPhase;
    onBack: () => void;
    onDone: () => void;
}

export default function SummaryHeader({ userName, copyState, copyPhase, onBack, onDone }: SummaryHeaderProps) {
    return (
        <div className="summary-header">
            <button
                className="btn btn-secondary"
                onClick={copyState === 'done' ? onDone : onBack}
                disabled={copyState === 'copying'}
            >
                <ChevronLeft size={18} />
                {copyState === 'done' ? 'Done' : 'Back to Explorer'}
            </button>
            <h2 className="summary-title">
                {copyState === 'preview' && 'Copy Summary'}
                {copyState === 'copying' && copyPhase === 'counting' && 'Counting Files...'}
                {copyState === 'copying' && copyPhase === 'copying' && 'Copying Files...'}
                {copyState === 'done' && 'Copy Results'}
            </h2>
            <div className="summary-destination">
                Destination: <strong>C:\constant\{userName}</strong>
            </div>
        </div>
    );
}
