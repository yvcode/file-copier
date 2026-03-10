import { useState, useEffect } from 'react';

export function useDrives() {
    const [drives, setDrives] = useState<string[]>([]);
    const [envError, setEnvError] = useState<string | null>(null);
    const [initialDriveLoaded, setInitialDriveLoaded] = useState(false);

    useEffect(() => {
        if (!(window as any).ipcRenderer) {
            const isBrowser = !window.navigator.userAgent.includes('Electron');
            setEnvError(isBrowser
                ? 'You are running in a standard web browser. Please run the application using Electron.'
                : 'Electron API missing. The preload script may have failed to load.');
            setInitialDriveLoaded(true);
            return;
        }

        let isMounted = true;
        let lastDrivesStr = '';

        const fetchDrives = async () => {
            try {
                const res: string[] = await (window as any).ipcRenderer.getDrives();

                // Filter out the C drive (assuming format 'C:\' or similar)
                const filteredDrives = res.filter(d => !d.toUpperCase().startsWith('C:'));

                const drivesStr = JSON.stringify(filteredDrives);

                if (isMounted && drivesStr !== lastDrivesStr) {
                    lastDrivesStr = drivesStr;
                    setDrives(filteredDrives);
                    setEnvError(null);
                    setInitialDriveLoaded(true);
                }
            } catch (err: any) {
                console.error('Failed to get drives:', err);
                if (isMounted) {
                    setEnvError('Failed to communicate with the system drives. The drive may be disconnected or unresponsive.');
                    setInitialDriveLoaded(true);
                }
            }
        };

        fetchDrives();
        const intervalId = setInterval(fetchDrives, 2000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return { drives, envError, initialDriveLoaded };
}
