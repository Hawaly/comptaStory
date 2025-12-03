"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Receipt, 
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Calculator,
  Building2,
  ClipboardList,
  Share2
} from "lucide-react";

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface MenuGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  children: MenuItem[];
}

type MenuEntry = MenuItem | MenuGroup;

const isMenuGroup = (item: MenuEntry): item is MenuGroup => {
  return 'children' in item;
};

const menuItems: MenuEntry[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "from-brand-orange to-brand-orange-light" },
  
  // Groupe 1 : Comptabilité
  { 
    label: "Comptabilité", 
    icon: Calculator, 
    color: "from-brand-orange to-brand-orange-light",
    children: [
      { href: "/factures", label: "Factures", icon: FileText, color: "from-brand-orange to-brand-orange-light" },
      { href: "/depenses", label: "Dépenses", icon: Receipt, color: "from-brand-orange to-brand-orange-light" },
    ]
  },
  
  // Groupe 2 : Gestion d'agence
  { 
    label: "Gestion d'agence", 
    icon: Building2, 
    color: "from-brand-orange to-brand-orange-light",
    children: [
      { href: "/clients", label: "Clients", icon: Users, color: "from-brand-orange to-brand-orange-light" },
      { href: "/mandats", label: "Mandats", icon: Briefcase, color: "from-brand-orange to-brand-orange-light" },
    ]
  },
  
  // Groupe 3 : Gestion du travail & tâches
  { 
    label: "Travail & Tâches", 
    icon: ClipboardList, 
    color: "from-brand-orange to-brand-orange-light",
    children: [
      { href: "/taches", label: "Toutes les tâches", icon: ClipboardList, color: "from-brand-orange to-brand-orange-light" },
    ]
  },
  
  { href: "/settings", label: "Paramètres", icon: Settings, color: "from-gray-700 to-gray-800" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // Ouvrir automatiquement le groupe si on est sur une de ses pages
  useEffect(() => {
    menuItems.forEach((item) => {
      if (isMenuGroup(item)) {
        const isChildActive = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href + '/')
        );
        if (isChildActive && !openGroups.includes(item.label)) {
          setOpenGroups((prev) => [...prev, item.label]);
        }
      }
    });
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Empêcher le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-black via-gray-900 to-black text-white flex flex-col shadow-elegant-lg border-r border-gray-800 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo / Brand */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all duration-300 p-1.5">
              <img 
                src="/images/urstory_black.png" 
                alt="YourStory Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-orange rounded-full border-2 border-black animate-pulse-subtle" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              YourStory
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Comptabilité
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
        {menuItems.map((item, index) => {
          const previousItem = index > 0 ? menuItems[index - 1] : null;
          const showSeparator = index > 0 && 
            isMenuGroup(item) && 
            (!previousItem || isMenuGroup(previousItem));
          
          return (
            <div key={isMenuGroup(item) ? item.label : item.href}>
              {/* Séparateur visuel entre groupes */}
              {showSeparator && (
                <div className="my-3 px-4">
                  <div className="border-t border-slate-700/50" />
                </div>
              )}
              
              {renderMenuItem(item, pathname, toggleGroup, openGroups)}
            </div>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="px-4 py-3">
        <div className="bg-gradient-to-br from-brand-orange/20 to-brand-orange-light/20 rounded-xl p-4 border border-brand-orange/10 shadow-inner-glow">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand-orange" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Activité du jour</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">3</span>
            <span className="text-sm text-slate-400">nouvelles factures</span>
          </div>
        </div>
      </div>

      {/* User Info / Footer */}
      <div className="p-4 border-t border-gray-800/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-900/50 mb-3 border border-gray-800">
          <div className="relative">
            <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center shadow-brand">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Admin</p>
            <p className="text-xs text-slate-400 truncate">Administrateur</p>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-gray-400 hover:text-white bg-gray-900/30 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-rose-500/20 border border-gray-800 hover:border-red-500/30 transition-all duration-200 group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
          <span className="font-medium text-sm group-hover:text-red-400 transition-colors">Déconnexion</span>
        </button>
      </div>
      </aside>
    </>
  );
}

// Fonction helper pour rendre un item de menu
function renderMenuItem(
  item: MenuEntry, 
  pathname: string, 
  toggleGroup: (label: string) => void,
  openGroups: string[]
) {
  const Icon = item.icon;
  
  // Rendu pour un groupe avec sous-menu
  if (isMenuGroup(item)) {
    const isOpen = openGroups.includes(item.label);
    const isChildActive = item.children.some(
      (child) => pathname === child.href || pathname.startsWith(child.href + '/')
    );
    
    return (
      <>
        <button
          onClick={() => toggleGroup(item.label)}
          className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full ${
            isChildActive
              ? "bg-white/10 text-white shadow-lg"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          {/* Active indicator */}
          {isChildActive && (
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b ${item.color}`} />
          )}
          
          {/* Icon container */}
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
            isChildActive 
              ? `bg-gradient-to-br ${item.color} shadow-lg` 
              : "bg-slate-800/50 group-hover:bg-slate-700/50"
          }`}>
            <Icon className={`w-5 h-5 ${isChildActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
          </div>
          
          <span className="font-medium flex-1 text-left">{item.label}</span>
          
          {/* Chevron pour indiquer l'état ouvert/fermé */}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${isChildActive ? 'text-white' : 'text-slate-400'}`} />
        </button>
        
        {/* Sous-menu */}
        <div className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="pl-6 mt-1 space-y-1">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const isChildItemActive = pathname === child.href || pathname.startsWith(child.href + '/');
              
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isChildItemActive
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${
                    isChildItemActive 
                      ? `bg-gradient-to-br ${child.color} shadow-lg` 
                      : "bg-slate-800/50 group-hover:bg-slate-700/50"
                  }`}>
                    <ChildIcon className={`w-4 h-4 ${isChildItemActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  </div>
                  
                  <span className="font-medium text-sm">{child.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </>
    );
  }
  
  // Rendu pour un item simple
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  
  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        isActive
          ? "bg-white/10 text-white shadow-lg"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b ${item.color}`} />
      )}
      
      {/* Icon container */}
      <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
        isActive 
          ? `bg-gradient-to-br ${item.color} shadow-lg` 
          : "bg-slate-800/50 group-hover:bg-slate-700/50"
      }`}>
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
      </div>
      
      <span className="font-medium flex-1">{item.label}</span>
      
      {/* Arrow on hover/active */}
      <ChevronRight className={`w-4 h-4 transition-all duration-200 ${
        isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
      }`} />
    </Link>
  );
}
