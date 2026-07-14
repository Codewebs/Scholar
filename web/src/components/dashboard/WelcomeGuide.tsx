import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    X,
    Sparkles,
    ChevronRight,
    Rocket,
    Target,
    ShieldCheck,
    LayoutDashboard,
    Settings,
    Globe,
    Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TourStep {
    target: string;
    title: string;
    content: string;
    icon: any;
}

const WelcomeGuide: React.FC = () => {
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [currentStep, setCurrentStep] = useState<number | null>(null);

    useEffect(() => {
        const hasSeenModal = localStorage.getItem(`welcome_modal_seen_${user?.id}`);
        if (!hasSeenModal && user?.role === 'ADMINISTRATEUR') {
            setShowModal(true);
        }
    }, [user]);

    const steps: TourStep[] = [
        {
            target: 'sidebar',
            title: 'Barre de Navigation',
            content: 'Accédez à tous les modules : Académique, Finance, Personnel et Administration.',
            icon: LayoutDashboard
        },
        {
            target: 'dashboard-grid',
            title: 'Tableau de Bord',
            content: 'Une vue d\'ensemble de votre activité avec des raccourcis vers les actions fréquentes.',
            icon: Target
        },
        {
            target: 'setup-widget',
            title: 'Assistant de Configuration',
            content: 'Ce widget vous guide étape par étape pour configurer votre école.',
            icon: Settings
        },
        {
            target: 'lang-switcher',
            title: 'Langues',
            content: 'Basculez entre le Français et l\'Anglais à tout moment ici.',
            icon: Globe
        },
        {
            target: 'connection-status',
            title: 'Statut de Connexion',
            content: 'Le témoin vert indique que vous êtes synchronisé avec le serveur central.',
            icon: Zap
        }
    ];

    const handleStartTour = () => {
        setShowModal(false);
        localStorage.setItem(`welcome_modal_seen_${user?.id}`, 'true');
        setCurrentStep(0);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        localStorage.setItem(`welcome_modal_seen_${user?.id}`, 'true');
    };

    const nextStep = () => {
        if (currentStep !== null && currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setCurrentStep(null);
        }
    };

    return (
        <>
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[48px] p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden border border-gray-100"
                        >
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-accent via-purple-500 to-accent"></div>

                            <button
                                onClick={handleCloseModal}
                                className="absolute top-8 right-8 p-3 hover:bg-gray-100 rounded-full transition-all"
                            ><X size={24}/></button>

                            <div className="mb-12">
                                <div className="w-20 h-20 bg-accent/10 rounded-[28px] flex items-center justify-center text-accent mb-8 shadow-inner">
                                    <Sparkles size={40} />
                                </div>
                                <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-tight mb-4">
                                    Bienvenue sur Scholar Pro, {user?.nom} !
                                </h2>
                                <p className="text-sm font-medium text-gray-500 leading-relaxed uppercase tracking-wide">
                                    Votre espace administrateur est prêt. Nous avons préparé un court guide pour vous aider à prendre vos marques et configurer votre établissement en un clin d'œil.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                <Feature icon={Rocket} title="Configuration Assistée" desc="Suivez le guide pour paramétrer vos classes et frais." />
                                <Feature icon={ShieldCheck} title="Sécurité Totale" desc="Vos données sont chiffrées et sauvegardées quotidiennement." />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleStartTour}
                                    className="flex-1 bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-accent transition-all shadow-xl hover:shadow-accent/20 flex items-center justify-center space-x-3 group"
                                >
                                    <span>Lancer le guide interactif</span>
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={handleCloseModal}
                                    className="flex-1 bg-gray-50 text-gray-400 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-100 hover:text-black transition-all"
                                >
                                    Découvrir par moi-même
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {currentStep !== null && (
                    <div className="fixed inset-0 z-[250] pointer-events-none">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="fixed bottom-12 right-12 w-96 bg-black text-white p-10 rounded-[40px] shadow-2xl border border-white/10 pointer-events-auto"
                        >
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-accent shadow-inner">
                                    {React.createElement(steps[currentStep].icon, { size: 24 })}
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-accent mb-1">Étape {currentStep + 1} sur {steps.length}</p>
                                    <h4 className="text-sm font-black uppercase tracking-tight">{steps[currentStep].title}</h4>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-gray-400 leading-relaxed mb-10 uppercase tracking-wide">
                                {steps[currentStep].content}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex space-x-2">
                                    {steps.map((_, i) => (
                                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-8 bg-accent' : 'w-2 bg-white/20'}`}></div>
                                    ))}
                                </div>
                                <button
                                    onClick={nextStep}
                                    className="bg-white text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all active:scale-95"
                                >
                                    {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

const Feature: React.FC<{ icon: any, title: string, desc: string }> = ({ icon: Icon, title, desc }) => (
    <div className="flex items-start space-x-4 p-4 rounded-[24px] bg-gray-50 border border-gray-100">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-accent shadow-sm">
            <Icon size={20} />
        </div>
        <div>
            <h4 className="text-[10px] font-black uppercase tracking-tight text-black mb-1">{title}</h4>
            <p className="text-[9px] font-bold text-gray-400 uppercase leading-tight">{desc}</p>
        </div>
    </div>
);

export default WelcomeGuide;
