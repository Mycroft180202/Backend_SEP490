import React from 'react';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import Detail from '../components/blogDetail/Detail';
import RelationBlog from '../components/blogDetail/RelationBlog';

const BlogDetail = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow">
        <Detail />
        <RelationBlog />
      </main>
      <Footer />
    </div>
  );
};

export default BlogDetail;
