interface ProgressBarProps {
    percent?: number;
    indeterminate?: boolean;
}

export default function ProgressBar({ percent = 0, indeterminate = false }: ProgressBarProps) {
    return (
        <div className="copy-progress-bar">
            {indeterminate ? (
                <div className="copy-progress-fill" style={{
                    width: '100%',
                    animation: 'progress-indeterminate 1.5s ease-in-out infinite',
                }} />
            ) : (
                <div className="copy-progress-fill" style={{
                    width: `${Math.min(percent, 100)}%`,
                    transition: 'width 0.3s ease',
                }} />
            )}
        </div>
    );
}
