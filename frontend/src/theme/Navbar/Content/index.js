/**
 * Swizzled Navbar Content to add UserMenu.
 */
import React, { useState, useEffect } from 'react';
import Content from '@theme-original/Navbar/Content';
import BrowserOnly from '@docusaurus/BrowserOnly';

function UserMenuWrapper() {
  const [UserMenu, setUserMenu] = useState(null);
  const [AuthModal, setAuthModal] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    import('../../../components/Auth/UserMenu').then((module) => {
      setUserMenu(() => module.default);
    });
    import('../../../components/Auth/AuthModal').then((module) => {
      setAuthModal(() => module.default);
    });
  }, []);

  if (!UserMenu || !AuthModal) {
    return null;
  }

  return (
    <>
      <UserMenu onSignInClick={() => setShowModal(true)} />
      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialMode="signin"
      />
    </>
  );
}

export default function ContentWrapper(props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      <div style={{ flex: 1 }}>
        <Content {...props} />
      </div>
      <BrowserOnly fallback={null}>
        {() => <UserMenuWrapper />}
      </BrowserOnly>
    </div>
  );
}
