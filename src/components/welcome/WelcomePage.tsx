
import { ArrowRight, FolderOpen } from 'lucide-react';

interface WelcomePageProps {
    userName: string;
    setUserName: (val: string) => void;
    onNext: () => void;
}

export default function WelcomePage({ userName, setUserName, onNext }: WelcomePageProps) {
    return (
        <div className="welcome-container">
            <div className="glass-panel welcome-card">
                <div className="icon-wrapper">
                    <FolderOpen size={48} />
                </div>
                <div>
                    <h1 className="title">File Copier</h1>
                    <p className="subtitle">Enter your name to begin exploring files.</p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (userName.trim()) onNext();
                    }}
                    className="input-group"
                >
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Your Name..."
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="btn"
                        disabled={!userName.trim()}
                    >
                        Start Exploring
                        <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
