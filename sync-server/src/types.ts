export type ServerConfig = {
  host: string;
  port: number;
  storagePath: string;
  accessToken: string;
  workspaceIndex: {
    maxBackups: number;
  };
  imageGc: {
    intervalHours: number;
  };
};
