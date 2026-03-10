import { Copy } from 'lucide-react';

interface CopyActionFooterProps {
    selectedCount: number;
    onCopy: () => void;
}

export default function CopyActionFooter({ selectedCount, onCopy }: CopyActionFooterProps) {
    return (
        <div className="summary-footer">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {selectedCount} top-level item(s)
            </span>
            <button
                className="btn"
                onClick={onCopy}
                disabled={selectedCount === 0}
            >
                <Copy size={18} />
                Start Copy
            </button>
        </div>
    );
}
