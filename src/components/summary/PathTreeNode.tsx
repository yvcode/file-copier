import { useState } from 'react';
import { Folder, File, ChevronRight, X } from 'lucide-react';
import type { TreeNode } from '../../types';
import { formatSize } from '../../utils/format';
import { getSortedChildren } from './PathTree';

interface PathTreeNodeProps {
    node: TreeNode;
    indent: number;
    onExclude: (path: string) => void;
    folderSizes: Record<string, number>;
    setFolderSizes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export default function PathTreeNode({ node, indent, onExclude, folderSizes, setFolderSizes }: PathTreeNodeProps) {
    const [expanded, setExpanded] = useState(true);

    // ── Leaf node (selected file or folder) ──
    if (node.isLeaf && node.item) {
        const item = node.item;

        if (item.isDirectory) {
            // Under flat file architecture, directories normally shouldn't be leaves,
            // but if an EMPTY directory was explicitly selected, we just render it.

            return (
                <div>
                    <div
                        className="summary-file-row"
                        style={{ paddingLeft: `${16 + indent * 20}px` }}
                    >
                        <span className="col-status">
                            <button
                                className="summary-remove-btn"
                                onClick={(e) => { e.stopPropagation(); onExclude(item.path); }}
                                title="Remove from copy"
                            >
                                <X size={14} />
                            </button>
                        </span>
                        <span className="col-icon">
                            <Folder size={18} fill="#fbbf24" color="#fbbf24" opacity={0.8} />
                        </span>
                        <span className="col-name" title={item.path}>
                            {item.name}
                            <span style={{ color: 'var(--accent)', marginLeft: '6px', fontSize: '0.75rem' }}>● Empty Folder explicitly selected</span>
                        </span>
                        <span className="col-size"></span>
                    </div>
                </div>
            );
        }

        // File leaf
        return (
            <div className="summary-file-row" style={{ paddingLeft: `${16 + indent * 20}px` }}>
                <span className="col-status">
                    <button className="summary-remove-btn" onClick={() => onExclude(item.path)} title="Remove from copy">
                        <X size={14} />
                    </button>
                </span>
                <span className="col-icon"><File size={18} color="#94a3b8" /></span>
                <span className="col-name" title={item.path}>{item.name}</span>
                <span className="col-size">{formatSize(item.size)}</span>
            </div>
        );
    }

    // ── Intermediate ancestor directory node ──
    return (
        <div>
            <div
                className={`summary-file-row summary-tree-dir ${expanded ? 'row-expanded' : ''}`}
                style={{ paddingLeft: `${16 + indent * 20}px`, cursor: 'pointer' }}
                onClick={() => setExpanded(p => !p)}
            >
                <span className="col-status"></span>
                <span className="col-icon">
                    <Folder size={18} fill="#64748b" color="#64748b" opacity={0.5} />
                </span>
                <span className="col-name">
                    <ChevronRight size={12} style={{
                        display: 'inline-block', marginRight: '4px',
                        transition: 'transform 0.2s',
                        transform: expanded ? 'rotate(90deg)' : 'none',
                        verticalAlign: 'middle'
                    }} />
                    {node.name.endsWith(':') ? node.name + '\\' : node.name}
                </span>
                <span className="col-size"></span>
            </div>
            {expanded && getSortedChildren(node).map(child => (
                <PathTreeNode
                    key={child.fullPath}
                    node={child}
                    indent={indent + 1}
                    onExclude={onExclude}
                    folderSizes={folderSizes}
                    setFolderSizes={setFolderSizes}
                />
            ))}
        </div>
    );
}
