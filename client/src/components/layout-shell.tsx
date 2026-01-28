import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Menu,
  X,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";

interface LayoutShellProps {
  children: ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Reports", href: "/reports", icon: FileSpreadsheet },
    { label: "Procurement", href: "/procurement", icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                  QB
                </div>
                <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                  QuantBreak
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex space-x-1">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${
                          isActive
                            ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }
                      `}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white animate-in slide-in-from-top-2">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      block px-3 py-2 rounded-md text-base font-medium
                      ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}
