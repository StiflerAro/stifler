/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  User, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  PlusCircle,
  Search,
  Calendar,
  Clock,
  MapPin,
  Package,
  ChevronRight,
  UserCircle,
  LogIn,
  Loader2,
  AlertCircle,
  Bell,
  MessageSquare,
  Globe,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from './firebase';
import { 
  subscribeToCollection, 
  addDocument, 
  updateDocument, 
  deleteDocument,
  saveProfile,
  getProfile,
  testConnection
} from './services/firebaseService';
import { Driver, Client, Pickup, UserProfile } from './types';
import { TRANSIT_NAMES } from './constants';

type Tab = 'enlèvement' | 'chauffeur' | 'client' | 'rapport' | 'profil';

// --- Error Boundary Component ---
function ErrorBoundary({ error, reset, isDarkMode, t }: { error: string, reset: () => void, isDarkMode: boolean, t: any }) {
  let displayMessage = "Une erreur s'est produite.";
  try {
    const parsed = JSON.parse(error);
    if (parsed.error?.includes('permission-denied')) {
      displayMessage = "Vous n'avez pas les permissions nécessaires pour effectuer cette action.";
    }
  } catch (e) {
    displayMessage = error;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-red-100'} rounded-2xl p-8 max-w-md w-full shadow-2xl border text-center`}>
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Erreur Système</h2>
        <p className="text-slate-500 mb-6">{displayMessage}</p>
        <button 
          onClick={reset}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('enlèvement');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [globalError, setGlobalError] = useState<string | null>(null);

  const translations = {
    fr: {
      dashboard: 'Tableau de Bord',
      pickup: 'Enlèvement',
      driver: 'Chauffeur',
      client: 'Client',
      report: 'Rapport',
      profile: 'Profil',
      logout: 'Déconnexion',
      loading: 'Chargement de LogiTrack...',
      welcome: 'Bienvenue sur LogiTrack',
      loginGoogle: 'Se connecter avec Google',
      terms: "En vous connectant, vous acceptez nos conditions d'utilisation.",
      notifications: 'Messages & Notifications',
      newNotifications: '2 Nouveaux',
      viewAll: "Voir tout l'historique",
      settings: 'Paramètres',
      darkMode: 'Mode Sombre',
      lightMode: 'Mode Clair',
      language: 'Langue',
      french: 'Français',
      english: 'Anglais',
      newPickup: 'Nouvel Enlèvement',
      pickupDesc: 'Gérez les sorties de camions et le suivi des enlèvements.',
      editPickup: 'Modifier Enlèvement',
      totalPickups: 'Total Sorties',
      pending: 'En Attente',
      completed: 'Terminés',
      lastPickups: 'Dernières Sorties',
      search: 'Rechercher...',
      date: 'Date',
      blNumber: 'N° BL',
      tcNumber: 'N° TC',
      product: 'Produit',
      status: 'Statut',
      actions: 'Actions',
      addDriver: 'Ajouter un Chauffeur',
      driverDesc: 'Gérez votre liste de chauffeurs et leurs informations.',
      editDriver: 'Modifier Chauffeur',
      newDriver: 'Nouveau Chauffeur',
      addClient: 'Ajouter un Client',
      clientDesc: 'Gérez votre base de données clients et leurs contacts.',
      editClient: 'Modifier Client',
      newClient: 'Nouveau Client',
      save: 'Enregistrer',
      update: 'Mettre à jour',
      cancel: 'Annuler',
      name: 'Nom',
      phone: 'Téléphone',
      address: 'Adresse',
      contact: 'Contact',
      immat: 'Immatriculation',
      reports: 'Rapports & Statistiques',
      reportDesc: 'Visualisez les performances et les données clés de votre activité.',
      drivers: 'Chauffeurs',
      clients: 'Clients',
      clientList: 'Liste des Clients',
      driverList: 'Liste des Chauffeurs',
      noData: 'Aucune donnée disponible',
      activeDrivers: 'Chauffeurs Actifs',
      partnerClients: 'Clients Partenaires',
      completionRate: 'Taux de Complétion'
    },
    en: {
      dashboard: 'Dashboard',
      pickup: 'Pickup',
      driver: 'Driver',
      client: 'Client',
      report: 'Report',
      profile: 'Profile',
      logout: 'Logout',
      loading: 'Loading LogiTrack...',
      welcome: 'Welcome to LogiTrack',
      loginGoogle: 'Login with Google',
      terms: "By logging in, you agree to our terms of use.",
      notifications: 'Messages & Notifications',
      newNotifications: '2 New',
      viewAll: "View all history",
      settings: 'Settings',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      language: 'Language',
      french: 'French',
      english: 'English',
      newPickup: 'New Pickup',
      pickupDesc: 'Manage truck departures and track pickups.',
      editPickup: 'Edit Pickup',
      totalPickups: 'Total Pickups',
      pending: 'Pending',
      completed: 'Completed',
      lastPickups: 'Last Pickups',
      search: 'Search...',
      date: 'Date',
      blNumber: 'BL No.',
      tcNumber: 'TC No.',
      product: 'Product',
      status: 'Status',
      actions: 'Actions',
      addDriver: 'Add a Driver',
      driverDesc: 'Manage your list of drivers and their information.',
      editDriver: 'Edit Driver',
      newDriver: 'New Driver',
      addClient: 'Add a Client',
      clientDesc: 'Manage your client database and their contacts.',
      editClient: 'Edit Client',
      newClient: 'New Client',
      save: 'Save',
      update: 'Update',
      cancel: 'Cancel',
      name: 'Name',
      phone: 'Phone',
      address: 'Address',
      contact: 'Contact',
      immat: 'Registration',
      reports: 'Reports & Statistics',
      reportDesc: 'Visualize performance and key data of your activity.',
      drivers: 'Drivers',
      clients: 'Clients',
      clientList: 'Client List',
      driverList: 'Driver List',
      noData: 'No data available',
      activeDrivers: 'Active Drivers',
      partnerClients: 'Partner Clients',
      completionRate: 'Completion Rate'
    }
  };

  const t = (key: keyof typeof translations['fr']) => translations[language][key] || key;

  // Data states
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);

  useEffect(() => {
    testConnection();
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userProfile = await getProfile(firebaseUser.uid);
        if (userProfile) {
          setProfile(userProfile as UserProfile);
        } else {
          const newProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Utilisateur',
            email: firebaseUser.email || '',
            companyName: ''
          };
          await saveProfile(firebaseUser.uid, newProfile);
          setProfile(newProfile);
        }
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubDrivers = subscribeToCollection('drivers', (data) => setDrivers(data as Driver[]));
    const unsubClients = subscribeToCollection('clients', (data) => setClients(data as Client[]));
    const unsubPickups = subscribeToCollection('pickups', (data) => setPickups(data as Pickup[]));

    return () => {
      unsubDrivers();
      unsubClients();
      unsubPickups();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-blue-900'}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-blue-100 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-blue-900'}`}>
        <div className={`max-w-md w-full rounded-3xl p-10 shadow-2xl text-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
          <div className="bg-orange-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-500/30">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>LogiTrack</h1>
          <p className="text-slate-500 mb-10">{t('welcome')}</p>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <LogIn className="w-6 h-6" />
            {t('loginGoogle')}
          </button>
          
          <p className="mt-8 text-xs text-slate-400">
            {t('terms')}
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'enlèvement', label: t('pickup'), icon: Truck },
    { id: 'chauffeur', label: t('drivers'), icon: User },
    { id: 'client', label: t('clients'), icon: Users },
    { id: 'rapport', label: t('report'), icon: FileText },
    { id: 'profil', label: t('profile'), icon: UserCircle },
  ];

  const renderContent = () => {
    const props = { setGlobalError, drivers, clients, pickups, profile, user, setProfile, isDarkMode, t };
    switch (activeTab) {
      case 'enlèvement': return <PickupView {...props} />;
      case 'chauffeur': return <DriverView {...props} />;
      case 'client': return <ClientView {...props} />;
      case 'rapport': return <ReportView {...props} />;
      case 'profil': return <ProfileView {...props} />;
      default: return <PickupView {...props} />;
    }
  };

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-slate-900'}`}>
      {globalError && <ErrorBoundary error={globalError} reset={() => setGlobalError(null)} isDarkMode={isDarkMode} t={t} />}
      
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className={`${isDarkMode ? 'bg-slate-900' : 'bg-blue-900'} text-white flex flex-col shadow-xl z-20 transition-colors duration-300`}
      >
        <div className="p-6 flex items-center justify-between overflow-hidden">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 whitespace-nowrap"
              >
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">LogiTrack</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-3 mt-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} />
                <AnimatePresence mode="wait">
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 rounded-xl text-blue-200 hover:bg-red-500/10 hover:text-red-400 transition-all group"
          >
            <LogOut className="w-6 h-6 shrink-0 group-hover:translate-x-1 transition-transform" />
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium whitespace-nowrap"
                >
                  {t('logout')}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} border-b p-4 flex items-center justify-between shadow-sm relative transition-colors duration-300`}>
          <h1 className={`text-2xl font-bold capitalize ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`}>
            {navItems.find(item => item.id === activeTab)?.label || activeTab}
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Settings className="w-6 h-6" />
              </button>

              <AnimatePresence>
                {isSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsSettingsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border z-40 overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Settings className="w-4 h-4 text-blue-600" />
                          {t('settings')}
                        </h3>
                      </div>
                      <div className="p-2 space-y-1">
                        <button 
                          onClick={() => setIsDarkMode(!isDarkMode)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                        >
                          <div className="flex items-center gap-3">
                            {isDarkMode ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
                            <span className="text-sm font-medium">{isDarkMode ? t('lightMode') : t('darkMode')}</span>
                          </div>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200'}`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
                          </div>
                        </button>

                        <div className={`p-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                          <div className="flex items-center gap-3 mb-3 text-slate-400">
                            <Globe className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">{t('language')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => setLanguage('fr')}
                              className={`py-2 rounded-lg text-xs font-bold transition-all ${language === 'fr' ? 'bg-blue-600 text-white shadow-md' : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}
                            >
                              FR
                            </button>
                            <button 
                              onClick={() => setLanguage('en')}
                              className={`py-2 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-blue-600 text-white shadow-md' : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}
                            >
                              EN
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 rounded-full transition-colors relative ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border z-40 overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
                    >
                      <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
                        <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          {t('notifications')}
                        </h3>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">{t('newNotifications')}</span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        <div className={`p-4 transition-colors border-b cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-slate-50 border-slate-50'}`}>
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <Truck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Nouveau départ enregistré</p>
                              <p className="text-xs text-slate-500 mt-1">Le camion TG-4567-BC est en route pour Lomé.</p>
                              <p className="text-[10px] text-slate-400 mt-2">Il y a 5 minutes</p>
                            </div>
                          </div>
                        </div>
                        <div className={`p-4 transition-colors border-b cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-slate-50 border-slate-50'}`}>
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Nouveau chauffeur actif</p>
                              <p className="text-xs text-slate-500 mt-1">Jean Dupont a été ajouté à votre équipe.</p>
                              <p className="text-[10px] text-slate-400 mt-2">Il y a 2 heures</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className={`w-full p-3 text-center text-xs font-bold transition-colors border-t ${isDarkMode ? 'text-blue-400 hover:bg-slate-800 border-slate-800' : 'text-blue-600 hover:bg-blue-50 border-slate-100'}`}>
                        {t('viewAll')}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setActiveTab('profil')}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full border border-blue-200" referrerPolicy="no-referrer" />
              ) : (
                <UserCircle className="w-6 h-6 text-blue-600" />
              )}
              <div className="flex flex-col items-start leading-tight">
                <span className="max-w-[150px] truncate">{profile?.displayName || user.displayName}</span>
                {profile?.companyName && (
                  <span className="text-[10px] text-orange-600 font-bold truncate max-w-[150px] uppercase tracking-wider">
                    {profile.companyName}
                  </span>
                )}
              </div>
            </button>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto p-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Views (Placeholders for now, will implement in next step) ---

