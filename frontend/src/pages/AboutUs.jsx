import { useContext, useMemo } from 'react';
import BannerSection from '../components/aboutUs/BannerSection';
import CloudIntroSection from '../components/aboutUs/CloudIntroSection';
import MissionSection from '../components/aboutUs/MissionSection';
import WhyUsSection from '../components/aboutUs/WhyUsSection';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';
import { LanguageContext } from '../context/LanguageContext';

const AboutUs = () => {
  const { t } = useContext(LanguageContext);
  const breadcrumbItems = useMemo(
    () => [
      { label: t('about.breadcrumbHome'), href: '/' },
      { label: t('about.breadcrumbCurrent') },
    ],
    [t],
  );

  return (
    <div className="bg-[#fdfeee] min-h-screen w-full font-nunito">
      <Header />
      <BannerSection breadcrumbItems={breadcrumbItems} />
      <CloudIntroSection />
      <MissionSection />
      <WhyUsSection />
      <Footer />
    </div>
  );
};

export default AboutUs;
