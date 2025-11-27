import React from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import Hero from '../components/home/Hero';
import Collections from '../components/home/Collections';
import ArtisanCraft from '../components/home/ArtisanCraft';
import FeaturedProducts from '../components/home/FeaturedProducts';
import DiscoverHoaLac from '../components/home/DiscoverHoaLac';
import ContactSection from '../components/home/ContactSection';

const HomePage = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFF6E9]">
      <main className="relative z-10">
        <Header />
        <Hero />
        <Collections />
        <ArtisanCraft />
        <FeaturedProducts />
        <DiscoverHoaLac />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
