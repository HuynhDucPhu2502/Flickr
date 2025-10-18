export type PhotoDoc = {
  id: string;
  url: string;
  storagePath: string;
  width: number;
  height: number;
  isMain: boolean;
  order: number;
  uploadedAt: any;
  deletedAt?: any;
};

export type Panel =
  | null
  | "name"
  | "birthday"
  | "occupation"
  | "gender"
  | "education"
  | "location"
  | "preferences";
