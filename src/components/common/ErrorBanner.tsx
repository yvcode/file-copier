import { AlertTriangle } from 'lucide-react';

interface ErrorBannerProps {
    message: string;
    onDismiss?: () => void;
    onRetry?: () => void;
    variant?: 'error' | 'warning';
}

export default function ErrorBanner({ message, onDismiss, onRetry, variant = 'error' }: ErrorBannerProps) {
    const isError = variant === 'error';
    const color = isError ? '#ef4444' : '#f59e0b';
    const bg = isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';

    return (
        <div style={{
            padding: '12px 16px',
            backgroundColor: bg,
            border: `1px solid ${color}`,
            borderRadius: '8px',
            color: color,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
        }}>
            <AlertTriangle size={18} />
            <span style={{ flex: 1 }}>{message}</span>
            {onRetry && (
                <button onClick={onRetry} style={{
                    background: 'none', border: `1px solid ${color}`,
                    color, borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem'
                }}>Retry</button>
            )}
            {onDismiss && (
                <button onClick={onDismiss} style={{
                    background: 'none', border: `1px solid ${color}`,
                    color, borderRadius: '4px', padding: '4px 10px', cursor: 'pointer'
                }}>✕</button>
            )}
        </div>
    );
}
