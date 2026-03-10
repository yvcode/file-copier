import React from 'react';
import type { FileItem } from '../../types';
import FileCard from './FileCard';

interface FileGridProps {
    items: FileItem[];
    isSelected: (path: string, isDirectory: boolean) => boolean;
    onToggle: (item: FileItem, e: React.MouseEvent) => void;
    onCardClick: (item: FileItem, e: React.MouseEvent) => void;
    hasError?: boolean;
}

export default function FileGrid({ items, isSelected, onToggle, onCardClick, hasError }: FileGridProps) {
    return (
        <div className="items-grid">
            {items.map(item => (
                <FileCard
                    key={item.path}
                    item={item}
                    selected={isSelected(item.path, item.isDirectory)}
                    onToggle={onToggle}
                    onClick={onCardClick}
                />
            ))}
            {items.length === 0 && !hasError && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                    This folder is empty.
                </div>
            )}
        </div>
    );
}
