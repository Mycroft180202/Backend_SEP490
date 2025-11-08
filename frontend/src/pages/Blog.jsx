import React from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import FamousBlog from '../components/Blog/FamousBlog';
import HoaLacDiscover from '../components/Blog/HoaLacDiscover';
import ArtisanTrick from '../components/Blog/ArtisanTrick';

const Blog = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow">
        <FamousBlog />
        <HoaLacDiscover />
        <ArtisanTrick />
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
