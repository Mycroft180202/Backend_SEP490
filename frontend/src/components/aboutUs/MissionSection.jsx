import React, { useContext, useMemo } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { SECTION_TITLE_CLASS, SECTION_SUBTITLE_CLASS } from '../../utils/homeTheme';

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
    <section className="px-4 sm:px-8 lg:px-12 py-14 lg:py-20 bg-[#FFF6E9]">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-[36px] bg-white/80 border border-white/60 shadow-[0_30px_70px_rgba(28,53,94,0.10)] p-8 sm:p-12 lg:p-14">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className={`${SECTION_TITLE_CLASS} !text-[#1C355E]`}>{t('about.mission.title')}</h2>
            <p className={`${SECTION_SUBTITLE_CLASS} mt-4`}>
              {t('about.cloudIntro.description')}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {missionItems.map((item, index) => (
              <article
                key={item}
                className="rounded-3xl border border-[#1C355E]/10 bg-white px-6 py-7 sm:px-7 sm:py-8 text-left shadow-[0_18px_40px_rgba(28,53,94,0.08)]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FBC04C]/25 text-[#1C355E] font-alata text-lg">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="font-alata text-lg text-[#1C355E]">{t('about.mission.title')}</p>
                </div>
                <p className="mt-4 font-nunito text-sm sm:text-base text-[#3C4A66] leading-relaxed">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
