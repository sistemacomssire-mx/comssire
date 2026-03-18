import { cloneElement, isValidElement, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./appLayout.css";

export default function AppLayout({ topbar, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Solo forzar estado al cambiar entre mobile y desktop
      setSidebarOpen((prev) => {
        if (mobile && prev !== false) return false;
        if (!mobile && prev !== true) return true;
        return prev;
      });
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const injectedTopbar = isValidElement(topbar)
    ? cloneElement(topbar, {
        onMenu: toggleSidebar,
        sidebarOpen,
      })
    : <Topbar onMenu={toggleSidebar} sidebarOpen={sidebarOpen} />;

  return (
    <div className="page-bg">
      <div className="page-content">
        <div className="app-shell">
          <Sidebar open={sidebarOpen} onClose={closeSidebar} />

          <main className="app-main">
            {injectedTopbar}
            <section className="app-scroll">
              {children}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}