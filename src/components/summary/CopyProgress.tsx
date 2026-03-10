import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { CopyState, CopyPhase } from '../../types';
import { formatSize, formatCount, formatEta } from '../../utils/format';
import ProgressBar from '../common/ProgressBar';

interface CopyProgressProps {
    copyState: CopyState;
    copyPhase: CopyPhase;
    totalFiles: number;
    totalBytes: number;
    totalProcessed: number;
    totalFailed: number;
    bytesCopied: number;
    currentFileBytes: number;
    currentFileTotal: number;
    currentFile: string;
    copyStartTime: number;
}

export default function CopyProgress({
    copyState, copyPhase,
    totalFiles, totalBytes, totalProcessed, totalFailed,
    bytesCopied, currentFileBytes, currentFileTotal,
    currentFile, copyStartTime,
}: CopyProgressProps) {
    const currentFileName = currentFile ? currentFile.split('\\').pop() || currentFile : '';
    const remaining = totalFiles - totalProcessed;
    const elapsed = (Date.now() - copyStartTime) / 1000;
    const bytesPerSec = elapsed > 0 && bytesCopied > 0 ? bytesCopied / elapsed : 0;
    const bytesRemaining = totalBytes - bytesCopied;
    const etaSeconds = bytesPerSec > 0 ? bytesRemaining / bytesPerSec : 0;
    const progressPercent = totalBytes > 0 ? (bytesCopied / totalBytes) * 100 : 0;
    const currentFilePercent = currentFileTotal > 0 ? (currentFileBytes / currentFileTotal) * 100 : 0;

    return (
        <>
            {copyState !== 'preview' && (
                <div className="summary-stats">
                    {copyPhase === 'counting' && copyState === 'copying' ? (
                        <div className="stat-item stat-copying">
                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Counting files... {formatCount(totalFiles)} found ({formatSize(totalBytes)})</span>
                        </div>
                    ) : (
                        <>
                            <div className="stat-item stat-success">
                                <CheckCircle2 size={18} />
                                <span>{formatCount(totalProcessed - totalFailed)} succeeded</span>
                            </div>
                            {totalFailed > 0 && (
                                <div className="stat-item stat-error">
                                    <AlertTriangle size={18} />
                                    <span>{formatCount(totalFailed)} failed</span>
                                </div>
                            )}
                            <div className="stat-item" style={{ color: 'var(--text-muted)' }}>
                                <span>{formatSize(bytesCopied)} / {formatSize(totalBytes)}</span>
                            </div>
                            {copyState === 'copying' && remaining > 0 && (
                                <div className="stat-item" style={{ color: 'var(--accent)' }}>
                                    <span>{formatCount(remaining)} files remaining • ETA {formatEta(etaSeconds)}</span>
                                </div>
                            )}
                            {copyState === 'copying' && bytesPerSec > 0 && (
                                <div className="stat-item" style={{ color: 'var(--text-muted)' }}>
                                    <span>{formatSize(bytesPerSec)}/s</span>
                                </div>
                            )}
                            {copyState === 'copying' && currentFileName && (
                                <div className="stat-item stat-copying">
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                    <span style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {currentFileName}
                                        {currentFileTotal > 0 && ` (${formatSize(currentFileBytes)} / ${formatSize(currentFileTotal)} — ${currentFilePercent.toFixed(0)}%)`}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {copyState === 'copying' && (
                <ProgressBar
                    percent={progressPercent}
                    indeterminate={copyPhase === 'counting'}
                />
            )}
        </>
    );
}
