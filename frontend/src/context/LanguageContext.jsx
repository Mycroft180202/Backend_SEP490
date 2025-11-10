import React, {
  createContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';

const translations = {
  vi: {
    nav: {
      home: 'Trang chu',
      about: 'Ve chung toi',
      shop: 'Cua hang',
      blog: 'Blog',
      contact: 'Lien he',
      policy: 'Chinh sach',
    },
    header: {
      searchPlaceholder: 'Tim kiem...',
      login: 'Dang nhap',
      profile: 'Tai khoan cua toi',
      orders: 'Don mua',
      logout: 'Dang xuat',
      notificationsEmpty: 'Khong co thong bao moi.',
      cartTooltip: 'Gio hang',
    },
    home: {
      collections: {
        title: 'Bo suu tap san pham',
        description: 'Kham pha nhung san pham thu cong mang dam net truyen thong Viet Nam',
        empty: 'Khong co san pham nao.',
      },
    },
    shop: {
      empty: 'Khong co san pham nao.',
      loading: 'Dang tai san pham...',
      banner: {
        title: 'Chao mung den voi gian hang Hoa Lac Handicraft',
        subtitle: 'Noi quy tu cac tac pham thu cong tinh xao',
        cta: 'Kham pha san pham',
      },
      filter: {
        allProductsHeading: 'Tat ca san pham',
        allLabel: 'Tat ca',
        unknownCategory: 'Khong ten',
        searchPlaceholder: 'Tim kiem san pham...',
        sortButton: 'Sap xep',
        sortTitle: 'Sap xep theo:',
        scrollLeft: 'Cuon ve trai',
        scrollRight: 'Cuon ve phai',
        sort: {
          default: 'Mac dinh',
          lowToHigh: 'Gia thap den cao',
          highToLow: 'Gia cao den thap',
          aToZ: 'Ten A -> Z',
          zToA: 'Ten Z -> A',
        },
      },
    },
    productCard: {
      fallbackDescription: 'San pham thu cong mang dam net truyen thong',
      viewDetail: 'Xem chi tiet',
      stock: 'Con {stock} san pham',
      sold: '{count} luot ban',
      rating: '({count})',
      priceSuffix: ' VND',
    },
    relation: {
      title: 'San pham tuong tu',
      subtitle: 'Kham pha them cac san pham thu cong tinh xao',
      loading: 'Dang tai san pham lien quan...',
    },
    contact: {
      title: 'Lien he',
      description: 'Dung ngan ngai gui cho chung toi thong diep cua ban. Doi ngu Hoa Lac Handicraft luon san sang lang nghe.',
      form: {
        name: 'Ho va ten',
        email: 'Email',
        message: 'Noi dung',
        submit: 'Gui tin nhan',
      },
      infoTitle: 'Thong tin lien he',
      office: 'Van phong',
      address: 'Khu Cong nghe cao Hoa Lac, Thach That, Ha Noi',
      phone: 'Dien thoai',
      emailLabel: 'Email',
      hoursTitle: 'Gio lam viec',
      hoursValue: 'Thu 2 - Thu 6: 8:30 - 17:30',
    },
    policy: {
      title: 'Chinh sach',
      updated: 'Cap nhat lan cuoi: Thang 11/2025',
      privacyTitle: 'Chinh sach bao mat',
      privacyContent: 'Chung toi cam ket bao ve du lieu ca nhan cua ban va chi su dung de cung cap dich vu. Moi thong tin duoc ma hoa va luu tru an toan.',
      shippingTitle: 'Chinh sach van chuyen',
      shippingContent: 'Don hang duoc xu ly trong 24 gio va giao trong 3-5 ngay lam viec. Chung toi ho tro giao hang toan quoc qua cac doi tac uy tin.',
      returnTitle: 'Chinh sach doi tra',
      returnContent: 'Ban co the doi tra san pham trong vong 7 ngay ke tu khi nhan hang neu san pham bi loi hoac hu hong trong qua trinh van chuyen.',
    },
    general: {
      errorPrefix: 'Loi: ',
    },
  },
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      shop: 'Shop',
      blog: 'Blog',
      contact: 'Contact',
      policy: 'Policies',
    },
    header: {
      searchPlaceholder: 'Search...',
      login: 'Sign in',
      profile: 'My account',
      orders: 'Orders',
      logout: 'Sign out',
      notificationsEmpty: 'No new notifications.',
      cartTooltip: 'Cart',
    },
    home: {
      collections: {
        title: 'Product collections',
        description: 'Discover handcrafted creations rooted in Vietnamese traditions',
        empty: 'No products available.',
      },
    },
    shop: {
      empty: 'No products available.',
      loading: 'Loading products...',
      banner: {
        title: 'Welcome to the Hoa Lac Handicraft boutique',
        subtitle: 'A curated collection of refined handcrafted pieces',
        cta: 'Discover products',
      },
      filter: {
        allProductsHeading: 'All products',
        allLabel: 'All',
        unknownCategory: 'Untitled',
        searchPlaceholder: 'Search products...',
        sortButton: 'Sort',
        sortTitle: 'Sort by:',
        scrollLeft: 'Scroll left',
        scrollRight: 'Scroll right',
        sort: {
          default: 'Default',
          lowToHigh: 'Price: low to high',
          highToLow: 'Price: high to low',
          aToZ: 'Name A -> Z',
          zToA: 'Name Z -> A',
        },
      },
    },
    productCard: {
      fallbackDescription: 'Handcrafted piece inspired by tradition',
      viewDetail: 'View detail',
      stock: '{stock} items left',
      sold: '{count} sold',
      rating: '({count})',
      priceSuffix: ' VND',
    },
    relation: {
      title: 'Similar products',
      subtitle: 'Explore more refined handcrafted creations',
      loading: 'Loading related products...',
    },
    contact: {
      title: 'Contact',
      description: 'Feel free to drop us a message. The Hoa Lac Handicraft team is ready to listen and support you.',
      form: {
        name: 'Full name',
        email: 'Email',
        message: 'Message',
        submit: 'Send message',
      },
      infoTitle: 'Contact information',
      office: 'Office',
      address: 'Hoa Lac Hi-Tech Park, Thach That, Ha Noi',
      phone: 'Phone',
      emailLabel: 'Email',
      hoursTitle: 'Working hours',
      hoursValue: 'Monday - Friday: 8:30 AM - 5:30 PM',
    },
    policy: {
      title: 'Policies',
      updated: 'Last updated: November 2025',
      privacyTitle: 'Privacy policy',
      privacyContent: 'We are committed to protecting your personal data and only use it to deliver our services. All information is encrypted and stored securely.',
      shippingTitle: 'Shipping policy',
      shippingContent: 'Orders are processed within 24 hours and delivered within 3-5 business days nationwide via trusted partners.',
      returnTitle: 'Return policy',
      returnContent: 'You can return products within 7 days of delivery if they are defective or damaged during transportation.',
    },
    general: {
      errorPrefix: 'Error: ',
    },
  },
};

export const LanguageContext = createContext({
  language: 'vi',
  changeLanguage: () => {},
  t: (key) => key,
});

const getStoredLanguage = () => {
  if (typeof window === 'undefined') return 'vi';
  return localStorage.getItem('app_language') || 'vi';
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getStoredLanguage);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
  }, []);

  const translate = useCallback(
    (key, replacements = {}) => {
      if (!key) return '';

      const rawValue = key.split('.').reduce((acc, part) => {
        if (acc && typeof acc === 'object') {
          return acc[part];
        }
        return undefined;
      }, translations[language]);

      if (typeof rawValue !== 'string') {
        return key;
      }

      return Object.keys(replacements).reduce(
        (acc, placeholder) => acc.replace(`{${placeholder}}`, replacements[placeholder]),
        rawValue,
      );
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      changeLanguage,
      t: translate,
    }),
    [language, changeLanguage, translate],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
