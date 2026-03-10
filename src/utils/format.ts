// Shared formatting utilities

export function formatSize(bytes: number): string {
    if (bytes === 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatCount(n: number): string {
    if (n < 1000) return String(n);
    if (n < 1_000_000) return (n / 1000).toFixed(1) + 'K';
    return (n / 1_000_000).toFixed(2) + 'M';
}

export function formatEta(secs: number): string {
    if (secs <= 0 || !isFinite(secs)) return '—';
    if (secs < 60) return `${Math.ceil(secs)}s`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ${Math.ceil(secs % 60)}s`;
    const h = Math.floor(secs / 3600);
    const m = Math.ceil((secs % 3600) / 60);
    return `${h}h ${m}m`;
}
