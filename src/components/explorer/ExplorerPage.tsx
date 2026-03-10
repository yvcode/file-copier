import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { FileItem } from '../../types';
import DrivesSidebar from './DrivesSidebar';
import FileGrid from './FileGrid';
import ExplorerHeader from './ExplorerHeader';
import ExplorerFooter from './ExplorerFooter';
import ErrorBanner from '../common/ErrorBanner';

import { useDrives } from '../../hooks/useDrives';
import { useDirectoryReader } from '../../hooks/useDirectoryReader';
import { useSelection } from '../../hooks/useSelection';

interface ExplorerPageProps {
    userName: string;
    onBack: () => void;
    onCopy: () => void;
    selectedPaths: Set<string>;
    setSelectedPaths: (paths: Set<string>) => void;
    onItemsLoaded: (items: FileItem[]) => void;
}

export default function ExplorerPage({
    userName, onBack, onCopy,
    selectedPaths, setSelectedPaths, onItemsLoaded
}: ExplorerPageProps) {

    const { drives, envError, initialDriveLoaded } = useDrives();

    const {
        currentPath, setCurrentPath,
        items, loading, dirError,
        navigateUp, retryCurrentDirectory
    } = useDirectoryReader(onItemsLoaded);

    const { actionError, setActionError, toggleSelection, isSelected } = useSelection(
        selectedPaths, setSelectedPaths, onItemsLoaded
    );

    // Set initial drive when loaded or handle drive disconnects
    useEffect(() => {
        if (!initialDriveLoaded) return;

        if (drives.length === 0) {
            if (currentPath) setCurrentPath('');
        } else {
            if (!currentPath) {
                setCurrentPath(drives[0]);
            } else if (!drives.some(d => currentPath.startsWith(d))) {
                // The drive we were on just got disconnected!
                setCurrentPath(drives[0]);
            }
        }
    }, [initialDriveLoaded, drives, currentPath, setCurrentPath]);

    const handleCardClick = (item: FileItem, e: React.MouseEvent) => {
        if (item.isDirectory) setCurrentPath(item.path);
        else toggleSelection(item, e);
    };

    return (
        <div className="explorer-layout">
            <DrivesSidebar
                drives={drives}
                currentPath={currentPath}
                onSelectDrive={setCurrentPath}
                onBack={onBack}
            />

            <div className="glass-panel main-content">
                <ExplorerHeader currentPath={currentPath} onNavigateUp={navigateUp} />

                {envError && <div style={{ margin: '20px' }}><ErrorBanner message={envError} /></div>}

                {dirError && (
                    <div style={{ margin: '12px 20px' }}>
                        <ErrorBanner message={dirError} onRetry={retryCurrentDirectory} />
                    </div>
                )}

                {actionError && (
                    <div style={{ margin: '8px 20px' }}>
                        <ErrorBanner
                            message={actionError}
                            variant="warning"
                            onDismiss={() => setActionError(null)}
                        />
                    </div>
                )}

                {drives.length === 0 && initialDriveLoaded ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Loader2 size={48} style={{ animation: 'spin 2s linear infinite', marginBottom: '16px', color: 'var(--accent)', opacity: 0.5 }} />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 500 }}>Waiting for device connection...</h2>
                        <p style={{ marginTop: '8px', opacity: 0.8 }}>Please insert a USB drive or external storage.</p>
                    </div>
                ) : loading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                    </div>
                ) : (
                    <FileGrid
                        items={items}
                        isSelected={isSelected}
                        onToggle={toggleSelection}
                        onCardClick={handleCardClick}
                        hasError={!!dirError}
                    />
                )}

                <ExplorerFooter
                    selectedCount={selectedPaths.size}
                    userName={userName}
                    onCopy={onCopy}
                />
            </div>
        </div>
    );
}
