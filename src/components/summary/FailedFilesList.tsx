import { File, XCircle, RotateCcw } from 'lucide-react';
import type { FailedFile } from '../../types';

interface FailedFilesListProps {
    failedFiles: FailedFile[];
    onRetry?: () => void;
}

export default function FailedFilesList({ failedFiles, onRetry }: FailedFilesListProps) {
    if (failedFiles.length === 0) return null;

    return (
        <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    {failedFiles.length} failed file(s):
                </p>
                {onRetry && (
                    <button className="btn btn-secondary" onClick={onRetry} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                        <RotateCcw size={14} /> Retry Failed
                    </button>
                )}
            </div>
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {failedFiles.map((f, i) => (
                    <div key={i} className="summary-file-row" style={{ fontSize: '0.85rem' }}>
                        <span className="col-status">
                            <XCircle size={14} style={{ color: '#ef4444' }} />
                        </span>
                        <span className="col-icon"><File size={14} color="#94a3b8" /></span>
                        <span className="col-name" title={f.path}>
                            {f.path.split('\\').pop()}
                        </span>
                        <span className="col-size" style={{ color: '#ef4444', fontSize: '0.75rem' }}>
                            {f.error}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
