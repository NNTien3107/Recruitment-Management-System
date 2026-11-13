import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { ApplicationHistoryPage } from './pages/candidate/ApplicationHistoryPage';
import { CvsPage } from './pages/candidate/CvsPage';
import { ProfilePage } from './pages/candidate/ProfilePage';
import { JobApplicantsPage } from './pages/recruiter/JobApplicantsPage';

function App() {
  const [currentRole, setCurrentRole] = useState<'CANDIDATE' | 'RECRUITER'>(() => {
    return (localStorage.getItem('rms_user_role') as 'CANDIDATE' | 'RECRUITER') || 'CANDIDATE';
  });

  const handleRoleChange = (role: 'CANDIDATE' | 'RECRUITER') => {
    setCurrentRole(role);
    localStorage.setItem('rms_user_role', role);
    if (role === 'CANDIDATE') {
      localStorage.setItem('rms_user_id', '00000000-0000-0000-0000-000000000001');
    } else {
      localStorage.setItem('rms_user_id', '00000000-0000-0000-0000-000000000002');
    }
  };

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', color: '#111827' }}>
        <Navbar currentRole={currentRole} onRoleChange={handleRoleChange} />

        <main style={{ paddingBottom: '60px' }}>
          <Routes>
            {/* Candidate Routes */}
            <Route path="/candidate/profile" element={<ProfilePage />} />
            <Route path="/candidate/cvs" element={<CvsPage />} />
            <Route path="/candidate/applications" element={<ApplicationHistoryPage />} />

            {/* Recruiter Routes */}
            <Route path="/recruiter/jobs" element={<JobApplicantsPage />} />

            {/* Default Route redirect */}
            <Route
              path="*"
              element={
                <Navigate
                  to={currentRole === 'CANDIDATE' ? '/candidate/profile' : '/recruiter/jobs'}
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
import heroImg from './assets/hero.png';
  import reactLogo from './assets/react.svg';
  import viteLogo from './assets/vite.svg';
  import './App.css';

  function App() {
    const [count, setCount] = useState(0);

    return (
      <>
        <section id="center">
          <div className="hero">
            <img src={heroImg} className="base" width="170" height="179" alt="" />
            <img src={reactLogo} className="framework" alt="React logo" />
            <img src={viteLogo} className="vite" alt="Vite logo" />
          </div>
          <div>
            <h1>Get started</h1>
            <p>
              Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
            </p>
          </div>
          <button type="button" className="counter" onClick={() => setCount((count) => count + 1)}>
            Count is {count}
          </button>
        </section>

        <div className="ticks"></div>

        <section id="next-steps">
          <div id="docs">
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#documentation-icon"></use>
            </svg>
            <h2>Documentation</h2>
            <p>Your questions, answered</p>
            <ul>
              <li>
                <a href="https://vite.dev/" target="_blank">
                  <img className="logo" src={viteLogo} alt="" />
                  Explore Vite
                </a>
              </li>
              <li>
                <a href="https://react.dev/" target="_blank">
                  <img className="button-icon" src={reactLogo} alt="" />
                  Learn more
                </a>
              </li>
            </ul>
          </div>
          <div id="social">
            <svg className="icon" role="presentation" aria-hidden="true">
              <use href="/icons.svg#social-icon"></use>
            </svg>
            <h2>Connect with us</h2>
            <p>Join the Vite community</p>
            <ul>
              <li>
                <a href="https://github.com/vitejs/vite" target="_blank">
                  <svg className="button-icon" role="presentation" aria-hidden="true">
                    <use href="/icons.svg#github-icon"></use>
                  </svg>
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://chat.vite.dev/" target="_blank">
                  <svg className="button-icon" role="presentation" aria-hidden="true">
                    <use href="/icons.svg#discord-icon"></use>
                  </svg>
                  Discord
                </a>
              </li>
              <li>
                <a href="https://x.com/vite_js" target="_blank">
                  <svg className="button-icon" role="presentation" aria-hidden="true">
                    <use href="/icons.svg#x-icon"></use>
                  </svg>
                  X.com
                </a>
              </li>
              <li>
                <a href="https://bsky.app/profile/vite.dev" target="_blank">
                  <svg className="button-icon" role="presentation" aria-hidden="true">
                    <use href="/icons.svg#bluesky-icon"></use>
                  </svg>
                  Bluesky
                </a>
              </li>
            </ul>
          </div>
        </section>

        <div className="ticks"></div>
        <section id="spacer"></section>
      </>
    );
  }

  export default App;
