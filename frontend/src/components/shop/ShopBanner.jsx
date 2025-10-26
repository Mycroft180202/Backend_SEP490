import React from 'react';

const ShopBanner = ({ image = '/images/ShopBanner.jpg', link = '', alt = 'Shop banner', className = '' }) => {
	return (
		<section className="shop-banner-section">
			{link ? (
				<a href={link} aria-label={alt}>
					<img
						src={image}
						alt={alt}
						className={`w-full h-auto object-cover ${className}`.trim()}
					/>
				</a>
			) : (
				<img
					src={image}
					alt={alt}
					className={`w-full h-auto object-cover ${className}`.trim()}
				/>
			)}
		</section>
	);
};

export default ShopBanner;
