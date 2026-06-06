import React, { useState } from 'react';
import AboutPage from './pages/AboutPage.jsx';
import TestPage from './pages/TestPage.jsx';
import ComparisonPage from './pages/ComparisonPage.jsx';
import FormulaePage from './pages/FormulaePage.jsx';
import IndustryPage from './pages/IndustryPage.jsx';

export default function App() {
  const [page, setPage] = useState('about');

  return (
    <div className="app-container">
      {/* Header with Navigation */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-glow"></div>
          <h1 onClick={() => setPage('about')} style={{ cursor: 'pointer' }}>QuantArb</h1>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${page === 'about' ? 'active' : ''}`}
            onClick={() => setPage('about')}
          >
            About
          </button>
          <button
            className={`nav-btn ${page === 'test' ? 'active' : ''}`}
            onClick={() => setPage('test')}
          >
            Test Console
          </button>
          <button
            className={`nav-btn ${page === 'compare' ? 'active' : ''}`}
            onClick={() => setPage('compare')}
          >
            Benchmark Console
          </button>
          <button
            className={`nav-btn ${page === 'formulae' ? 'active' : ''}`}
            onClick={() => setPage('formulae')}
          >
            Formulations
          </button>
          <button
            className={`nav-btn ${page === 'industry' ? 'active' : ''}`}
            onClick={() => setPage('industry')}
          >
            Industry Insights
          </button>
        </nav>
        <div className="header-status">
          <div className="status-indicator"></div>
          <span>API Connected</span>
        </div>
      </header>

      {/* Page Content */}
      {page === 'about' && <AboutPage onNavigate={setPage} />}
      {page === 'test' && <TestPage />}
      {page === 'compare' && <ComparisonPage />}
      {page === 'formulae' && <FormulaePage />}
      {page === 'industry' && <IndustryPage />}
    </div>
  );
}
