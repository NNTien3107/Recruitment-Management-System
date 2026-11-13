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
  );
}

export default App;
