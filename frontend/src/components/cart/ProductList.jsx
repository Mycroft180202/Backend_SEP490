import React from 'react';
import Pagination from '../shop/Pagination';

const imgLine9 = "/images/Line9.png";
const imgLine12 = "/images/Line12.png";
const imgVuesaxLinearCloseCircle = "/images/close-circle.png";

const ProductList = () => {
  const renderProduct = (productName, size, price) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: 'Nunito, sans-serif',
      fontSize: '18px',
      lineHeight: '32px',
      color: 'black',
      marginBottom: '16px',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <p>{productName}</p>
        <p style={{
          fontSize: '16px',
          lineHeight: '24px',
        }}>{size}</p>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <a href="#" style={{
          textDecoration: 'none',
          color: '#000',
          fontSize: '24px',
        }}>-</a>
        <p>1</p>
        <a href="#" style={{
          textDecoration: 'none',
          color: '#000',
          fontSize: '24px',
        }}>+</a>
      </div>
      <p style={{
        fontFamily: 'Alata, sans-serif',
        fontSize: '20px',
        lineHeight: '32px',
        color: '#9e211f',
      }}>{price}</p>
      <img src={imgVuesaxLinearCloseCircle} alt="close" style={{
        width: '24px',
        height: '24px',
      }} />
    </div>
  );

  const renderHeader = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'Nunito, sans-serif',
      fontSize: '18px',
      lineHeight: '32px',
      color: 'black',
      marginBottom: '16px',
    }}>
      <p>Sản phẩm</p>
      <p>Số lượng</p>
      <p>Giá</p>
    </div>
  );

  const renderPaymentSection = () => (
    <div style={{
      position: 'absolute',
      right: '-24px',
      top: '0',
      width: '368px',
      backgroundColor: '#dbefe2',
      borderRadius: '12px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      <p style={{
        fontFamily: 'Alata, sans-serif',
        fontSize: '24px',
        lineHeight: '48px',
        textAlign: 'center',
        color: 'black',
      }}>Thanh toán</p>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'Nunito, sans-serif',
        fontSize: '18px',
        lineHeight: '32px',
        color: 'black',
      }}>
        <p>Giá</p>
        <p>50.000đ</p>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'Nunito, sans-serif',
        fontSize: '18px',
        lineHeight: '32px',
        color: 'black',
      }}>
        <p>Phí ship</p>
        <p>30.000đ</p>
      </div>
      <div style={{
        height: '1px',
        backgroundImage: `url(${imgLine12})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}></div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'Nunito, sans-serif',
        fontSize: '18px',
        lineHeight: '32px',
        color: 'black',
      }}>
        <p>Thành tiền</p>
        <p style={{
          fontFamily: 'Alata, sans-serif',
          fontSize: '20px',
          lineHeight: '32px',
          color: '#9e211f',
        }}>80.000đ</p>
      </div>
      <button style={{
        backgroundColor: '#9e211f',
        color: '#feffff',
        fontFamily: 'Nunito, sans-serif',
        fontSize: '18px',
        lineHeight: '32px',
        borderRadius: '12px',
        padding: '6px 24px',
        cursor: 'pointer',
      }}>Mua hàng</button>
    </div>
  );

  return (
    <div style={{
      position: 'relative',
      width: '1128px',
      margin: '0 auto',
    }}>
      <div style={{
        width: '760px',
        float: 'left',
      }}>
        {renderHeader()}
        <div style={{
          height: '1px',
          backgroundImage: `url(${imgLine9})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          margin: '16px 0',
        }}></div>

        {[ // List of products without grouping by shop
          { name: 'Chuồn chuồn tre Thạch Xá', size: '15x15cm', price: '50.000đ' },
          { name: 'Chuồn chuồn tre Thạch Xá', size: '15x15cm', price: '50.000đ' },
          { name: 'Chuồn chuồn tre Thạch Xá', size: '15x15cm', price: '50.000đ' },
          { name: 'Chuồn chuồn tre Thạch Xá', size: '15x15cm', price: '50.000đ' },
        ].map((product, index) => (
          <React.Fragment key={index}>{renderProduct(product.name, product.size, product.price)}</React.Fragment>
        ))}

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '24px',
        }}>
          <Pagination />
        </div>
      </div>
      {renderPaymentSection()}
    </div>           
  );
};

export default ProductList;