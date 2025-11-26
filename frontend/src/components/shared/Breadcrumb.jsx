import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const Breadcrumb = ({
  items = [],
  floating = false,
  className = '',
}) => {
  const normalized = items.length
    ? items
    : [{ label: 'Trang chủ', href: '/' }];

  const renderItems = (isFloating) => (
    <div
      className={`flex flex-wrap items-center gap-2 text-sm font-nunito ${
        isFloating ? 'text-white' : 'text-gray-600'
      }`}
    >
      {normalized.map((item, index) => {
        const isLast = index === normalized.length - 1;
        const linkClass = isFloating
          ? 'hover:text-yellow-200 transition-colors'
          : 'hover:text-primary transition-colors';
        const textClass = isLast
          ? (isFloating ? 'text-white font-semibold' : 'text-gray-900 font-semibold')
          : undefined;
        const content = item.href && !isLast ? (
          <Link to={item.href} className={linkClass}>
            {item.label}
          </Link>
        ) : (
          <span className={textClass}>{item.label}</span>
        );

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && <span className={isFloating ? 'text-white/80' : undefined}>/</span>}
            {content}
          </React.Fragment>
        );
      })}
    </div>
  );

  if (floating) {
    return (
      <nav
        className={`inline-flex items-center bg-black/35 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-white/20 ${className}`}
      >
        {renderItems(true)}
      </nav>
    );
  }

  return (
    <nav className={`bg-gray-50 border-b border-gray-200 ${className}`}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-4">
        {renderItems(false)}
      </div>
    </nav>
  );
};

Breadcrumb.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    href: PropTypes.string,
  })),
  floating: PropTypes.bool,
  className: PropTypes.string,
};

export default Breadcrumb;
