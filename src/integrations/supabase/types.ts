export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bucket_questions: {
        Row: {
          bucket_id: string
          question_id: string
        }
        Insert: {
          bucket_id: string
          question_id: string
        }
        Update: {
          bucket_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_questions_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bucket_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      buckets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      display_buckets: {
        Row: {
          bucket_id: string
          display_id: string
        }
        Insert: {
          bucket_id: string
          display_id: string
        }
        Update: {
          bucket_id?: string
          display_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "display_buckets_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "display_buckets_display_id_fkey"
            columns: ["display_id"]
            isOneToOne: false
            referencedRelation: "displays"
            referencedColumns: ["id"]
          },
        ]
      }
      displays: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          join_code: string
          name: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          join_code: string
          name: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          join_code?: string
          name?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string
          current_question_id: string | null
          display_id: string | null
          ended_at: string | null
          id: string
          started_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_question_id?: string | null
          display_id?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_question_id?: string | null
          display_id?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_current_question_id_fkey"
            columns: ["current_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_display_id_fkey"
            columns: ["display_id"]
            isOneToOne: false
            referencedRelation: "displays"
            referencedColumns: ["id"]
          },
        ]
      }
      player_answers: {
        Row: {
          answer: string
          created_at: string
          game_id: string | null
          id: string
          is_correct: boolean | null
          player_id: string | null
          points_earned: number | null
          question_id: string | null
          time_taken: number | null
        }
        Insert: {
          answer: string
          created_at?: string
          game_id?: string | null
          id?: string
          is_correct?: boolean | null
          player_id?: string | null
          points_earned?: number | null
          question_id?: string | null
          time_taken?: number | null
        }
        Update: {
          answer?: string
          created_at?: string
          game_id?: string | null
          id?: string
          is_correct?: boolean | null
          player_id?: string | null
          points_earned?: number | null
          question_id?: string | null
          time_taken?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_answers_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      player_game_history: {
        Row: {
          correct_answers: number
          created_at: string
          game_id: string | null
          id: string
          player_id: string | null
          score: number
          total_questions: number
        }
        Insert: {
          correct_answers?: number
          created_at?: string
          game_id?: string | null
          id?: string
          player_id?: string | null
          score?: number
          total_questions?: number
        }
        Update: {
          correct_answers?: number
          created_at?: string
          game_id?: string | null
          id?: string
          player_id?: string | null
          score?: number
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_game_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_game_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "registered_players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          display_id: string | null
          id: string
          is_active: boolean | null
          name: string
          score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_display_id_fkey"
            columns: ["display_id"]
            isOneToOne: false
            referencedRelation: "displays"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category_id: string | null
          correct_answer: string
          created_at: string
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          id: string
          options: Json
          text: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          correct_answer: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string
          options: Json
          text: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          correct_answer?: string
          created_at?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string
          options?: Json
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      registered_players: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          intermission_duration: number | null
          leaderboard_frequency: number | null
          owner_id: string | null
          question_duration: number | null
          reveal_duration: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          intermission_duration?: number | null
          leaderboard_frequency?: number | null
          owner_id?: string | null
          question_duration?: number | null
          reveal_duration?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          intermission_duration?: number | null
          leaderboard_frequency?: number | null
          owner_id?: string | null
          question_duration?: number | null
          reveal_duration?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      slides: {
        Row: {
          content: string | null
          created_at: string
          display_order: number | null
          enabled: boolean | null
          id: string
          image_url: string | null
          owner_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          display_order?: number | null
          enabled?: boolean | null
          id?: string
          image_url?: string | null
          owner_id?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          display_order?: number | null
          enabled?: boolean | null
          id?: string
          image_url?: string | null
          owner_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_join_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      difficulty_level: "easy" | "medium" | "hard"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      difficulty_level: ["easy", "medium", "hard"],
    },
  },
} as const
