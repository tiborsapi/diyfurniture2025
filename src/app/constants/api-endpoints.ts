export const API_ENDPOINTS = {
  FURNITURE: {
    BASE: "/furniture",
    ALL: "/furniture/all",
    BY_ID: (id: number) => `/furniture/${id}`,
  },
  BOM: {
    BASE: "/bom",
    BY_BODY_ID: (bodyId: number) => `/bom?bodyId=${bodyId}`,
  },
  PROJECTS: {
    BASE: "/projects",
    BY_ID: (id: number) => `/projects/${id}`,
    VERSIONS: (projectId: number) => `/projects/${projectId}/versions`,
  },
} as const;

export const API_URL = "http://localhost/api";
