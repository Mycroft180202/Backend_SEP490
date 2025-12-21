import React from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';

const CustomBreadcrumbs = ({ breadcrumbs }) => {
  const navigate = useNavigate();

  return (
        <nav className="w-full pl-4 py-2" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1">
            {breadcrumbs.map((crumb, idx) => (
              <li key={crumb.label} className="flex items-center">
                {idx !== 0 && (
                  <span className="mx-1 text-gray-400 select-none">/</span>
                )}
                {crumb.href && idx !== breadcrumbs.length - 1 ? (
                  <a
                    href={crumb.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-150"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="font-semibold text-blue-700">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
  );
};

export default CustomBreadcrumbs;
