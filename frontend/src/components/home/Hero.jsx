import React, { useContext, useMemo } from 'react';
import { Link } from "react-router-dom";
import { SECTION_TITLE_CLASS, SECTION_SUBTITLE_CLASS, PRIMARY_BUTTON_CLASS } from '../../utils/homeTheme';
import heroBg from '../../assets/images/hero-bg.jpg';
import slideOneImg from '../../assets/images/products/Slide1.jpg';
import slideTwoImg from '../../assets/images/products/slide2.jpg';
import slideThreeImg from '../../assets/images/products/slide3.jpg';
import dragonfly1 from '../../assets/images/dragonfly1.png';
import dragonfly2 from '../../assets/images/dragonfly2.png';
import lantern1 from '../../assets/images/lantern1.png';
import lantern2 from '../../assets/images/lantern2.png';
import { LanguageContext } from '../../context/LanguageContext';

const Hero = () => {
  const { t } = useContext(LanguageContext);
  const overlayTitleLines = useMemo(() => t('home.hero.overlayTitle').split('\n'), [t]);
  const heroValues = useMemo(
    () => [
      {
        title: t('home.hero.values.heritage.title'),
        description: t('home.hero.values.heritage.description'),
      },
      {
        title: t('home.hero.values.culture.title'),
        description: t('home.hero.values.culture.description'),
      },
      {
        title: t('home.hero.values.contemporary.title'),
        description: t('home.hero.values.contemporary.description'),
      },
    ],
    [t],
  );

  return (
    <section className="relative w-full bg-background pb-0">
      {/* Hero Section */}
        <div className="relative hero-animation-trigger w-full h-[400px] md:h-[600px] lg:h-[800px] overflow-hidden bg-gradient-to-br from-[#AE4644] to-[#710004]" >
        {/* Background elements */}
        <div className="absolute inset-0">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(0deg, rgba(16, 21, 39, 0.65), rgba(16, 21, 39, 0.65)),
                url(${slideOneImg}),
                url(${slideTwoImg}),
                url(${slideThreeImg}),
                url(${heroBg})
              `,
              backgroundSize: 'cover, 33.34% 100%, 33.34% 100%, 33.34% 100%, cover',
              backgroundPosition: 'center, left center, center center, right center, center',
              backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat, no-repeat',
              filter: 'blur(2px)',
              transform: 'scale(1.05)'
            }}
          ></div>
          
          {/* Decorative elements */}
          <div className="absolute top-1/4 left-1/4 w-24 h-24 animate-float">
            <img src={dragonfly1} alt="" className="w-full h-full" />
          </div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 animate-float-delayed">
            <img src={dragonfly2} alt="" className="w-full h-full" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 w-20 h-24 animate-float">
            <img src={lantern1} alt="" className="w-full h-full" />
          </div>
          <div className="absolute bottom-1/3 right-1/4 w-20 h-24 animate-float-delayed">
            <img src={lantern2} alt="" className="w-full h-full" />
          </div>
        </div>

        {/* Initial Content Container - will be hidden after animation */}
        <div 
          className="relative z-10 h-full flex items-center justify-center" 
          style={{
            animation: 'fadeOutInitialContent 1s ease-out forwards', 
            animationDelay: '10s'
          }}
        >
          <div className="text-center px-4 max-w-4xl">
            <h2 className="font-nunito text-3xl md:text-4xl lg:text-5xl text-white leading-relaxed font-bold">
              {t('home.hero.initialTitle')}
            </h2>
            <p className="mt-4 font-nunito text-lg md:text-xl text-white/90">
              {t('home.hero.initialDescription')}
            </p>
          </div>
        </div>

        {/* Initial Content Container - will be hidden after animation */}
        {/* Text behind fans */}
        <div className="absolute inset-0 flex items-center justify-center text-intro z-40">
          <div className="max-w-[1000px] flex flex-col items-center gap-8 sm:gap-10 px-4 sm:px-6">
            <div className="flex flex-col items-center gap-5 text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[55px] leading-[1.2em] sm:leading-[1.3em] md:leading-[1.4em] lg:leading-[1.5em] text-white drop-shadow-lg font-bold">
                {overlayTitleLines.map((line, index) => (
                  <React.Fragment key={`${line}-${index}`}>
                    {line}
                    {index < overlayTitleLines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h2>
              
            </div>
             <Link to="/shop">
               <button className={`${PRIMARY_BUTTON_CLASS} sm:px-6 md:px-7 md:py-3 text-sm sm:text-base md:text-lg`}>{t('home.hero.cta')}</button>
             </Link>
          </div>
        </div>

        <div className="absolute -top-[122px] -left-[122px] w-[244px] h-[244px] rounded-full bg-[#761214] blur-[50px]"></div>
        <div className="absolute -top-[122px] right-[-122px] w-[244px] h-[244px] rounded-full bg-[#9E211F] blur-[50px]"></div>

        

        {/* Fans Container */}
        

        <style>{`
          @keyframes foldLeft {
          from {
          transform: translate(-205%, -48%) rotate(0deg) scale(1.1);
          opacity: 1;
          }
          to {
          transform: translate(-270%, -38%) rotate(25deg) scale(1.1);
          opacity: 0;
            }
          }

          @keyframes foldRight {
            from {
              transform: translate(105%, -48%) rotate(0deg) scale(1.1);
              opacity: 1;
            }
            to {
              transform: translate(165%, -40%) rotate(-25deg) scale(1.1);
              opacity: 0;
            }
          }
          

          @keyframes fadeInText {
            0% {
              opacity: 0;
              transform: scale(0.95);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes fadeOutInitialContent {
            0% {
              opacity: 1;
              transform: scale(1);
            }
            100% {
              opacity: 0;
              transform: scale(0.95);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          @keyframes float-delayed {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          .text-intro {
            animation: fadeInText 2s ease-out forwards;
            animation-delay: 10s;
            opacity: 0;
          }

          .animate-float {
            animation: float 3s ease-in-out infinite;
          }

          .animate-float-delayed {
            animation: float-delayed 3s ease-in-out infinite;
            animation-delay: 1.5s;
          }
        `}</style>
      </div>

      {/* Introductory text with improved decorative waves */}
      <div className="relative z-30 -mt-16 sm:-mt-20 lg:-mt-10">
        <div className="relative bg-[#DBEFE2] px-4 sm:px-8 md:px-12 lg:px-[140px] pt-20 md:pt-24 pb-20 md:pb-28 overflow-hidden rounded-t-[48px] md:rounded-t-[64px] shadow-[0_-40px_80px_rgba(28,53,94,0.08)]">
          <div className="absolute top-0 left-0 right-0 -translate-y-full pointer-events-none">
            <svg
              className="w-full h-20 md:h-24"
              viewBox="0 0 1440 120"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <path
                d="M0 120 C240 40 480 40 720 120 C960 200 1200 200 1440 120 L1440 0 L0 0 Z"
                fill="#1C355E"
              />
              <path
                d="M0 118 C240 60 480 60 720 118 C960 176 1200 176 1440 118 L1440 0 L0 0 Z"
                fill="#DBEFE2"
              />
            </svg>
          </div>

          <div className="max-w-5xl mx-auto text-center space-y-12 ">
            <div className="space-y-6">
              <h2 className={`${SECTION_TITLE_CLASS} leading-relaxed md:leading-[1.3]`}>
                {t('home.hero.introTitle')}
              </h2>
              <p className={`${SECTION_SUBTITLE_CLASS} text-[#25344F] leading-relaxed md:leading-[1.95]`}>
                {t('home.hero.introDescription')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {heroValues.map((item) => (
                <div
                  key={item.title}
                  className="bg-white/80 border border-white/60 rounded-3xl p-6 md:p-8 text-left shadow-[0_20px_40px_rgba(28,53,94,0.08)]"
                >
                  <h3 className="font-alata text-xl text-[#1C355E] mb-4">{item.title}</h3>
                  <p className="font-nunito text-sm sm:text-base text-[#3C4A66] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="font-nunito text-base sm:text-lg md:text-xl text-[#1C355E] leading-relaxed">
              <p>
                {t('home.hero.closing')}
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 translate-y-[1px] pointer-events-none">
            <svg
              className="w-full h-16 md:h-20"
              viewBox="0 0 1440 120"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <path
                d="M0 0 C240 80 480 -20 720 60 C960 140 1200 -20 1440 60 L1440 120 L0 120 Z"
                fill="#FFF8E7"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
