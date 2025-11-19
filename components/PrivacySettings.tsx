
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Icon } from './common/Icon';
import { getAllAppData } from '../utils/storage';

// FIX: Renamed local `PermissionName` to `AppPermissionName` to avoid a name collision with the global `PermissionName` type.
type AppPermissionName = 'microphone' | 'camera' | 'geolocation';
type PermissionState = PermissionStatus['state'];

interface PermissionStatusMap {
    microphone: PermissionState;
    camera: PermissionState;
    geolocation: PermissionState;
}

interface PrivacySettingsProps {
    onClearAllData: () => void;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ onClearAllData }) => {
    const { t } = useTranslation();
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatusMap | null>(null);

    const checkPermissions = async () => {
        if ('permissions' in navigator) {
            const names: AppPermissionName[] = ['microphone', 'camera', 'geolocation'];
            const statuses: PermissionStatusMap = { microphone: 'prompt', camera: 'prompt', geolocation: 'prompt' };
            
            for (const name of names) {
                try {
                    // FIX: The `as any` cast is necessary because the global `PermissionName` type from TypeScript's
                    // DOM library may not include all modern permission names like 'camera' or 'microphone'.
                    const result = await navigator.permissions.query({ name: name as any });
                    statuses[name] = result.state;
                } catch (err) {
                    console.warn(`Could not query permission for ${name}:`, err);
                    // For some browsers/permissions (like camera/mic on Firefox without a prompt first), query might fail.
                    // We can infer a 'prompt' state.
                    statuses[name] = 'prompt';
                }
            }
            setPermissionStatus(statuses);
        }
    };
    
    useEffect(() => {
        checkPermissions();
    }, []);

    const handleClearData = () => {
        if (window.confirm(t('privacySettings.clear_data_confirm'))) {
            onClearAllData();
        }
    };

    const handleBackup = async () => {
        const data = getAllAppData();
        const fileName = `mypoint_backup_${new Date().toISOString().split('T')[0]}.json`;
        const file = new File([JSON.stringify(data, null, 2)], fileName, { type: 'application/json' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Kopia Zapasowa MyPoint',
                    text: 'Zapisz ten plik na swoim Dysku Google, aby zachować dane.',
                });
                alert(t('privacySettings.backup_success'));
            } catch (error) {
                console.error('Error sharing', error);
            }
        } else {
            // Fallback download for desktop
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
            alert(t('privacySettings.backup_success'));
        }
    };

    const handleRequestPermissions = async () => {
        try {
            // Request camera and microphone
            await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } catch (err) {
            console.error("Error requesting media permissions:", err);
        }
        try {
            // Request geolocation
            navigator.geolocation.getCurrentPosition(() => {}, () => {});
        } catch (err) {
            console.error("Error requesting geolocation:", err);
        }
        // Re-check statuses after a short delay to allow prompts to resolve
        setTimeout(checkPermissions, 2000);
    };

    const PermissionRow: React.FC<{ name: AppPermissionName }> = ({ name }) => {
        const status = permissionStatus ? permissionStatus[name] : 'prompt';
        
        const statusInfo = {
            granted: { text: t('privacySettings.status_granted'), color: 'text-teal-600 bg-teal-100', icon: 'shield-check' as const },
            denied: { text: t('privacySettings.status_denied'), color: 'text-red-600 bg-red-100', icon: 'shield-exclamation' as const },
            prompt: { text: t('privacySettings.status_prompt'), color: 'text-amber-600 bg-amber-100', icon: 'shield-exclamation' as const }
        };
        
        return (
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className={`p-2 rounded-full ${statusInfo[status].color}`}>
                    <Icon name={statusInfo[status].icon} />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-slate-800">{t(`privacySettings.permission_${name}`)}</p>
                    <p className="text-sm text-slate-500">{t(`privacySettings.permission_${name}_reason`)}</p>
                </div>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusInfo[status].color}`}>
                    {statusInfo[status].text}
                </span>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('privacySettings.title')}</h2>
            <p className="text-slate-500 mb-8">{t('privacySettings.description')}</p>

            <div className="space-y-8">
                {/* Cloud Backup (New) */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-2">{t('privacySettings.backup_title')}</h3>
                    <p className="text-sm text-slate-600 mb-4">{t('privacySettings.backup_description')}</p>
                    <button 
                        onClick={handleBackup}
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                        <Icon name="cloud_upload" />
                        {t('privacySettings.backup_button')}
                    </button>
                </div>

                {/* Data Management */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-2">{t('privacySettings.data_management_title')}</h3>
                    <p className="text-sm text-slate-600 mb-4">{t('privacySettings.data_management_description')}</p>
                    <button 
                        onClick={handleClearData}
                        className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                        <Icon name="trash" />
                        {t('privacySettings.clear_data_button')}
                    </button>
                </div>

                {/* Permissions Management */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="text-lg font-bold text-sky-700 mb-2">{t('privacySettings.permissions_management_title')}</h3>
                    <p className="text-sm text-slate-500 mb-4">{t('privacySettings.permissions_management_description')}</p>
                    <div className="space-y-4">
                        {permissionStatus ? (
                            <>
                                <PermissionRow name="microphone" />
                                <PermissionRow name="camera" />
                                <PermissionRow name="geolocation" />
                            </>
                        ) : (
                            <div className="flex items-center justify-center p-4 text-slate-500">
                                <svg className="animate-spin h-5 w-5 mr-3 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                {t('privacySettings.status_checking')}
                            </div>
                        )}
                    </div>
                    {(permissionStatus?.microphone === 'denied' || permissionStatus?.camera === 'denied' || permissionStatus?.geolocation === 'denied') && (
                        <p className="text-amber-600 bg-amber-100 p-3 rounded-lg text-sm mt-4">
                            {t('privacySettings.denied_permissions_info')}
                        </p>
                    )}
                    {(permissionStatus?.microphone === 'prompt' || permissionStatus?.camera === 'prompt' || permissionStatus?.geolocation === 'prompt') && (
                        <button 
                            onClick={handleRequestPermissions}
                            className="w-full bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-700 transition flex items-center justify-center gap-2 mt-4"
                        >
                            {t('privacySettings.request_permissions_button')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrivacySettings;
