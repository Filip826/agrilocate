export type Database = {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string;
          user_id: string;
          device_name: string;
          device_id: string;
          api_key: string;
          is_online: boolean;
          last_seen: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_name: string;
          device_id: string;
          api_key: string;
          is_online?: boolean;
          last_seen?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_name?: string;
          device_id?: string;
          api_key?: string;
          is_online?: boolean;
          last_seen?: string | null;
          created_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          device_id: string;
          latitude: number;
          longitude: number;
          altitude: number | null;
          speed: number | null;
          accuracy: number | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          latitude: number;
          longitude: number;
          altitude?: number | null;
          speed?: number | null;
          accuracy?: number | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          latitude?: number;
          longitude?: number;
          altitude?: number | null;
          speed?: number | null;
          accuracy?: number | null;
          timestamp?: string;
        };
      };
    };
  };
};
