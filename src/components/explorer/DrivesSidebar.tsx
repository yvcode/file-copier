import { HardDrive, ChevronLeft } from 'lucide-react';

interface DrivesSidebarProps {
    drives: string[];
    currentPath: string;
    onSelectDrive: (drive: string) => void;
    onBack: () => void;
}

export default function DrivesSidebar({ drives, currentPath, onSelectDrive, onBack }: DrivesSidebarProps) {
    return (
        <div className="glass-panel sidebar">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Locations</h2>
            <div className="drives-list">
                {drives.map(drive => (
                    <button
                        key={drive}
                        className={`drive-btn ${currentPath.startsWith(drive) ? 'active' : ''}`}
                        onClick={() => onSelectDrive(drive)}
                    >
                        <HardDrive size={18} />
                        {drive}
                    </button>
                ))}
            </div>
            <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: 'auto' }}>
                <ChevronLeft size={18} /> Back
            </button>
        </div>
    );
}
