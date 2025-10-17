import React from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import Hero from '../components/home/Hero';
import Collections from '../components/home/Collections';
import ArtisanCraft from '../components/home/ArtisanCraft';
import FeaturedProducts from '../components/home/FeaturedProducts';
import DiscoverHoaLac from '../components/home/DiscoverHoaLac';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Header />
        <Hero />
        <Collections />
        <ArtisanCraft />
        <FeaturedProducts />
        <DiscoverHoaLac />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