function PickupView({ pickups, drivers, clients, setGlobalError, isDarkMode, t }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPickup, setEditingPickup] = useState<Pickup | null>(null);
  const [formData, setFormData] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    blNumber: '',
    tcNumber: '',
    productNature: '',
    driverId: '', 
    clientId: '', 
    registrationNumber: '',
    hhDate: new Date().toISOString().split('T')[0],
    status: 'en_attente' as const 
  });

  const handleOpenModal = (pickup?: Pickup) => {
    if (pickup) {
      setEditingPickup(pickup);
      setFormData({ 
        date: pickup.date, 
        blNumber: pickup.blNumber || '',
        tcNumber: pickup.tcNumber || '',
        productNature: pickup.productNature || '',
        driverId: pickup.driverId, 
        clientId: pickup.clientId, 
        registrationNumber: pickup.registrationNumber || '',
        hhDate: pickup.hhDate || new Date().toISOString().split('T')[0],
        status: pickup.status 
      });
    } else {
      setEditingPickup(null);
      setFormData({ 
        date: new Date().toISOString().split('T')[0], 
        blNumber: '',
        tcNumber: '',
        productNature: '',
        driverId: '', 
        clientId: '', 
        registrationNumber: '',
        hhDate: new Date().toISOString().split('T')[0],
        status: 'en_attente' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverId || !formData.clientId) {
      alert("Veuillez sélectionner un chauffeur et un client.");
      return;
    }
    try {
      if (editingPickup?.id) {
        await updateDocument('pickups', editingPickup.id, formData);
      } else {
        await addDocument('pickups', formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      setGlobalError(error.message);
    }
  };

  const getDriverName = (id: string) => drivers.find((d: any) => d.id === id)?.name || 'Inconnu';
  const getClientName = (id: string) => clients.find((c: any) => c.id === id)?.name || 'Inconnu';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('pickup')}</h2>
          <p className="text-slate-500">{t('pickupDesc')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          <PlusCircle className="w-5 h-5" />
          {t('newPickup')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-sm border flex items-center gap-4 transition-colors duration-300`}>
          <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{t('totalPickups')}</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{pickups.length}</p>
          </div>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-sm border flex items-center gap-4 transition-colors duration-300`}>
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{t('pending')}</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{pickups.filter((p: any) => p.status === 'en_attente').length}</p>
          </div>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-sm border flex items-center gap-4 transition-colors duration-300`}>
          <div className="bg-green-100 p-3 rounded-xl text-green-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{t('completed')}</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{pickups.filter((p: any) => p.status === 'termine').length}</p>
          </div>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300`}>
        <div className={`p-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'} flex justify-between items-center`}>
          <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('lastPickups')}</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={t('search')}
              className={`pl-10 pr-4 py-2 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all w-64 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-50 text-slate-900'}`}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`${isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-gray-50 text-slate-500'} text-xs uppercase tracking-wider`}>
              <tr>
                <th className="px-6 py-4 font-semibold">{t('date')}</th>
                <th className="px-6 py-4 font-semibold">{t('blNumber')}</th>
                <th className="px-6 py-4 font-semibold">{t('tcNumber')}</th>
                <th className="px-6 py-4 font-semibold">{t('product')}</th>
                <th className="px-6 py-4 font-semibold">{t('client')}</th>
                <th className="px-6 py-4 font-semibold">{t('driver')}</th>
                <th className="px-6 py-4 font-semibold">{t('immat')}</th>
                <th className="px-6 py-4 font-semibold">Date HH</th>
                <th className="px-6 py-4 font-semibold">{t('status')}</th>
                <th className="px-6 py-4 font-semibold">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-gray-100'}`}>
              {pickups.map((pickup: Pickup) => {
                const today = new Date().toISOString().split('T')[0];
                const hhColorClass = pickup.hhDate > today 
                  ? 'text-green-600 font-bold' 
                  : pickup.hhDate < today 
                    ? 'text-red-600 font-bold' 
                    : isDarkMode ? 'text-slate-300' : 'text-slate-600';
                
                return (
                  <tr key={pickup.id} className={`transition-colors group text-sm ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{pickup.date}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{pickup.blNumber}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{pickup.tcNumber}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{pickup.productNature}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{getClientName(pickup.clientId)}</td>
                    <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{getDriverName(pickup.driverId)}</td>
                    <td className={`px-6 py-4 font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{pickup.registrationNumber}</td>
                    <td className={`px-6 py-4 ${hhColorClass}`}>{pickup.hhDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        pickup.status === 'termine' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {pickup.status === 'termine' ? t('completed') : t('pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleOpenModal(pickup)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        {t('update')}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pickups.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">Aucun enlèvement enregistré.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-2xl p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh] form-bg-image ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {editingPickup ? t('editPickup') : t('newPickup')}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('date')}</label>
                    <input 
                      required
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('blNumber')}</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: BL-9999"
                      value={formData.blNumber}
                      onChange={(e) => setFormData({...formData, blNumber: e.target.value})}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('tcNumber')}</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: TC-8888"
                      value={formData.tcNumber}
                      onChange={(e) => setFormData({...formData, tcNumber: e.target.value})}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('product')}</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Riz, Ciment..."
                      value={formData.productNature}
                      onChange={(e) => setFormData({...formData, productNature: e.target.value})}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('client')}</label>
                    <select 
                      required
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                    >
                      <option value="">Sélectionner un client</option>
                      {[...clients].sort((a, b) => a.name.localeCompare(b.name)).map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('driver')}</label>
                    <select 
                      required
                      value={formData.driverId}
                      onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                    >
                      <option value="">Sélectionner un chauffeur</option>
                      {[...drivers].sort((a, b) => a.name.localeCompare(b.name)).map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('immat')}</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: TG-1234-AB"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Date du HH</label>
                    <input 
                      required
                      type="date" 
                      value={formData.hhDate}
                      onChange={(e) => setFormData({...formData, hhDate: e.target.value})}
                      className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('status')}</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                  >
                    <option value="en_attente">{t('pending')}</option>
                    <option value="termine">{t('completed')}</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className={`flex-1 px-6 py-3 border rounded-xl font-bold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-gray-200 text-slate-600 hover:bg-gray-50'}`}
                  >
                    {t('cancel')}
                  </button>
                  <button type="submit" className="flex-2 bg-blue-600 text-white py-3 px-8 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                    {editingPickup ? t('update') : t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DriverView({ drivers, setGlobalError, isDarkMode, t }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({ name: '', registrationNumber: '', phone: '', status: 'actif' as const });

  const handleOpenModal = (driver?: any) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({ 
        name: driver.name, 
        registrationNumber: driver.registrationNumber || driver.licenseNumber || '', 
        phone: driver.phone || '', 
        status: driver.status 
      });
    } else {
      setEditingDriver(null);
      setFormData({ name: '', registrationNumber: '', phone: '', status: 'actif' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver?.id) {
        await updateDocument('drivers', editingDriver.id, formData);
      } else {
        await addDocument('drivers', formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      setGlobalError(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce chauffeur ?")) {
      try {
        await deleteDocument('drivers', id);
      } catch (error: any) {
        setGlobalError(error.message);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('drivers')}</h2>
          <p className="text-slate-500">{t('driverDesc')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          <PlusCircle className="w-5 h-5" />
          {t('newDriver')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...drivers].sort((a, b) => a.name.localeCompare(b.name)).map((driver: Driver) => (
          <div key={driver.id} className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all relative group`}>
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                <User className="w-6 h-6" />
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                driver.status === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {driver.status}
              </span>
            </div>
            <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{driver.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{t('immat')}: {driver.registrationNumber || (driver as any).licenseNumber || 'N/A'}</p>
            {driver.phone && (
              <p className={`text-sm flex items-center gap-2 mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <MapPin className="w-4 h-4 text-slate-400" />
                {driver.phone}
              </p>
            )}
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => handleOpenModal(driver)}
                className={`flex-1 py-2 border rounded-lg text-sm font-semibold transition-colors ${isDarkMode ? 'border-slate-700 text-blue-400 hover:bg-slate-800' : 'border-blue-100 text-blue-600 hover:bg-blue-50'}`}
              >
                {t('update')}
              </button>
              <button 
                onClick={() => driver.id && handleDelete(driver.id)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-400 hover:bg-red-50'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-2xl p-8 max-w-md w-full shadow-2xl form-bg-image ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {editingDriver ? t('editDriver') : t('newDriver')}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('name')}</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('immat')}</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: TG-1234-AB"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('phone')}</label>
                  <input 
                    required
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 hover:bg-blue-700 transition-colors">
                  {editingDriver ? t('update') : t('save')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClientView({ clients, setGlobalError, isDarkMode, t }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '', contactPerson: '', phone: '' });

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({ name: client.name, address: client.address || '', contactPerson: client.contactPerson || '', phone: client.phone || '' });
    } else {
      setEditingClient(null);
      setFormData({ name: '', address: '', contactPerson: '', phone: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient?.id) {
        await updateDocument('clients', editingClient.id, formData);
      } else {
        await addDocument('clients', formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      setGlobalError(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce client ?")) {
      try {
        await deleteDocument('clients', id);
      } catch (error: any) {
        setGlobalError(error.message);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('clients')}</h2>
          <p className="text-slate-500">{t('clientDesc')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          <PlusCircle className="w-5 h-5" />
          {t('newClient')}
        </button>
      </div>

      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border overflow-hidden`}>
        <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('clientList')}</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={t('search')}
              className={`pl-10 pr-4 py-2 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all w-64 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-50 text-slate-900'}`}
            />
          </div>
        </div>
        <div className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-gray-100'}`}>
          {[...clients].sort((a, b) => a.name.localeCompare(b.name)).map((client: Client) => (
            <div key={client.id} className={`p-6 flex items-center justify-between transition-colors group ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{client.name}</h4>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    {client.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {client.address}</span>}
                    {client.contactPerson && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {client.contactPerson}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleOpenModal(client)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-blue-400 hover:bg-blue-900/20' : 'text-blue-600 hover:bg-blue-50'}`}
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => client.id && handleDelete(client.id)}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-400 hover:bg-red-50'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="p-12 text-center text-slate-400">Aucun client enregistré.</div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-2xl p-8 max-w-md w-full shadow-2xl form-bg-image ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {editingClient ? t('editClient') : t('newClient')}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>MAISON TRANSIT</label>
                  <select 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                  >
                    <option value="">Sélectionner un Nom</option>
                    {TRANSIT_NAMES.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('address')}</label>
                  <input 
                    type="text" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('contact')}</label>
                  <input 
                    type="text" 
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('phone')}</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
                  />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 hover:bg-blue-700 transition-colors">
                  {editingClient ? t('update') : t('save')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReportView({ pickups, drivers, clients, isDarkMode, t }: any) {
  const totalPickups = pickups.length;
  const completedPickups = pickups.filter((p: any) => p.status === 'termine').length;
  const pendingPickups = pickups.filter((p: any) => p.status === 'en_attente').length;

  // Group by client
  const clientStats = clients.map((client: any) => ({
    name: client.name,
    count: pickups.filter((p: any) => p.clientId === client.id).length
  })).sort((a: any, b: any) => b.count - a.count).slice(0, 5);

  // Group by driver
  const driverStats = drivers.map((driver: any) => ({
    name: driver.name,
    count: pickups.filter((p: any) => p.driverId === driver.id).length
  })).sort((a: any, b: any) => b.count - a.count).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('reports')}</h2>
        <p className="text-slate-500">{t('reportDesc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-sm border`}>
          <p className="text-sm text-slate-500 font-medium mb-1">{t('totalPickups')}</p>
          <p className="text-3xl font-bold text-blue-600">{totalPickups}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-sm border`}>
          <p className="text-sm text-slate-500 font-medium mb-1">{t('completionRate')}</p>
          <p className="text-3xl font-bold text-green-600">
            {totalPickups > 0 ? Math.round((completedPickups / totalPickups) * 100) : 0}%
          </p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-sm border`}>
          <p className="text-sm text-slate-500 font-medium mb-1">{t('activeDrivers')}</p>
          <p className="text-3xl font-bold text-orange-600">{drivers.filter((d: any) => d.status === 'actif').length}</p>
        </div>
        <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-6 rounded-2xl shadow-sm border`}>
          <p className="text-sm text-slate-500 font-medium mb-1">{t('partnerClients')}</p>
          <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{clients.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-8 rounded-2xl shadow-sm border`}>
          <h3 className={`font-bold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            <Users className="w-5 h-5 text-blue-600" />
            Top 5 Clients
          </h3>
          <div className="space-y-4">
            {clientStats.map((stat: any, i: number) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{stat.name}</span>
                  <span className="text-slate-500">{stat.count} sorties</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <div 
                    className="bg-blue-500 h-full rounded-full" 
                    style={{ width: `${totalPickups > 0 ? (stat.count / totalPickups) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {clientStats.length === 0 && <p className="text-center text-slate-400 py-4">{t('noData')}</p>}
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} p-8 rounded-2xl shadow-sm border`}>
          <h3 className={`font-bold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            <User className="w-5 h-5 text-orange-600" />
            Performance Chauffeurs
          </h3>
          <div className="space-y-4">
            {driverStats.map((stat: any, i: number) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{stat.name}</span>
                  <span className="text-slate-500">{stat.count} sorties</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <div 
                    className="bg-orange-500 h-full rounded-full" 
                    style={{ width: `${totalPickups > 0 ? (stat.count / totalPickups) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {driverStats.length === 0 && <p className="text-center text-slate-400 py-4">{t('noData')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileView({ profile, user, setGlobalError, setProfile, isDarkMode, t }: any) {
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [companyName, setCompanyName] = useState(profile?.companyName || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const updatedProfile = { ...profile, displayName, companyName };
      await saveProfile(user.uid, updatedProfile);
      setProfile(updatedProfile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setGlobalError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues.")) {
      try {
        await deleteDocument('users', user.uid);
        await signOut(auth);
      } catch (error: any) {
        setGlobalError(error.message);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} rounded-3xl shadow-sm border overflow-hidden`}>
        <div className="h-32 bg-gradient-to-r from-blue-900 to-blue-700 relative">
          <div className="absolute -bottom-12 left-8">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className={`w-24 h-24 rounded-2xl border-4 shadow-lg object-cover ${isDarkMode ? 'border-slate-900' : 'border-white'}`} 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-24 h-24 rounded-2xl border-4 shadow-lg flex items-center justify-center text-blue-600 ${isDarkMode ? 'border-slate-900 bg-slate-800' : 'border-white bg-gray-100'}`}>
                <UserCircle className="w-16 h-16" />
              </div>
            )}
          </div>
        </div>
        <div className="pt-16 pb-8 px-8">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{profile?.displayName || user.displayName}</h2>
          {profile?.companyName && (
            <p className="text-orange-600 font-bold text-sm mt-1 flex items-center gap-1.5 uppercase tracking-wider">
              <Truck className="w-4 h-4" />
              {profile.companyName}
            </p>
          )}
          <p className="text-slate-500 text-sm mt-1">{user.email}</p>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} rounded-3xl shadow-sm border p-8 form-bg-image`}>
        <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{t('update')}</h3>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{t('name')}</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
              />
            </div>
            <div className="space-y-1">
              <label className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>MAISON TRANSIT</label>
              <select 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={`w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-slate-900'}`}
              >
                <option value="">Sélectionner un Nom</option>
                {TRANSIT_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
              success 
                ? 'bg-green-500 text-white shadow-green-500/20' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : success ? (
              <>
                <Truck className="w-5 h-5" />
                {t('save')} !
              </>
            ) : (
              t('save')
            )}
          </button>
        </form>
      </div>

      <div className={`${isDarkMode ? 'bg-red-900/10 border-red-900/20' : 'bg-red-50 border-red-100'} rounded-3xl p-8 border`}>
        <div className="flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-xl text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-red-800 dark:text-red-400 font-bold mb-1">Zone de Danger</h3>
            <p className="text-red-600 dark:text-red-500 text-sm mb-6">La suppression de votre compte supprimera définitivement toutes vos données de nos serveurs.</p>
            <button 
              onClick={handleDeleteAccount}
              className={`bg-white text-red-600 border border-red-200 px-6 py-2.5 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all ${isDarkMode ? 'bg-slate-900 border-red-900/30' : ''}`}
            >
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
