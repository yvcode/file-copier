import { ArrowUp } from 'lucide-react';

interface ExplorerHeaderProps {
    currentPath: string;
    onNavigateUp: () => void;
}

export default function ExplorerHeader({ currentPath, onNavigateUp }: ExplorerHeaderProps) {
    return (
        <div className="header">
            <div className="breadcrumbs">
                <button
                    className="btn btn-secondary"
                    onClick={onNavigateUp}
                    style={{ padding: '6px' }}
                    title="Up"
                    disabled={!currentPath}
                >
                    <ArrowUp size={16} />
                </button>
                <span className="breadcrumb-path">{currentPath}</span>
            </div>
        </div>
    );
}
