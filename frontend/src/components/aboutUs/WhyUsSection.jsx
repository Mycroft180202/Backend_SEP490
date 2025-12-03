import React, { useContext, useMemo } from 'react';
import { LanguageContext } from '../../context/LanguageContext';

const WhyUsSection = () => {
  const { t } = useContext(LanguageContext);
  const reasons = useMemo(
    () => [
      t('about.whyUs.reasons.first'),
      t('about.whyUs.reasons.second'),
      t('about.whyUs.reasons.third'),
      t('about.whyUs.reasons.fourth'),
    ],
    [t],
  );

  return (
    <section className="bg-[#dbefe2] px-[48px] py-[60px] flex flex-row items-center justify-center gap-10">
      {/* Left column: Title */}
      <div className="flex flex-col justify-center items-center flex-1">
        <div className="font-alata text-[#9e211f] text-[40px] leading-[56px] tracking-wide text-right drop-shadow-md">
          <p className="mb-0">{t('about.whyUs.titleLine1')}</p>
          <p className="font-bold">{t('about.whyUs.titleLine2')}</p>
        </div>
      </div>

      {/* Middle column: Reasons list */}
      <div className="flex flex-col justify-center items-center flex-[2] gap-6">
        {reasons.map((reason) => (
          <span
            key={reason}
            className="font-nunito text-[20px] leading-[34px] font-semibold text-[#222] bg-white/40 rounded-[8px] px-6 py-4 w-full max-w-[700px] transition-colors duration-200 hover:text-[#9e211f] hover:bg-[#fff7] cursor-pointer text-center"
          >
            {reason}
          </span>
        ))}
      </div>

      {/* Right column: Illustration */}
      <div className="flex flex-col justify-center items-center flex-1">
        <img
          src="/images/WhyUsSection.jpg"
          alt={t('about.whyUs.titleLine2')}
          className="w-[520px] h-[720px] object-cover rounded-[16px] shadow-xl bg-white"
        />
      </div>
    </section>
  );
};

export default WhyUsSection;
