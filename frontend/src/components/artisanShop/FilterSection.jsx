import React from 'react';

const FilterSection = () => {
  return (
    <div className="filter-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '24px', position: 'relative' }}>
      <div className="filter-options" style={{ display: 'flex', alignItems: 'baseline', gap: '24px', padding: '0 144px', width: '100%' }}>
        <p style={{ fontFamily: 'Alata, sans-serif', fontSize: '20px', lineHeight: '32px', color: '#9e211f' }}>Bán chạy</p>
        <div style={{ width: '8px', height: '8px' }}>
          <img src="https://www.figma.com/api/mcp/asset/8e1d58c4-7c39-4eb1-b52c-daebbae95dfb" alt="Ellipse" style={{ width: '100%', height: '100%' }} />
        </div>
        <p style={{ fontFamily: 'Alata, sans-serif', fontSize: '20px', lineHeight: '32px', color: '#a0a0a0' }}>Tất cả sản phẩm</p>
      </div>
      <div className="divider" style={{ width: '1151px', height: '2px', position: 'relative' }}>
        <img src="https://www.figma.com/api/mcp/asset/5418cd59-b8ea-4c69-a3b6-df949e3a9ba3" alt="Divider" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="filter-right" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px', paddingRight: '24px', marginTop: '16px', width: '100%' }}>
        <div className="price-filter" style={{ display: 'flex', alignItems: 'center', border: '0.5px solid #a0a0a0', borderRadius: '12px', padding: '6px 16px', width: '200px' }}>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: '18px', lineHeight: '32px', color: '#a0a0a0' }}>Giá</span>
          <img src="https://www.figma.com/api/mcp/asset/ac525cb9-9a87-492f-860f-3c8b8f2ad90f" alt="Arrow Down" style={{ width: '24px', height: '24px' }} />
        </div>
        <img src="https://www.figma.com/api/mcp/asset/90861624-0e59-4a2f-ae19-672dd8d419f3" alt="Filter Icon" style={{ width: '24px', height: '24px' }} />
      </div>
      <div className="divider-right" style={{ width: '2px', height: '100%', backgroundColor: '#a0a0a0', position: 'absolute', right: '0', top: '0' }}></div>
    </div>
  );
};

export default FilterSection;
