import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatCount } from '../../utils/format';
import type { CopyState, FailedFile } from '../../types';
import FailedFilesList from './FailedFilesList';

interface CopyResultViewProps {
    copyState: CopyState;
    totalProcessed: number;
    totalFailed: number;
    currentFile: string;
    failedFiles: FailedFile[];
    onRetry: () => void;
}

export default function CopyResultView({
    copyState, totalProcessed, totalFailed, currentFile, failedFiles, onRetry
}: CopyResultViewProps) {
    if (copyState === 'preview') return null;

    if (copyState === 'copying') {
        return (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)', marginBottom: '16px' }} />
                <p style={{ color: 'var(--text)', fontSize: '1.1rem' }}>
                    Copying files... <strong>{formatCount(totalProcessed)}</strong> processed
                </p>
                {currentFile && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentFile}
                    </p>
                )}
            </div>
        );
    }

    if (copyState === 'done') {
        return (
            <div>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    {totalFailed === 0 ? (
                        <>
                            <CheckCircle2 size={48} style={{ color: 'var(--success)', marginBottom: '12px' }} />
                            <p style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 600 }}>
                                All {formatCount(totalProcessed)} files copied successfully!
                            </p>
                        </>
                    ) : (
                        <>
                            <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '12px' }} />
                            <p style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 600 }}>
                                {formatCount(totalProcessed - totalFailed)} copied, {formatCount(totalFailed)} failed
                            </p>
                        </>
                    )}
                </div>
                <FailedFilesList failedFiles={failedFiles} onRetry={onRetry} />
            </div>
        );
    }

    return null;
}
