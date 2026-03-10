import React from 'react';
import { Folder, File, Check } from 'lucide-react';
import type { FileItem } from '../../types';
import { formatSize } from '../../utils/format';

interface FileCardProps {
    item: FileItem;
    selected: boolean;
    onToggle: (item: FileItem, e: React.MouseEvent) => void;
    onClick: (item: FileItem, e: React.MouseEvent) => void;
}

export default function FileCard({ item, selected, onToggle, onClick }: FileCardProps) {
    return (
        <div
            className={`item-card ${item.isDirectory ? 'folder' : 'file'} ${selected ? 'selected' : ''}`}
            onClick={(e) => onClick(item, e)}
            title={item.isDirectory ? `${item.name} (click to open, checkbox to select)` : item.name}
        >
            <div
                className="item-checkbox"
                onClick={(e) => onToggle(item, e)}
            >
                {selected && <Check size={14} />}
            </div>
            <div className="item-icon">
                {item.isDirectory
                    ? <Folder size={40} fill="currentColor" opacity={0.8} />
                    : <File size={40} />
                }
            </div>
            <span className="item-name">{item.name}</span>
            {!item.isDirectory && (
                <span className="item-size">{formatSize(item.size)}</span>
            )}
        </div>
    );
}
