import React, { useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import Breadcrumb from '../components/shared/Breadcrumb';
import { LanguageContext } from '../context/LanguageContext';

const Policy = () => {
  const { t } = useContext(LanguageContext);
  const location = useLocation();
  const navigate = useNavigate();

  const returnTo = useMemo(() => location.state?.returnTo || null, [location.state?.returnTo]);
  const returnLabel = useMemo(
    () => location.state?.returnLabel || 'Quay lại',
    [location.state?.returnLabel],
  );

  useEffect(() => {
    if (!location.hash) {
      return;
    }
    const targetId = location.hash.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative py-20">
          <div className="absolute left-6 top-6 z-10">
            <Breadcrumb
              items={[
                { label: 'Trang chủ', href: '/' },
                { label: t('policy.title') || 'Chính sách' },
              ]}
              floating
            />
          </div>
          {returnTo && (
            <div className="absolute right-6 top-6 z-10">
              <button
                type="button"
                onClick={() => navigate(returnTo)}
                className="px-4 py-2 rounded-xl bg-[#9e211f] text-white font-semibold shadow hover:opacity-95 transition"
              >
                {returnLabel}
              </button>
            </div>
          )}
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
              <section id="privacy">
                <h2 className="text-2xl font-semibold text-[#9e211f] mb-3">
                  {t('policy.privacyTitle')}
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {t('policy.privacyContent')}
                </p>
              </section>

              <section id="shipping">
                <h2 className="text-2xl font-semibold text-[#9e211f] mb-3">
                  {t('policy.shippingTitle')}
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {t('policy.shippingContent')}
                </p>
              </section>

              <section id="return">
                <h2 className="text-2xl font-semibold text-[#9e211f] mb-3">
                  {t('policy.returnTitle')}
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
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
