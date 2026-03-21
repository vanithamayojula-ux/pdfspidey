export interface PDFMetadata {
  id: number;
  name: string;
  category: string;
  folderId?: number;
  size: number;
  type: string;
  createdAt: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface Folder {
  id: number;
  name: string;
  categoryName: string;
}
