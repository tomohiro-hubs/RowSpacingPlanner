import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import { Button } from './components/ui/button';

// ヘッダーコンポーネント
const Header = () => {
  const location = useLocation();
  
  return (
    <header className="border-b bg-white sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">PV</div>
           <h1 className="font-semibold text-lg md:text-xl hidden sm:block">Row Spacing Planner</h1>
        </div>
        <nav className="flex gap-2">
          {location.pathname !== '/' && (
            <Link to="/">
              <Button variant="ghost">計算画面</Button>
            </Link>
          )}
          {location.pathname !== '/about' && (
            <Link to="/about">
              <Button variant="ghost">About</Button>
            </Link>
          )}
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground p-2">
            {/* Github Icon placeholder if needed */}
          </a>
        </nav>
      </div>
    </header>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <footer className="py-6 text-center text-sm text-muted-foreground border-t mt-12 bg-white">
          <p>© 2024 PV Row Spacing Planner - Static Tool</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
