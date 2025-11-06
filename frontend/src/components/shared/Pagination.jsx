import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ totalPages, pageIndex, setPageIndex }) => {
  if (!totalPages || totalPages < 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100"
        disabled={pageIndex === 1}
        onClick={() => setPageIndex(pageIndex - 1)}
      >
        &lt;
      </button>
      {pages.map((num) => (
        <button
          key={num}
          className={`w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 mx-1
            ${pageIndex === num ? 'bg-[#9e211f] text-white font-bold' : 'bg-white text-black hover:bg-gray-100'}`}
          onClick={() => setPageIndex(num)}
        >
          {num}
        </button>
      ))}
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100"
        disabled={pageIndex === totalPages}
        onClick={() => setPageIndex(pageIndex + 1)}
      >
        &gt;
      </button>
    </div>
  );
};

Pagination.propTypes = {
  totalPages: PropTypes.number.isRequired,
  pageIndex: PropTypes.number.isRequired,
  setPageIndex: PropTypes.func.isRequired,
};

export default Pagination;
