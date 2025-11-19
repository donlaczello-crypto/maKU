
import { AppRole, ABCEvent, JournalEntry, ConversationReport, ChildProfile, PairingConfig, UserSubscription } from '../types';

// Safe wrapper for localStorage to prevent app crashes due to QuotaExceededError or corrupted JSON.

export const storageKeys = {
    APP_ROLE: 'mypoint_appRole',
    PAIRING_CONFIG: 'mypoint_pairingConfig',
    ABC_EVENTS: 'mypoint_abcEvents',
    JOURNAL_ENTRIES: 'mypoint_journalEntries',
    CONVERSATION_REPORTS: 'mypoint_conversationReports',
    CHILD_PROFILES: 'mypoint_childProfiles',
    STICKERS: 'mypoint_stickers',
    LAST_EARNED_DATE: 'mypoint_lastEarnedDate',
    PRINT_HISTORY: 'mypoint_printHistory',
    FAMILY_ACTIVITY: 'mypoint_familyActivity',
    USER_SUBSCRIPTION: 'mypoint_userSubscription' // NEW
};

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error loading ${key} from localStorage. Returning default value.`, error);
    return defaultValue;
  }
}

export function saveToLocalStorage<T>(key: string, value: T): boolean {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.error(`CRITICAL: LocalStorage limit reached for ${key}. Data was NOT saved.`);
        alert("Uwaga: Pamięć przeglądarki jest pełna. Nowe dane (zwłaszcza zdjęcia/nagrania) mogą nie zostać zapisane. Wyczyść stare dane w Ustawieniach.");
        return false;
    }
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
}

export function clearAllAppData() {
    try {
        localStorage.clear();
        // Force reload to reset state
        window.location.reload();
    } catch (e) {
        console.error("Failed to clear data", e);
        alert("Wystąpił błąd podczas czyszczenia danych.");
    }
}

export function getAllAppData(): Record<string, any> {
    const data: Record<string, any> = {};
    data['exportDate'] = new Date().toISOString();
    data['appVersion'] = '1.0.0';
    
    Object.entries(storageKeys).forEach(([key, storageKey]) => {
        data[key] = loadFromLocalStorage(storageKey, null);
    });
    
    return data;
}
