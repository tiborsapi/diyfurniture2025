export interface BodyDto {
  width: string;
  heigth: string; // Backend így várja (typo-val)
  depth: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  bodies?: BodyDto[];
}

export interface ProjectItem extends CreateProjectDto {
  id: number;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string;
  bodies?: BodyDto[];
}

export interface UpdateProjectResponse {
  id: number;
  name: string;
  description: string;
  updatedAt: string;
}

export interface ProjectVersionResponse {
  id: number;
  versionNumber: number;
  savedAt: string;
  versionNote: string;
  name: string;
  description: string;
}

export interface ProjectBodyDto {
  id: number;
  width: number;
  heigth: number; // Backend typo
  depth: number;
}

export interface ProjectVersionDto {
  id: number;
  versionNumber: number;
  savedAt: string;
  versionNote: string;
  name: string;
  description: string;
  bodies: ProjectBodyDto[];
}

export interface ProjectDetailResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  versions: ProjectVersionDto[];
}
