import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Roles: null (Public/Not Logged In), 'Subject Expert', 'Supervisor', 'Admin', 'Scrutiny Officer', 'Auditor', 'Center', 'Student'
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = (role, email, extraData = {}) => {
    setUser({
      role,
      email: email || `${role.toLowerCase().replace(/\s+/g, '')}@authority.gov.in`,
      name: extraData.name || (
        role === 'Subject Expert' ? 'Dr. Sarah Lin (SME-401)' :
        role === 'Center' ? 'Exam Center 104-B' :
        role === 'Student' ? 'Candidate Student' :
        `Authorized ${role}`
      ),
      ...extraData
    });

    // Default target paths per role
    switch (role) {
      case 'Subject Expert':
        setCurrentPath('/expert');
        break;
      case 'Supervisor':
        setCurrentPath('/supervisor');
        break;
      case 'Admin':
        setCurrentPath('/admin');
        break;
      case 'Scrutiny Officer':
        setCurrentPath('/scrutiny');
        break;
      case 'Auditor':
        setCurrentPath('/auditor');
        break;
      case 'Center':
        setCurrentPath('/center-dashboard');
        break;
      case 'Student':
        setCurrentPath('/student-dashboard');
        break;
      default:
        setCurrentPath('/');
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentPath('/');
  };

  const navigate = (path) => {
    setCurrentPath(path);
    window.history.pushState(null, '', path);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, currentPath, navigate, theme, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
