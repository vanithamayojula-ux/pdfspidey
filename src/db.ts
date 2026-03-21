import Dexie, { type Table } from 'dexie';

export interface PDFDocument {
  id?: number;
  name: string;
  category: string;
  folderId?: number;
  size: number;
  type: string;
  data: Blob;
  createdAt: number;
}

export interface Category {
  id?: number;
  name: string;
}

export interface Folder {
  id?: number;
  name: string;
  categoryName: string;
  parentId?: number;
}

export class PDFVaultDB extends Dexie {
  pdfs!: Table<PDFDocument>;
  categories!: Table<Category>;
  folders!: Table<Folder>;

  constructor() {
    super('PDFVaultDB');
    this.version(1).stores({
      pdfs: '++id, name, category, createdAt',
      categories: '++id, &name'
    });
    this.version(2).stores({
      pdfs: '++id, name, category, folderId, createdAt',
      categories: '++id, &name',
      folders: '++id, name, categoryName'
    });
    this.version(3).stores({
      pdfs: '++id, name, category, folderId, createdAt',
      categories: '++id, &name',
      folders: '++id, name, categoryName, parentId'
    });
  }
}

export const db = new PDFVaultDB();

// Initialize default categories if they don't exist
db.on('populate', () => {
  db.categories.bulkAdd([
    { name: 'Work' },
    { name: 'Personal' },
    { name: 'Education' },
    { name: 'Finance' },
    { name: 'Other' }
  ]);
});
