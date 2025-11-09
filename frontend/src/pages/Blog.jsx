import React from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import FamousBlog from '../components/blog/FamousBlog';
import HoaLacDiscover from '../components/blog/HoaLacDiscover';
import ArtisanTrick from '../components/blog/ArtisanTrick';

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
