export const resolveProductId = (productOrId) => {
  if (productOrId && typeof productOrId === 'object') {
    return (
      productOrId.id
      ?? productOrId.productId
      ?? productOrId.productID
      ?? productOrId.Id
      ?? null
    );
  }
  return productOrId ?? null;
};

export const resolveProductArtisanId = (product) => {
  if (!product) return null;

  const direct = (
    product.artisanId
    ?? product.artisanID
    ?? product.artisan_id
    ?? product.artisan?.id
    ?? product.artisan?.userId
    ?? product.artisan?.userID
    ?? product.ownerId
    ?? product.ownerID
    ?? null
  );

  if (direct && typeof direct === 'object') {
    return (
      direct.id
      ?? direct.userId
      ?? direct.userID
      ?? direct.value
      ?? null
    );
  }

  return direct ?? null;
};

const normalizeRoleName = (role) => {
  if (!role) return '';
  if (typeof role === 'string') return role;
  return role.name || role.roleName || role.code || '';
};

const resolveUserId = (userInfo) => (
  userInfo?.userID
  ?? userInfo?.userId
  ?? userInfo?.id
  ?? null
);

export const isOwnedByCurrentArtisan = (product, userInfo) => {
  if (!product || !userInfo) return false;
  const userId = resolveUserId(userInfo);
  if (userId == null) return false;

  const roles = Array.isArray(userInfo.roles) ? userInfo.roles : [];
  const isArtisan = roles.some((role) => normalizeRoleName(role) === 'Artisan');
  if (!isArtisan) return false;

  const ownerId = resolveProductArtisanId(product);
  if (ownerId == null) return false;

  return String(ownerId) === String(userId);
};
