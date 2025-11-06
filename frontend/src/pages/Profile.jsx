import React from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import ProfileSection from '../components/profile/profileSection';

const Profile = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow">
        <ProfileSection />
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
