import React, { useContext, useState } from 'react';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import Breadcrumb from '../components/shared/Breadcrumb';
import { LanguageContext } from '../context/LanguageContext';

const Contact = () => {
  const { t } = useContext(LanguageContext);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: hook API when backend available
    setFormState({
      name: '',
      email: '',
      message: '',
    });
  };

  return (
    <div className="min-h-screen bg-[#FBFBEE] flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative py-20">
          <div className="absolute left-6 top-6 z-10">
            <Breadcrumb
              items={[
                { label: 'Trang chủ', href: '/' },
                { label: t('contact.title') || 'Liên hệ' },
              ]}
              floating
            />
          </div>
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h1 className="text-4xl font-alata text-[#9e211f] mb-6">
                  {t('contact.title')}
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed mb-10">
                  {t('contact.description')}
                </p>

                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                  <h2 className="text-2xl font-semibold text-[#8B4513] mb-6">
                    {t('contact.infoTitle')}
                  </h2>
                  <ul className="space-y-4 text-gray-600">
                    <li>
                      <strong className="block text-gray-800">{t('contact.office')}</strong>
                      <span>{t('contact.address')}</span>
                    </li>
                    <li>
                      <strong className="block text-gray-800">{t('contact.phone')}</strong>
                      <a href="tel:+842469999999" className="hover:text-[#9e211f] transition">
                        (+84) 24 6999 9999
                      </a>
                    </li>
                    <li>
                      <strong className="block text-gray-800">{t('contact.emailLabel')}</strong>
                      <a href="mailto:hello@hoalachandicraft.vn" className="hover:text-[#9e211f] transition">
                        hello@hoalachandicraft.vn
                      </a>
                    </li>
                    <li>
                      <strong className="block text-gray-800">{t('contact.hoursTitle')}</strong>
                      <span>{t('contact.hoursValue')}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <form
                  className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 space-y-6"
                  onSubmit={handleSubmit}
                >
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('contact.form.name')}
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#9e211f]"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('contact.form.email')}
                    </label>
                    <input
                      id="email"
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      type="email"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#9e211f]"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('contact.form.message')}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formState.message}
                      onChange={handleChange}
                      rows={5}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#9e211f] resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#9e211f] text-white py-3 rounded-lg font-semibold hover:opacity-95 transition"
                  >
                    {t('contact.form.submit')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
