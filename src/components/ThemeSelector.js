import React, { useState, useEffect } from 'react';
import '@/styles/theme.css';
import '@/styles/theme-selector.css';

const ThemeSelector = () => {
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'default';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme) => {
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme', theme);
  };

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  const themes = [
    { id: 'default', name: 'Ocean Blue', class: 'default' },
    { id: 'sunset', name: 'Warm Sunset', class: 'sunset' },
    { id: 'forest', name: 'Forest Green', class: 'forest' },
    { id: 'night', name: 'Purple Night', class: 'night' },
    { id: 'ocean', name: 'Deep Ocean', class: 'ocean' },
    { id: 'rose', name: 'Rose Gold', class: 'rose' },
    { id: 'autumn', name: 'Autumn Leaves', class: 'autumn' },
    { id: 'mint', name: 'Fresh Mint', class: 'mint' },
    { id: 'mono', name: 'Monochrome', class: 'mono' },
    { id: 'huff-puff', name: 'Huff Puff', class: 'huff-puff' }
  ];

  return (
    <div className="theme-selector">
      {themes.map((theme) => (
        <button
          key={theme.id}
          className={`theme-btn ${theme.class} ${currentTheme === theme.id ? 'active' : ''}`}
          onClick={() => handleThemeChange(theme.id)}
          title={theme.name}
          aria-label={`Switch to ${theme.name} theme`}
        />
      ))}
    </div>
  );
};

export default ThemeSelector;