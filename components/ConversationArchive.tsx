
import React, { useState } from 'react';
import { ConversationReport, ChildProfile, AssistantPersona } from '../types';
import { summarizeConversationHistory } from '../services/geminiService';
// Fix: Changed to named import for Icon.
import { Icon } from './common/Icon';
import { useTranslation } from '../hooks/useTranslation';
import { renderMarkdownSafe } from '../utils/markdown';

// Helper to render markdown-like text to HTML
const ReportItem: React.FC<{ report: ConversationReport; childProfiles: ChildProfile[] }> = ({ report, childProfiles }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { t } = useTranslation();

    const childName = report.childProfileId 
        ? childProfiles.find(p => p.id === report.childProfileId)?.name || `ID: ${report.childProfileId}`
        : t('geminiKids.guest_mode_title');

    return (
        <div className="bg-slate-50 rounded-lg border border-slate-200">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-4 text-left flex justify-between items-center">
                <div>
                    <p className="font-bold text-slate-800">{t('conversationArchive.conversation_date', {date: new Date(report.date).toLocaleString('pl-PL')})}</p>
                    <p className="text-sm text-slate-500">
                        {t('conversationArchive.child_profile_label')}: {childName} | {t('conversationArchive.assistant_persona_label')}: {report.assistantPersona}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{report.summary}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isExpanded && (
                <div className="p-4 border-t border-slate-200 space-y-4">
                    <div>
                        <h4 className="font-semibold text-sky-700">{t('geminiKids.report_emotional_tone_title')}:</h4>
                        <p className="text-sm text-slate-600">{report.emotionalTone}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-sky-700">{t('geminiKids.report_key_themes_title')}:</h4>
                        <ul className="list-disc pl-5 text-sm text-slate-600">
                            {report.keyThemes.map((theme, i) => <li key={i}>{theme}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold text-teal-700">{t('geminiKids.report_positive_moments_title')}:</h4>
                        <ul className="list-disc pl-5 text-sm text-slate-600">
                            {report.positiveMoments.map((moment, i) => <li key={i}>{moment}</li>)}
                        </ul>
                    </div>
                    {report.potentialTriggers.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-amber-700">{t('geminiKids.report_potential_triggers_title')}:</h4>
                             <ul className="list-disc pl-5 text-sm text-slate-600">
                                {report.potentialTriggers.map((trigger, i) => <li key={i}>{trigger}</li>)}
                            </ul>
                        </div>
                    )}
                     <div>
                        <h4 className="font-semibold text-teal-700">{t('geminiKids.report_suggestions_title')}:</h4>
                        <ul className="list-disc pl-5 text-sm text-slate-600">
                            {report.suggestionsForCaregiver.map((sug, i) => <li key={i}>{sug}</li>)}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

interface ConversationArchiveProps {
    reports: ConversationReport[];
}

const ConversationArchive: React.FC<ConversationArchiveProps> = ({ reports }) => {
    const { t } = useTranslation();
    const [selectedChildProfileId, setSelectedChildProfileId] = useState<string | null>(null);
    const [overallSummary, setOverallSummary] = useState<string>('');
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [error, setError] = useState('');

    const [childProfiles, setChildProfiles] = useState<ChildProfile[]>(() => {
        const savedProfiles = localStorage.getItem('mypoint_childProfiles');
        return savedProfiles ? JSON.parse(savedProfiles) : [];
    });

    const handleGenerateSummary = async () => {
        const filteredReports = reports.filter(r => r.childProfileId === selectedChildProfileId);
        if (filteredReports.length < 2) {
            setError(t('conversationArchive.summary_min_reports_error'));
            return;
        }
        
        setIsLoadingSummary(true);
        setError('');
        setOverallSummary('');
        try {
            const summary = await summarizeConversationHistory(filteredReports);
            setOverallSummary(summary);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('conversationArchive.summary_generation_error'));
        } finally {
            setIsLoadingSummary(false);
        }
    };
    
    if (!selectedChildProfileId) {
        return (
            <div className="p-4 md:p-8 max-w-lg mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center">
                    <div className="mx-auto bg-sky-100 text-sky-600 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                        <Icon name="resources" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mt-4 mb-2">{t('conversationArchive.archive_title')}</h2>
                    <p className="text-slate-500 mb-6">{t('conversationArchive.select_profile_description')}</p>
                    <div className="space-y-3">
                        {childProfiles.length > 0 ? childProfiles.map(profile => (
                            <button key={profile.id} onClick={() => setSelectedChildProfileId(profile.id)} className="w-full text-left p-4 bg-slate-50 hover:bg-sky-100 rounded-lg transition border-2 border-transparent hover:border-sky-200">
                                <p className="font-bold text-lg text-slate-800">{profile.name} ({profile.age} {t('geminiKids.profile_age_unit')})</p>
                            </button>
                        )) : null}
                        <button onClick={() => setSelectedChildProfileId('guest')} className="w-full text-left p-4 bg-slate-50 hover:bg-sky-100 rounded-lg transition border-2 border-transparent hover:border-sky-200">
                            <p className="font-bold text-lg text-slate-800">{t('geminiKids.guest_mode_title')}</p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    const filteredReports = reports.filter(r => r.childProfileId === selectedChildProfileId || (selectedChildProfileId === 'guest' && r.childProfileId === null));

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-6 flex justify-between items-start">
                <div>
                     <h2 className="text-2xl font-bold text-slate-800">{t('conversationArchive.archive_title')}: {selectedChildProfileId === 'guest' ? t('geminiKids.guest_mode_title') : childProfiles.find(p => p.id === selectedChildProfileId)?.name}</h2>
                     <p className="text-slate-500">{t('conversationArchive.archive_subtitle')}</p>
                </div>
                <button onClick={() => setSelectedChildProfileId(null)} className="text-sm text-sky-600 hover:underline">{t('conversationArchive.change_profile_button')}</button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-8">
                <h3 className="text-lg font-bold text-sky-700">{t('conversationArchive.summary_section_title')}</h3>
                <p className="text-sm text-slate-500 my-2">{t('conversationArchive.summary_section_description')}</p>
                 <button 
                    onClick={handleGenerateSummary}
                    disabled={isLoadingSummary || filteredReports.length < 2}
                    className="w-full md:w-auto bg-sky-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-700 transition disabled:bg-slate-400 flex items-center justify-center"
                 >
                    {isLoadingSummary ? t('conversationArchive.generating_summary') : t('conversationArchive.generate_summary_button')}
                 </button>
            </div>
            
            {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm mb-6 text-center">{error}</p>}

            {isLoadingSummary && (
                <div className="text-center py-8">
                    <svg className="animate-spin h-8 w-8 text-sky-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-slate-500 mt-2">{t('conversationArchive.gemini_analyzing_history')}</p>
                </div>
            )}
            
            {overallSummary && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-sky-200 mb-8">
                    <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={renderMarkdownSafe(overallSummary)} />
                </div>
            )}

            <div>
                <h3 className="text-xl font-bold text-slate-700 mb-4">{t('conversationArchive.history_title')}</h3>
                 {filteredReports.length > 0 ? (
                    <div className="space-y-4">
                        {filteredReports.map(report => <ReportItem key={report.id} report={report} childProfiles={childProfiles} />)}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 py-8">{t('conversationArchive.no_saved_conversations')}</p>
                )}
            </div>
        </div>
    );
};

export default ConversationArchive;
