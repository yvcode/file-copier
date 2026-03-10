import { Copy } from 'lucide-react';

interface ExplorerFooterProps {
    selectedCount: number;
    userName: string;
    onCopy: () => void;
}

export default function ExplorerFooter({ selectedCount, userName, onCopy }: ExplorerFooterProps) {
    return (
        <div className="action-footer">
            <span className="selection-info">
                {selectedCount} item(s) selected
            </span>
            <button
                className="btn"
                onClick={onCopy}
                disabled={selectedCount === 0}
            >
                <Copy size={18} />
                Review &amp; Copy to C:\constant\{userName}
            </button>
        </div>
    );
}
