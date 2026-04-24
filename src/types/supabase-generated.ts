export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      carpinteiros: {
        Row: {
          cidade: string
          cor_primaria: string | null
          cpf_cnpj: string
          created_at: string
          custos_adicionais_padrao: number
          endereco: string
          estado: string
          id: string
          imposto_padrao: number
          logo_url: string | null
          madeireira_id: string | null
          margem_lucro_padrao: number
          nome: string
          telefone: string
          termos_condicoes_padrao: string | null
          updated_at: string
          user_id: string
          valor_hora_mao_obra: number
        }
        Insert: {
          cidade?: string
          cor_primaria?: string | null
          cpf_cnpj: string
          created_at?: string
          custos_adicionais_padrao?: number
          endereco?: string
          estado?: string
          id?: string
          imposto_padrao?: number
          logo_url?: string | null
          madeireira_id?: string | null
          margem_lucro_padrao?: number
          nome: string
          telefone: string
          termos_condicoes_padrao?: string | null
          updated_at?: string
          user_id: string
          valor_hora_mao_obra?: number
        }
        Update: {
          cidade?: string
          cor_primaria?: string | null
          cpf_cnpj?: string
          created_at?: string
          custos_adicionais_padrao?: number
          endereco?: string
          estado?: string
          id?: string
          imposto_padrao?: number
          logo_url?: string | null
          madeireira_id?: string | null
          margem_lucro_padrao?: number
          nome?: string
          telefone?: string
          termos_condicoes_padrao?: string | null
          updated_at?: string
          user_id?: string
          valor_hora_mao_obra?: number
        }
        Relationships: [
          {
            foreignKeyName: "carpinteiros_madeireira_id_fkey"
            columns: ["madeireira_id"]
            isOneToOne: false
            referencedRelation: "madeireiras"
            referencedColumns: ["id"]
          },
        ]
      }
      comprimentos_madeira_m3: {
        Row: {
          comprimento_m: number
          created_at: string
          disponivel: boolean
          id: string
          madeira_m3_id: string
        }
        Insert: {
          comprimento_m: number
          created_at?: string
          disponivel?: boolean
          id?: string
          madeira_m3_id: string
        }
        Update: {
          comprimento_m?: number
          created_at?: string
          disponivel?: boolean
          id?: string
          madeira_m3_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprimentos_madeira_m3_madeira_m3_id_fkey"
            columns: ["madeira_m3_id"]
            isOneToOne: false
            referencedRelation: "madeiras_m3"
            referencedColumns: ["id"]
          },
        ]
      }
      especies_madeira: {
        Row: {
          created_at: string
          custo_m3: number
          id: string
          madeireira_id: string
          margem_lucro_pct: number
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo_m3: number
          id?: string
          madeireira_id: string
          margem_lucro_pct?: number
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo_m3?: number
          id?: string
          madeireira_id?: string
          margem_lucro_pct?: number
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "especies_madeira_madeireira_id_fkey"
            columns: ["madeireira_id"]
            isOneToOne: false
            referencedRelation: "madeireiras"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_orcamento: {
        Row: {
          acabamento_id: string | null
          acabamento_nome: string | null
          acabamento_percentual: number | null
          comprimento_id: string | null
          comprimento_real_m: number | null
          especie_nome: string | null
          espessura_cm: number | null
          id: string
          item_preco_id: string | null
          largura_cm: number | null
          madeira_m3_id: string | null
          nome: string
          orcamento_id: string
          origem: string
          outro_produto_id: string | null
          preco_unitario: number
          quantidade: number
          subtotal: number
          unidade: string
        }
        Insert: {
          acabamento_id?: string | null
          acabamento_nome?: string | null
          acabamento_percentual?: number | null
          comprimento_id?: string | null
          comprimento_real_m?: number | null
          especie_nome?: string | null
          espessura_cm?: number | null
          id?: string
          item_preco_id?: string | null
          largura_cm?: number | null
          madeira_m3_id?: string | null
          nome: string
          orcamento_id: string
          origem?: string
          outro_produto_id?: string | null
          preco_unitario: number
          quantidade: number
          subtotal: number
          unidade: string
        }
        Update: {
          acabamento_id?: string | null
          acabamento_nome?: string | null
          acabamento_percentual?: number | null
          comprimento_id?: string | null
          comprimento_real_m?: number | null
          especie_nome?: string | null
          espessura_cm?: number | null
          id?: string
          item_preco_id?: string | null
          largura_cm?: number | null
          madeira_m3_id?: string | null
          nome?: string
          orcamento_id?: string
          origem?: string
          outro_produto_id?: string | null
          preco_unitario?: number
          quantidade?: number
          subtotal?: number
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_orcamento_acabamento_id_fkey"
            columns: ["acabamento_id"]
            isOneToOne: false
            referencedRelation: "servicos_acabamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_orcamento_comprimento_id_fkey"
            columns: ["comprimento_id"]
            isOneToOne: false
            referencedRelation: "comprimentos_madeira_m3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_orcamento_item_preco_id_fkey"
            columns: ["item_preco_id"]
            isOneToOne: false
            referencedRelation: "itens_preco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_orcamento_madeira_m3_id_fkey"
            columns: ["madeira_m3_id"]
            isOneToOne: false
            referencedRelation: "madeiras_m3"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_orcamento_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_orcamento_outro_produto_id_fkey"
            columns: ["outro_produto_id"]
            isOneToOne: false
            referencedRelation: "outros_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_preco: {
        Row: {
          categoria: string | null
          codigo: string | null
          descricao: string | null
          disponivel: boolean
          id: string
          nome: string
          preco_unitario: number
          tabela_id: string
          unidade: string
        }
        Insert: {
          categoria?: string | null
          codigo?: string | null
          descricao?: string | null
          disponivel?: boolean
          id?: string
          nome: string
          preco_unitario: number
          tabela_id: string
          unidade: string
        }
        Update: {
          categoria?: string | null
          codigo?: string | null
          descricao?: string | null
          disponivel?: boolean
          id?: string
          nome?: string
          preco_unitario?: number
          tabela_id?: string
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_preco_tabela_id_fkey"
            columns: ["tabela_id"]
            isOneToOne: false
            referencedRelation: "tabelas_preco"
            referencedColumns: ["id"]
          },
        ]
      }
      madeiras_m3: {
        Row: {
          comprimento_m: number
          created_at: string
          disponivel: boolean
          especie_id: string
          espessura_cm: number
          id: string
          largura_cm: number
          madeireira_id: string
          nome: string
          updated_at: string
        }
        Insert: {
          comprimento_m?: number
          created_at?: string
          disponivel?: boolean
          especie_id: string
          espessura_cm: number
          id?: string
          largura_cm: number
          madeireira_id: string
          nome: string
          updated_at?: string
        }
        Update: {
          comprimento_m?: number
          created_at?: string
          disponivel?: boolean
          especie_id?: string
          espessura_cm?: number
          id?: string
          largura_cm?: number
          madeireira_id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "madeiras_m3_especie_id_fkey"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "especies_madeira"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "madeiras_m3_madeireira_id_fkey"
            columns: ["madeireira_id"]
            isOneToOne: false
            referencedRelation: "madeireiras"
            referencedColumns: ["id"]
          },
        ]
      }
      madeireiras: {
        Row: {
          cidade: string
          cnpj: string
          created_at: string
          endereco: string
          estado: string
          id: string
          logo_url: string | null
          razao_social: string
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cidade?: string
          cnpj: string
          created_at?: string
          endereco?: string
          estado?: string
          id?: string
          logo_url?: string | null
          razao_social: string
          telefone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cidade?: string
          cnpj?: string
          created_at?: string
          endereco?: string
          estado?: string
          id?: string
          logo_url?: string | null
          razao_social?: string
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          carpinteiro_id: string
          cliente_email: string | null
          cliente_nome: string
          cliente_telefone: string | null
          created_at: string
          custos_adicionais: number
          descricao: string | null
          deslocamento: number
          finalizado_at: string | null
          id: string
          imposto: number
          madeireira_id: string
          mao_obra_horas: number | null
          mao_obra_tipo: Database["public"]["Enums"]["mao_obra_tipo"]
          mao_obra_valor: number
          margem_lucro: number
          nome: string
          status: Database["public"]["Enums"]["orcamento_status"]
          subtotal_mao_obra: number
          subtotal_materiais: number
          tabela_snapshot_id: string
          termos_condicoes: string | null
          tipo_projeto: Database["public"]["Enums"]["tipo_projeto"]
          total: number
          updated_at: string
          validade_dias: number
          valor_imposto: number
          valor_margem: number
        }
        Insert: {
          carpinteiro_id: string
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          created_at?: string
          custos_adicionais?: number
          descricao?: string | null
          deslocamento?: number
          finalizado_at?: string | null
          id?: string
          imposto?: number
          madeireira_id: string
          mao_obra_horas?: number | null
          mao_obra_tipo?: Database["public"]["Enums"]["mao_obra_tipo"]
          mao_obra_valor?: number
          margem_lucro?: number
          nome: string
          status?: Database["public"]["Enums"]["orcamento_status"]
          subtotal_mao_obra?: number
          subtotal_materiais?: number
          tabela_snapshot_id: string
          termos_condicoes?: string | null
          tipo_projeto: Database["public"]["Enums"]["tipo_projeto"]
          total?: number
          updated_at?: string
          validade_dias?: number
          valor_imposto?: number
          valor_margem?: number
        }
        Update: {
          carpinteiro_id?: string
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          created_at?: string
          custos_adicionais?: number
          descricao?: string | null
          deslocamento?: number
          finalizado_at?: string | null
          id?: string
          imposto?: number
          madeireira_id?: string
          mao_obra_horas?: number | null
          mao_obra_tipo?: Database["public"]["Enums"]["mao_obra_tipo"]
          mao_obra_valor?: number
          margem_lucro?: number
          nome?: string
          status?: Database["public"]["Enums"]["orcamento_status"]
          subtotal_mao_obra?: number
          subtotal_materiais?: number
          tabela_snapshot_id?: string
          termos_condicoes?: string | null
          tipo_projeto?: Database["public"]["Enums"]["tipo_projeto"]
          total?: number
          updated_at?: string
          validade_dias?: number
          valor_imposto?: number
          valor_margem?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_carpinteiro_id_fkey"
            columns: ["carpinteiro_id"]
            isOneToOne: false
            referencedRelation: "carpinteiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_madeireira_id_fkey"
            columns: ["madeireira_id"]
            isOneToOne: false
            referencedRelation: "madeireiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_tabela_snapshot_id_fkey"
            columns: ["tabela_snapshot_id"]
            isOneToOne: false
            referencedRelation: "tabelas_preco"
            referencedColumns: ["id"]
          },
        ]
      }
      outros_produtos: {
        Row: {
          created_at: string
          descricao: string | null
          disponivel: boolean
          id: string
          madeireira_id: string
          nome: string
          preco_unitario: number
          unidade: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          disponivel?: boolean
          id?: string
          madeireira_id: string
          nome: string
          preco_unitario: number
          unidade: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          disponivel?: boolean
          id?: string
          madeireira_id?: string
          nome?: string
          preco_unitario?: number
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outros_produtos_madeireira_id_fkey"
            columns: ["madeireira_id"]
            isOneToOne: false
            referencedRelation: "madeireiras"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_arquivos: {
        Row: {
          created_at: string
          id: string
          ordem: number
          portfolio_id: string
          storage_path: string
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordem?: number
          portfolio_id: string
          storage_path: string
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          ordem?: number
          portfolio_id?: string
          storage_path?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_arquivos_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          carpinteiro_id: string
          created_at: string
          id: string
          nome: string
          slug: string | null
        }
        Insert: {
          carpinteiro_id: string
          created_at?: string
          id?: string
          nome: string
          slug?: string | null
        }
        Update: {
          carpinteiro_id?: string
          created_at?: string
          id?: string
          nome?: string
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_carpinteiro_id_fkey"
            columns: ["carpinteiro_id"]
            isOneToOne: false
            referencedRelation: "carpinteiros"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_acabamento: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          madeireira_id: string
          nome: string
          percentual_acrescimo: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          madeireira_id: string
          nome: string
          percentual_acrescimo: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          madeireira_id?: string
          nome?: string
          percentual_acrescimo?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_acabamento_madeireira_id_fkey"
            columns: ["madeireira_id"]
            isOneToOne: false
            referencedRelation: "madeireiras"
            referencedColumns: ["id"]
          },
        ]
      }
      tabelas_preco: {
        Row: {
          ativo: boolean
          id: string
          madeireira_id: string
          nome: string
          upload_at: string
        }
        Insert: {
          ativo?: boolean
          id?: string
          madeireira_id: string
          nome: string
          upload_at?: string
        }
        Update: {
          ativo?: boolean
          id?: string
          madeireira_id?: string
          nome?: string
          upload_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabelas_preco_madeireira_id_fkey"
            columns: ["madeireira_id"]
            isOneToOne: false
            referencedRelation: "madeireiras"
            referencedColumns: ["id"]
          },
        ]
      }
      vinculacoes: {
        Row: {
          carpinteiro_id: string
          id: string
          madeireira_id: string
          respondido_at: string | null
          solicitado_at: string
          status: Database["public"]["Enums"]["vinculacao_status"]
        }
        Insert: {
          carpinteiro_id: string
          id?: string
          madeireira_id: string
          respondido_at?: string | null
          solicitado_at?: string
          status?: Database["public"]["Enums"]["vinculacao_status"]
        }
        Update: {
          carpinteiro_id?: string
          id?: string
          madeireira_id?: string
          respondido_at?: string | null
          solicitado_at?: string
          status?: Database["public"]["Enums"]["vinculacao_status"]
        }
        Relationships: [
          {
            foreignKeyName: "vinculacoes_carpinteiro_id_fkey"
            columns: ["carpinteiro_id"]
            isOneToOne: false
            referencedRelation: "carpinteiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculacoes_madeireira_id_fkey"
            columns: ["madeireira_id"]
            isOneToOne: false
            referencedRelation: "madeireiras"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_madeireira_owner: { Args: { m_id: string }; Returns: boolean }
    }
    Enums: {
      mao_obra_tipo: "fixo" | "hora"
      orcamento_status:
        | "rascunho"
        | "enviado"
        | "salvo"
        | "pedido_fechado"
        | "cancelado"
      tipo_projeto: "movel" | "estrutura"
      vinculacao_status: "pendente" | "aprovada" | "rejeitada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      mao_obra_tipo: ["fixo", "hora"],
      orcamento_status: [
        "rascunho",
        "enviado",
        "salvo",
        "pedido_fechado",
        "cancelado",
      ],
      tipo_projeto: ["movel", "estrutura"],
      vinculacao_status: ["pendente", "aprovada", "rejeitada"],
    },
  },
} as const
