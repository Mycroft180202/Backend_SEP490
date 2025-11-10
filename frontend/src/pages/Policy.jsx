import React, { useContext } from 'react';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import { LanguageContext } from '../context/LanguageContext';

const Policy = () => {
  const { t } = useContext(LanguageContext);

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-6 lg:px-8 space-y-10">
            <header className="text-center space-y-4">
              <h1 className="text-4xl font-alata text-[#8B4513]">
                {t('policy.title')}
              </h1>
              <p className="text-sm text-gray-500 uppercase tracking-wider">
                {t('policy.updated')}
              </p>
            </header>

            <article className="bg-white rounded-3xl shadow-md border border-[#D4A574]/30 p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-[#9e211f] mb-3">
                  {t('policy.privacyTitle')}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {t('policy.privacyContent')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#9e211f] mb-3">
                  {t('policy.shippingTitle')}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {t('policy.shippingContent')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[#9e211f] mb-3">
                  {t('policy.returnTitle')}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {t('policy.returnContent')}
                </p>
              </section>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Policy;
