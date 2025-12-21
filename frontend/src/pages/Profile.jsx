import React, { useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Footer from '../components/shared/Footer';
import Header from '../components/shared/Header';
import Breadcrumb from '../components/shared/Breadcrumb';
import ProfileSection from '../components/profile/profileSection';
import { LanguageContext } from '../context/LanguageContext';
import { NavigationKeys } from '../context/NavigationContext';
import useResolvedNavigationNode from '../hooks/useResolvedNavigationNode';
import useNavigationNode from '../hooks/useNavigationNode';

const Profile = () => {
  const location = useLocation();
  const { t } = useContext(LanguageContext);
  const profileFocus = location.state?.profileFocus || null;

  const homeNode = useMemo(() => {
    const label = t('nav.home');
    return {
      label: label && label !== 'nav.home' ? label : 'Trang chủ',
      href: '/',
    };
  }, [t]);

  const profileLabel = useMemo(() => {
    const label = t('header.profile');
    return label && label !== 'header.profile' ? label : 'Hồ sơ của tôi';
  }, [t]);

  const profileNode = useMemo(() => ({
    label: profileLabel,
    href: '/profile',
  }), [profileLabel]);

  const profileOriginNode = useResolvedNavigationNode({
    locationKey: 'fromProfileOrigin',
    contextKey: NavigationKeys.LAST_PROFILE_ENTRY,
    fallback: homeNode,
  });

  useNavigationNode(
    NavigationKeys.LAST_PROFILE_ENTRY,
    profileOriginNode,
    { enabled: Boolean(profileOriginNode) },
  );

  useNavigationNode(NavigationKeys.LAST_PROFILE_NODE, profileNode);

  const breadcrumbItems = useMemo(() => {
    const items = [homeNode];
    if (
      profileOriginNode
      && profileOriginNode.label
      && profileOriginNode.label !== homeNode.label
    ) {
      items.push(profileOriginNode);
    }
    items.push({ label: profileLabel });
    return items;
  }, [homeNode, profileLabel, profileOriginNode]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <Breadcrumb items={breadcrumbItems} />
      <main className="flex-grow">
        <ProfileSection initialFocus={profileFocus} profileNode={profileNode} />
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
