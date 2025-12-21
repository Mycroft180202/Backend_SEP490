import React, { useContext, useMemo } from 'react';
import { LanguageContext } from '../../context/LanguageContext';

const MissionSection = () => {
  const { t } = useContext(LanguageContext);
  const missionItems = useMemo(
    () => [
      t('about.mission.items.first'),
      t('about.mission.items.second'),
      t('about.mission.items.third'),
    ],
    [t],
  );

  return (
    <section className="px-4 sm:px-8 lg:px-20 py-14 lg:py-20 bg-white">
      <h2 className="font-alata text-primary text-3xl sm:text-4xl lg:text-[44px] leading-tight mb-10 text-center">
        {t('about.mission.title')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {missionItems.map((item, index) => (
          <article
            key={item}
            className="rounded-2xl border border-brand-600/30 bg-gradient-to-br from-white to-background p-6 sm:p-8 flex flex-col items-center text-center shadow-lg"
          >
            <span className="font-alata text-xl text-primary font-semibold mb-2">{String(index + 1).padStart(2, '0')}</span>
            <p className="font-nunito text-base sm:text-lg text-brand-900 leading-relaxed">{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default MissionSection;
