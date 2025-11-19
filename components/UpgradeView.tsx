
import React, { useState } from 'react';
import { View, UserSubscription, PremiumFeature } from '../types';
import { Icon } from './common/Icon';
import { useTranslation } from '../hooks/useTranslation';
import { saveToLocalStorage, storageKeys } from '../utils/storage';

interface UpgradeViewProps {
    setView: (view: View) => void;
    currentSubscription: UserSubscription;
    onUpgrade: (sub: UserSubscription) => void;
}

const UpgradeView: React.FC<UpgradeViewProps> = ({ setView, currentSubscription, onUpgrade }) => {
    const { t } = useTranslation();
    const [rodoAccepted, setRodoAccepted] = useState(false);
    const [activeTab, setActiveTab] = useState<'subscription' | 'features'>('subscription');

    // Cennik (PLN) - uwzględnia promocję 50%
    const PRICING = {
        SUBSCRIPTION: { OLD: "49.99", NEW: "24.99" },
        ONE_TIME: { OLD: "59.99", NEW: "29.99" },
        FEATURE_AI: { OLD: "29.99", NEW: "14.99" },
        FEATURE_STD: { OLD: "19.99", NEW: "9.99" }
    };

    const handleActivateTrial = () => {
        if (currentSubscription.hasUsedTrial) {
            alert("Przykro nam, darmowy okres próbny został już wykorzystany na tym urządzeniu.");
            return;
        }

        if (!rodoAccepted) {
             alert("Wymagana zgoda: Aby aktywować okres próbny, musisz zaakceptować Regulamin i zgodę na natychmiastowy dostęp.");
             return;
        }

        const confirmMsg = "Czy chcesz aktywować 3-dniowy darmowy okres próbny? Uzyskasz natychmiastowy dostęp do WSZYSTKICH funkcji Premium.";
        
        if (window.confirm(confirmMsg)) {
            const now = new Date();
            const expiry = new Date(now);
            expiry.setDate(now.getDate() + 3); // Add 3 days

            const newSub: UserSubscription = {
                ...currentSubscription,
                isSubscribed: true,
                planType: 'trial',
                expiryDate: expiry.toISOString(),
                hasUsedTrial: true
            };
            
            saveToLocalStorage(storageKeys.USER_SUBSCRIPTION, newSub);
            onUpgrade(newSub);
            
            alert("Sukces! Okres próbny został aktywowany. Masz pełny dostęp przez 3 dni.");
            setView(View.Dashboard);
        }
    };

    const handlePurchase = (type: 'monthly' | 'one_time' | 'feature', feature?: PremiumFeature, price?: string) => {
        if (!rodoAccepted) {
            alert("Aby dokonać zakupu, musisz zaakceptować zgody RODO i oświadczenie o utracie prawa do odstąpienia od umowy.");
            return;
        }

        // Simulation of Payment Gateway interaction
        const itemName = type === 'feature' ? `funkcję ${feature}` : 'subskrypcję';
        const cost = price || (type === 'monthly' ? PRICING.SUBSCRIPTION.NEW : PRICING.ONE_TIME.NEW);

        const confirmMsg = `Potwierdź zakup: ${itemName} za ${cost} zł.\n(Symulacja płatności - środki nie zostaną pobrane)`;

        if (window.confirm(confirmMsg)) {
            // Simulate success
            const newSub = { ...currentSubscription };
            const now = new Date();
            
            if (type === 'monthly') {
                newSub.isSubscribed = true;
                newSub.planType = 'monthly';
                newSub.expiryDate = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
            } else if (type === 'one_time') {
                // Access for 30 days
                newSub.isSubscribed = true;
                newSub.planType = 'one_time';
                newSub.expiryDate = new Date(now.setDate(now.getDate() + 30)).toISOString();
            } else if (type === 'feature' && feature) {
                if (!newSub.unlockedFeatures.includes(feature)) {
                    newSub.unlockedFeatures.push(feature);
                }
            }

            saveToLocalStorage(storageKeys.USER_SUBSCRIPTION, newSub);
            onUpgrade(newSub);
            alert("Zakup zakończony sukcesem! Dziękujemy za wsparcie.");
            setView(View.Dashboard);
        }
    };

    const FeatureItem = ({ feature, priceOld, priceNew, name, description }: { feature: PremiumFeature, priceOld: string, priceNew: string, name: string, description: string }) => {
        const isUnlocked = currentSubscription.unlockedFeatures.includes(feature) || currentSubscription.isSubscribed;
        return (
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow gap-4">
                <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-2">
                        {name}
                        {isUnlocked && <Icon name="shield-check" className="w-4 h-4 text-green-500" />}
                    </h4>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
                <div className="text-right">
                    {isUnlocked ? (
                        <span className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">
                            Odblokowane
                        </span>
                    ) : (
                        <button 
                            onClick={() => handlePurchase('feature', feature, priceNew)}
                            className="bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 px-4 py-2 rounded-lg font-bold text-sm transition whitespace-nowrap"
                        >
                            Kup za {priceNew} zł <span className="text-slate-400 line-through text-xs ml-1">{priceOld} zł</span>
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen pb-24">
            {/* PROMO BANNER */}
            <div className="bg-gradient-to-r from-rose-600 to-orange-500 text-white p-6 rounded-2xl shadow-lg mb-8 text-center relative overflow-hidden animate-fade-in">
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider mb-2">Promocja Startowa -50%</h1>
                    <p className="text-lg font-medium opacity-90">Wszystkie funkcje Premium teraz za połowę ceny!</p>
                </div>
            </div>

            {/* TRIAL BANNER - ONLY IF NOT USED */}
            {!currentSubscription.isSubscribed && !currentSubscription.hasUsedTrial && (
                <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-yellow-400 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-yellow-400 text-indigo-900 text-xs font-bold px-3 py-1">DARMOWE 3 DNI</div>
                    <div className="flex items-center gap-4 z-10">
                        <div className="p-3 bg-indigo-800 rounded-full border border-indigo-600">
                             <Icon name="star" className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-2xl text-yellow-300">Przetestuj Pełną Wersję</h3>
                            <p className="text-indigo-100">Aktywuj 3-dniowy okres próbny. Zero ryzyka, dostęp do wszystkich funkcji.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleActivateTrial}
                        className="bg-yellow-400 text-indigo-900 px-8 py-3 rounded-xl font-black shadow-lg hover:bg-yellow-300 transition transform hover:scale-105 z-10"
                    >
                        ROZPOCZNIJ TESTY
                    </button>
                </div>
            )}

            {/* TABS */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('subscription')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'subscription' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pełny Dostęp
                    </button>
                    <button 
                        onClick={() => setActiveTab('features')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'features' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pojedyncze Funkcje
                    </button>
                </div>
            </div>

            {activeTab === 'subscription' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* SUBSCRIPTION CARD */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-sky-500 shadow-xl relative overflow-hidden flex flex-col transform hover:scale-[1.02] transition-transform duration-300">
                        <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">NAJLEPSZA WARTOŚĆ</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Subskrypcja Premium</h3>
                        <p className="text-slate-500 text-sm mb-4">Pełen dostęp do wszystkich funkcji AI, wideo i analiz.</p>
                        <div className="mb-6">
                            <span className="text-slate-400 line-through text-lg">{PRICING.SUBSCRIPTION.OLD} zł</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-sky-600">{PRICING.SUBSCRIPTION.NEW} zł</span>
                                <span className="text-slate-600 font-medium">/ mies.</span>
                            </div>
                            <p className="text-xs text-green-600 font-bold mt-1 bg-green-100 inline-block px-2 py-0.5 rounded">Oszczędzasz 50%</p>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-600 mb-6 flex-1">
                            <li className="flex items-center gap-2"><Icon name="star" className="w-4 h-4 text-amber-400" /> Wszystkie funkcje AI odblokowane</li>
                            <li className="flex items-center gap-2"><Icon name="video_library" className="w-4 h-4 text-sky-400" /> Generator Wideo Veo</li>
                            <li className="flex items-center gap-2"><Icon name="shield-check" className="w-4 h-4 text-green-400" /> Anuluj w dowolnym momencie</li>
                        </ul>
                        <button 
                            onClick={() => handlePurchase('monthly')}
                            disabled={currentSubscription.isSubscribed && currentSubscription.planType === 'monthly'}
                            className="w-full bg-sky-600 text-white py-3 rounded-xl font-bold hover:bg-sky-700 transition disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-lg shadow-sky-200"
                        >
                            {currentSubscription.isSubscribed && currentSubscription.planType === 'monthly' ? 'Aktywna' : 'Wybierz Subskrypcję'}
                        </button>
                    </div>

                    {/* ONE TIME PASS CARD */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg flex flex-col hover:border-slate-300 transition-colors">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Przepustka na 30 Dni</h3>
                        <p className="text-slate-500 text-sm mb-4">Jednorazowa płatność za miesiąc dostępu. Bez zobowiązań.</p>
                        <div className="mb-6">
                            <span className="text-slate-400 line-through text-lg">{PRICING.ONE_TIME.OLD} zł</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-800">{PRICING.ONE_TIME.NEW} zł</span>
                                <span className="text-slate-600 font-medium">/ 30 dni</span>
                            </div>
                        </div>
                         <ul className="space-y-2 text-sm text-slate-600 mb-6 flex-1">
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Dostęp do wszystkich funkcji</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Płatność jednorazowa</li>
                            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Brak automatycznego odnawiania</li>
                        </ul>
                         <button 
                            onClick={() => handlePurchase('one_time')}
                            disabled={currentSubscription.isSubscribed}
                            className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            Kup Przepustkę
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'features' && (
                <div className="space-y-4 mb-8">
                    <h3 className="font-bold text-slate-700 mb-2 px-1 flex items-center gap-2">
                        <Icon name="settings" className="w-5 h-5" />
                        Sklep z modułami (Rabat -50%)
                    </h3>
                    <FeatureItem 
                        feature={PremiumFeature.AI_Assistant} 
                        name="Asystent AI (Gemini Kids)" 
                        description="Nielimitowane rozmowy głosowe, personalizacja profilu, Tłumacz Mowy."
                        priceOld={PRICING.FEATURE_AI.OLD}
                        priceNew={PRICING.FEATURE_AI.NEW}
                    />
                    <FeatureItem 
                        feature={PremiumFeature.Video_Analysis} 
                        name="Studio Wideo (Veo)" 
                        description="Analiza nagrań wideo i generowanie filmów z tekstu."
                        priceOld={PRICING.FEATURE_STD.OLD}
                        priceNew={PRICING.FEATURE_STD.NEW}
                    />
                    <FeatureItem 
                        feature={PremiumFeature.Deep_Analytics} 
                        name="Analityka i Predykcja" 
                        description="System wczesnego ostrzegania, wykrywanie wzorców, proaktywny planer."
                        priceOld={PRICING.FEATURE_STD.OLD}
                        priceNew={PRICING.FEATURE_STD.NEW}
                    />
                    <FeatureItem 
                        feature={PremiumFeature.Creative_Tools} 
                        name="Narzędzia Kreatywne" 
                        description="Tłumacz rysunków, edytor obrazów AI."
                        priceOld={PRICING.FEATURE_STD.OLD}
                        priceNew={PRICING.FEATURE_STD.NEW}
                    />
                     <FeatureItem 
                        feature={PremiumFeature.Remote_Access} 
                        name="Zdalny Monitoring (Pasywny)" 
                        description="Połączenie z telefonem dziecka, automatyczne alerty krytyczne (bez ciągłego nasłuchu)."
                        priceOld={PRICING.FEATURE_AI.OLD}
                        priceNew={PRICING.FEATURE_AI.NEW}
                    />
                </div>
            )}

            {/* LEGAL / RODO SECTION - MANDATORY */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs text-slate-500 mb-8">
                <h4 className="font-bold text-slate-700 mb-2 uppercase flex items-center gap-2">
                    <Icon name="shield-exclamation" className="w-4 h-4" />
                    Wymagane Zgody (RODO i Konsumenckie)
                </h4>
                <p className="mb-3 leading-relaxed">
                    Aplikacja dostarcza treści cyfrowe niezapisane na nośniku materialnym. Aby uzyskać natychmiastowy dostęp, wymagana jest zgoda poniżej.
                </p>
                <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-slate-200 hover:border-sky-400 transition shadow-sm">
                    <input 
                        type="checkbox" 
                        checked={rodoAccepted} 
                        onChange={e => setRodoAccepted(e.target.checked)}
                        className="mt-1 w-5 h-5 text-sky-600 rounded border-slate-300 focus:ring-sky-500" 
                    />
                    <span className="text-slate-700 text-sm">
                        <strong>Oświadczam, że zapoznałem/am się z Regulaminem.</strong><br/>
                        Wyrażam zgodę na rozpoczęcie świadczenia usługi (dostarczenie treści cyfrowych) przed upływem terminu do odstąpienia od umowy i przyjmuję do wiadomości, że w związku z tym <strong>tracę przysługujące mi prawo do odstąpienia od umowy</strong> (zgodnie z ustawą o prawach konsumenta).
                    </span>
                </label>
            </div>
            
            <button onClick={() => setView(View.Dashboard)} className="w-full text-center text-slate-400 hover:text-slate-600 text-sm font-semibold transition">
                Powrót do Panelu bez zakupu
            </button>
        </div>
    );
};

export default UpgradeView;
