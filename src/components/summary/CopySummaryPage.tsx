import { useState } from 'react';
import type { FileItem } from '../../types';
import { useCopyOperation } from '../../hooks/useCopyOperation';

import ErrorBanner from '../common/ErrorBanner';
import SummaryHeader from './SummaryHeader';
import CopyProgress from './CopyProgress';
import PathTree, { buildPathTree } from './PathTree';
import CopyResultView from './CopyResultView';
import CopyActionFooter from './CopyActionFooter';

interface CopySummaryPageProps {
    userName: string;
    selectedItems: FileItem[];
    onExcludeFile: (path: string) => void;
    onBack: () => void;
    onDone: () => void;
}

export default function CopySummaryPage({ userName, selectedItems, onExcludeFile, onBack, onDone }: CopySummaryPageProps) {
    const [folderSizes, setFolderSizes] = useState<Record<string, number>>({});
    const pathTree = buildPathTree(selectedItems);

    const {
        copyState, copyPhase,
        copyError, setCopyError,
        copyStartTime, currentFile,
        totalFiles, totalBytes,
        totalProcessed, totalFailed,
        bytesCopied, currentFileBytes, currentFileTotal,
        failedFiles,
        handleCopy, handleRetry
    } = useCopyOperation(userName, selectedItems);

    return (
        <div className="summary-layout">
            <div className="glass-panel summary-container">
                <SummaryHeader
                    userName={userName}
                    copyState={copyState}
                    copyPhase={copyPhase}
                    onBack={onBack}
                    onDone={onDone}
                />

                <CopyProgress
                    copyState={copyState}
                    copyPhase={copyPhase}
                    totalFiles={totalFiles}
                    totalBytes={totalBytes}
                    totalProcessed={totalProcessed}
                    totalFailed={totalFailed}
                    bytesCopied={bytesCopied}
                    currentFileBytes={currentFileBytes}
                    currentFileTotal={currentFileTotal}
                    currentFile={currentFile}
                    copyStartTime={copyStartTime}
                />

                {copyError && (
                    <ErrorBanner message={copyError} onDismiss={() => setCopyError(null)} />
                )}

                <div className="summary-file-list">
                    {copyState === 'preview' ? (
                        <>
                            <div className="summary-list-header">
                                <span className="col-status"></span>
                                <span className="col-icon"></span>
                                <span className="col-name">Name</span>
                                <span className="col-size">Size</span>
                            </div>
                            <PathTree
                                tree={pathTree}
                                onExclude={onExcludeFile}
                                folderSizes={folderSizes}
                                setFolderSizes={setFolderSizes}
                            />
                        </>
                    ) : (
                        <div style={{ padding: '20px' }}>
                            <CopyResultView
                                copyState={copyState}
                                totalProcessed={totalProcessed}
                                totalFailed={totalFailed}
                                currentFile={currentFile}
                                failedFiles={failedFiles}
                                onRetry={handleRetry}
                            />
                        </div>
                    )}
                </div>

                {copyState === 'preview' && (
                    <CopyActionFooter
                        selectedCount={selectedItems.length}
                        onCopy={handleCopy}
                    />
                )}
            </div>
        </div>
    );
}
