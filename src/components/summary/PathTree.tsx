import type { FileItem, TreeNode } from '../../types';
import PathTreeNode from './PathTreeNode';

// Build a tree from selected items' full paths
export function buildPathTree(items: FileItem[]): TreeNode {
    const root: TreeNode = { name: '', fullPath: '', children: new Map(), isLeaf: false };
    for (const item of items) {
        const segments = item.path.split('\\').filter(Boolean);
        let current = root;
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const fullPath = segments.slice(0, i + 1).join('\\');
            const normalizedPath = i === 0 && seg.endsWith(':') ? seg + '\\' : fullPath;
            if (!current.children.has(seg)) {
                current.children.set(seg, { name: seg, fullPath: normalizedPath, children: new Map(), isLeaf: false });
            }
            current = current.children.get(seg)!;
            if (i === segments.length - 1) {
                current.isLeaf = true;
                current.item = item;
            }
        }
    }
    return root;
}

export function getSortedChildren(node: TreeNode): TreeNode[] {
    return Array.from(node.children.values()).sort((a, b) => {
        const aIsDir = a.isLeaf && a.item ? a.item.isDirectory : !a.isLeaf;
        const bIsDir = b.isLeaf && b.item ? b.item.isDirectory : !b.isLeaf;
        if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
}

interface PathTreeProps {
    tree: TreeNode;
    onExclude: (path: string) => void;
    folderSizes: Record<string, number>;
    setFolderSizes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export default function PathTree({ tree, onExclude, folderSizes, setFolderSizes }: PathTreeProps) {
    return (
        <>
            {getSortedChildren(tree).map(child => (
                <PathTreeNode
                    key={child.fullPath}
                    node={child}
                    indent={0}
                    onExclude={onExclude}
                    folderSizes={folderSizes}
                    setFolderSizes={setFolderSizes}
                />
            ))}
        </>
    );
}
