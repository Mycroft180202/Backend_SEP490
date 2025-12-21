import axiosClient from '../../api/axiosConfig';
import { API_ENDPOINTS } from '../../api/endpoints';
import { UserService } from '../users/userService';

const normalizeList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

export const BlogService = {
  getAll: async (params = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.BLOGS.ROOT, { params });
    const items = normalizeList(response.data);

    const authorIds = [...new Set(
      items
        .map((item) => item.authorId || item.authorID)
        .filter((id) => Boolean(id)),
    )];

    const authorMap = new Map();

    if (authorIds.length) {
      await Promise.all(
        authorIds.map(async (authorId) => {
          try {
            const profile = await UserService.getById(authorId);
            if (profile) {
              const resolvedName = profile.displayName
                || profile.username
                || profile.email
                || '';
              if (resolvedName) {
                authorMap.set(authorId, resolvedName);
              }
            }
          } catch (error) {
            console.error('BlogService author lookup failed:', error);
          }
        }),
      );
    }

    const enrichedItems = items.map((item) => {
      const authorKey = item.authorId || item.authorID;
      return {
        ...item,
        displayName:
          authorMap.get(authorKey)
          || item.authorName
          || item.author
          || 'G90 Editorial',
      };
    });

    return {
      raw: response.data,
      items: enrichedItems,
    };
  },

  getById: async (id) => {
    const response = await axiosClient.get(API_ENDPOINTS.BLOGS.BY_ID(id));
    const raw = response.data?.data ?? response.data;

    if (!raw || typeof raw !== 'object') {
      return raw;
    }

    const enriched = { ...raw };
    const authorId = raw.authorId || raw.authorID;

    if (authorId) {
      try {
        const profile = await UserService.getById(authorId);
        if (profile) {
          enriched.displayName = profile.displayName
            || profile.username
            || profile.email
            || enriched.displayName
            || enriched.authorName
            || enriched.author
            || 'G90 Editorial';
        }
      } catch (error) {
        console.error('BlogService getById author lookup failed:', error);
      }
    }

    return enriched;
  },

  create: async (payload) => {
    const response = await axiosClient.post(API_ENDPOINTS.BLOGS.ROOT, payload, {
      headers: {
        'Content-Type': payload instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    });
    return response.data;
  },

  update: async (id, payload) => {
    const response = await axiosClient.put(
      API_ENDPOINTS.BLOGS.ROOT,
      payload,
      {
        params: { id },
        headers: {
          'Content-Type': payload instanceof FormData ? 'multipart/form-data' : 'application/json',
        },
      },
    );
    return response.data;
  },

  delete: async (id) => {
    if (!id) {
      throw new Error('Missing blog id');
    }
    const response = await axiosClient.delete(
      API_ENDPOINTS.BLOGS.ROOT,
      { params: { id } },
    );
    return response.data;
  },
};
