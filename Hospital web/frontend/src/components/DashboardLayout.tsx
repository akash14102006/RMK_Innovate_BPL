import { useState } from 'react';
import { Button } from './ui/button';
import {
    LayoutDashboard,
    Wind,
    Calendar,
    AlertTriangle,
    FileText,
    Settings,
    LogOut,
    Activity,
    Menu,
    X,
    MessageCircle,
    Stethoscope
} from 'lucide-react';
import DashboardPage from './DashboardPage';
import PollutionMonitor from './PollutionMonitor';
import FestivalCalendar from './FestivalCalendar';
import EpidemicTracker from './EpidemicTracker';
import AlertsReports from './AlertsReports';
import SettingsPage from './SettingsPage';
import ChatbotAssistant from './ChatbotAssistant';
import AIAssistantFullPage from './AIAssistantFullPage';
import PatientTriage from './PatientTriage';
import PatientHistory from './PatientHistory';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { toast } from 'sonner';

import menuImage from '../assets/3084bc5f3abb12a8f82c8ba4fb1b703a42d1d8d6.png';
import logoImage from '../assets/32a5a413977d943e579cd3371923d955b6e0b7e9.png';
import profileImage from '../assets/user-profile.png';

interface DashboardLayoutProps {
    onNavigate: (page: 'landing' | 'login' | 'dashboard') => void;
}

type Page = 'dashboard' | 'triage' | 'history' | 'pollution' | 'festival' | 'epidemic' | 'alerts' | 'chatbot' | 'settings';

const NAV_SECTIONS = [
    {
        title: null,
        items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }]
    },
    {
        title: 'Smart Patient Triage',
        items: [
            { id: 'triage', label: 'Patient Triage', icon: Stethoscope },
            { id: 'history', label: 'Patient Archives', icon: Calendar },
        ]
    },
    {
        title: 'Smart Patient Flow',
        items: [
            { id: 'pollution', label: 'Pollution Monitor', icon: Wind },
            { id: 'festival', label: 'Festival Calendar', icon: Calendar },
            { id: 'epidemic', label: 'Epidemic Tracker', icon: AlertTriangle },
        ]
    },
    {
        title: 'System',
        items: [
            { id: 'alerts', label: 'Alerts & Reports', icon: FileText },
            { id: 'chatbot', label: 'AI Assistant', icon: MessageCircle },
            { id: 'settings', label: 'Settings', icon: Settings },
        ]
    }
];

export default function DashboardLayout({ onNavigate }: DashboardLayoutProps) {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [chatbotOpen, setChatbotOpen] = useState(false);
    const { user } = useAuth();

    const handleLogout = async () => {
        const success = await logout();
        if (success) {
            toast.success('Logged out successfully');
            onNavigate('landing');
        } else {
            toast.error('Failed to log out');
        }
    };

    const flatNavItems = NAV_SECTIONS.flatMap(section => section.items);

    // If AI Assistant page is selected, show full-page version
    if (currentPage === 'chatbot') {
        return <AIAssistantFullPage onBack={() => setCurrentPage('dashboard')} />;
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-0'
                    } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col overflow-hidden`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-teal-50 via-green-50 to-blue-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-white p-2 flex-shrink-0 shadow-md">
                            <img
                                src={logoImage}
                                alt="Bharat PulseLink Logo"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="text-lg text-teal-600 font-bold">Bharat PulseLink</div>
                            <div className="text-[11px] font-semibold text-teal-700">Hospital Intelligence</div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
                    {NAV_SECTIONS.map((section, idx) => (
                        <div key={idx} className="space-y-1">
                            {section.title && (
                                <div className="px-4 mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text">
                                        {section.title}
                                    </span>
                                </div>
                            )}
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentPage === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentPage(item.id as Page)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                            ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100/50'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                        <span className={`whitespace-nowrap text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Decorative Image */}
                <div className="mt-auto px-4 pb-6 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-white shadow-lg border-2 border-teal-100 mb-2 group hover:scale-105 transition-transform duration-300">
                        <img
                            src={menuImage}
                            alt="Hospital Management"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="text-center">
                        <div className="px-2 py-0.5 bg-slate-100/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm">
                            <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Hospital Management</span>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </Button>
                            <div>
                                <h1 className="text-2xl text-gray-900">
                                    {flatNavItems.find(item => item.id === currentPage)?.label}
                                </h1>
                                <p className="text-sm text-gray-500">Real-time hospital management insights</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-gray-900 font-medium">{user?.displayName || user?.email || 'Administrator'}</div>
                                <div className="text-sm text-gray-500">{user?.email || 'Hospital Admin'}</div>
                            </div>
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-200 shadow-md">
                                <img
                                    src={user?.photoURL || profileImage}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </header>


                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {currentPage === 'dashboard' && <DashboardPage />}
                    {currentPage === 'triage' && <PatientTriage />}
                    {currentPage === 'history' && <PatientHistory />}
                    {currentPage === 'pollution' && <PollutionMonitor />}
                    {currentPage === 'festival' && <FestivalCalendar />}
                    {currentPage === 'epidemic' && <EpidemicTracker />}
                    {currentPage === 'alerts' && <AlertsReports />}
                    {currentPage === 'settings' && <SettingsPage />}
                </main>
            </div>

            {/* Chatbot */}
            <ChatbotAssistant isOpen={chatbotOpen} onToggle={() => setChatbotOpen(!chatbotOpen)} />

            {/* Floating Chatbot Button */}
            {!chatbotOpen && (
                <button
                    onClick={() => setChatbotOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-teal-600 to-teal-400 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white z-50 hover:scale-110"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}

/* updated */
