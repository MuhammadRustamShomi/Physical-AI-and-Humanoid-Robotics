/**
 * User Menu Navbar Item
 * Custom navbar component for authentication.
 */
import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function UserMenuNavbarItemContent() {
  const [UserMenu, setUserMenu] = useState(null);
  const [AuthModal, setAuthModal] = useState(null);
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
    // Dynamically import to avoid SSR issues
    import('../../components/Auth/UserMenu').then((module) => {
      setUserMenu(() => module.default);
    });
    import('../../components/Auth/AuthModal').then((module) => {
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

export default function UserMenuNavbarItem() {
  return (
    <BrowserOnly fallback={null}>
      {() => <UserMenuNavbarItemContent />}
    </BrowserOnly>
  );
}
