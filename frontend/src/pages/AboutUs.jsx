import BannerSection from '../components/aboutUs/BannerSection';
import CloudIntroSection from '../components/aboutUs/CloudIntroSection';
import MissionSection from '../components/aboutUs/MissionSection';
import WhyUsSection from '../components/aboutUs/WhyUsSection';
import Header from '../components/shared/Header';
import Footer from '../components/shared/Footer';

const assets = {
  imgHeaderUser: "https://www.figma.com/api/mcp/asset/616c517f-bd0a-4535-a010-203f948d89fd",
  imgGroup9: "https://www.figma.com/api/mcp/asset/a6184a77-2cdd-445f-8cae-3de585d24eb2",
  imgGroup8: "https://www.figma.com/api/mcp/asset/7c7bbd42-ad69-4056-ba1e-7e89022e12fe",
  imgGroup10: "https://www.figma.com/api/mcp/asset/015e58dd-da96-4043-8518-2301b1e18062",
  imgFrame: "https://www.figma.com/api/mcp/asset/4a9527b3-a620-4fb0-a603-a932a8bf95b3",
  imgFrame1: "https://www.figma.com/api/mcp/asset/9c6a31f5-9265-4479-b43c-9c88775387ea",
  imgEllipse43: "https://www.figma.com/api/mcp/asset/ff0bec51-2ab1-406a-a00a-924244d221d9",
  imgVuesaxLinearLocation: "https://www.figma.com/api/mcp/asset/2dc55a10-b8c8-4b1e-8c3a-931dd7c129b2",
  imgVuesaxLinearSms: "https://www.figma.com/api/mcp/asset/a75392b3-6857-4662-8af9-22f8e75352ea",
  imgVuesaxLinearCall: "https://www.figma.com/api/mcp/asset/730e496b-e5b4-4f81-96e6-7ddaa13a6303",
};

const AboutUs = () => {
  return (
    <div className="bg-[#fdfeee] min-h-screen w-full font-nunito">
      <Header />
      <BannerSection assets={assets} />
      <CloudIntroSection assets={assets} />
      <MissionSection />
      <WhyUsSection assets={assets} />
      <Footer />
    </div>
  );
};

export default AboutUs;
