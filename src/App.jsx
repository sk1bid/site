import { useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import About from "./pages/About";

const navConfig = [
  { path: "/", label: "Status", icon: "📊" },
  { path: "/projects", label: "Projects", icon: "🛠️" },
  { path: "/about", label: "About", icon: "👋" },
];

const orderedRoutes = navConfig.map((item) => item.path);

function SwipeLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pointerId = useRef(null);
  const startX = useRef(null);
  const startY = useRef(null);
  const startTime = useRef(0);

  const resetSwipe = () => {
    pointerId.current = null;
    startX.current = null;
    startY.current = null;
    startTime.current = 0;
  };

  const handlePointerDown = (event) => {
    if (event.pointerType !== "touch") return;
    pointerId.current = event.pointerId;
    startX.current = event.clientX;
    startY.current = event.clientY;
    startTime.current = Date.now();
  };

  const handlePointerUp = (event) => {
    if (event.pointerId !== pointerId.current || startX.current === null) {
      resetSwipe();
      return;
    }

    const dx = event.clientX - startX.current;
    const dy = Math.abs(event.clientY - startY.current);
    const dt = Date.now() - startTime.current;

    if (Math.abs(dx) > 72 && dy < 60 && dt < 600) {
      const currentIndex = orderedRoutes.indexOf(location.pathname);
      if (dx < 0 && currentIndex < orderedRoutes.length - 1) {
        navigate(orderedRoutes[currentIndex + 1]);
      } else if (dx > 0 && currentIndex > 0) {
        navigate(orderedRoutes[currentIndex - 1]);
      }
    }

    resetSwipe();
  };

  const handlePointerCancel = () => {
    resetSwipe();
  };

  return (
    <>
      <main
        className="app-shell"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {children}
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navConfig.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              className={`mobile-nav__button ${isActive ? "is-active" : ""}`}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="mobile-nav__icon" aria-hidden>
                {item.icon}
              </span>
              <span className="mobile-nav__label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

function RoutedApp() {
  return (
    <SwipeLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </SwipeLayout>
  );
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <RoutedApp />
    </Router>
  );
}
