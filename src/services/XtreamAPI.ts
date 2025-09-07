import axios, { AxiosInstance } from "axios";
import {
  XtreamCredentials,
  AuthData,
  Category,
  LiveStream,
  VODStream,
  Series,
  EPGData,
} from "../types";

class XtreamAPIService {
  private api: AxiosInstance;
  private credentials: XtreamCredentials | null = null;
  private authData: AuthData | null = null;

  constructor() {
    this.api = axios.create({
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async authenticate(credentials: XtreamCredentials): Promise<AuthData> {
    try {
      this.credentials = credentials;

      const url = `${credentials.host}/player_api.php?username=${credentials.username}&password=${credentials.password}`;
      const response = await this.api.get(url);

      console.log("Resposta bruta da API:", response.data);

      if (response.data?.user_info?.auth === 1) {
        this.authData = response.data;
        return response.data;
      } else {
        throw new Error("Usuário ou senha inválidos");
      }
    } catch (error: any) {
      if (error.response) {
        console.error(
          "Erro da API:",
          error.response.status,
          error.response.data || error.message
        );
        throw new Error(
          `Erro na API (${error.response.status}): ${
            error.response.data?.message || "Falha na autenticação"
          }`
        );
      } else if (error.request) {
        console.error("Sem resposta do servidor:", error.message);
        throw new Error("Servidor não respondeu, verifique o host/porta");
      } else {
        console.error("Erro desconhecido:", error.message);
        throw new Error("Erro ao conectar com o servidor");
      }
    }
  }

  private getBaseURL(): string {
    if (!this.credentials) {
      throw new Error("Credenciais não definidas");
    }
    return `${this.credentials.host}/player_api.php?username=${this.credentials.username}&password=${this.credentials.password}`;
  }

  async getLiveCategories(): Promise<Category[]> {
    try {
      const response = await this.api.get(
        `${this.getBaseURL()}&action=get_live_categories`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar categorias ao vivo:", error);
      throw error;
    }
  }

  async getLiveStreams(categoryId?: string): Promise<LiveStream[]> {
    try {
      const url = categoryId
        ? `${this.getBaseURL()}&action=get_live_streams&category_id=${categoryId}`
        : `${this.getBaseURL()}&action=get_live_streams`;

      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar canais ao vivo:", error);
      throw error;
    }
  }

  async getVODCategories(): Promise<Category[]> {
    try {
      const response = await this.api.get(
        `${this.getBaseURL()}&action=get_vod_categories`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar categorias de filmes:", error);
      throw error;
    }
  }

  async getVODStreams(categoryId?: string): Promise<VODStream[]> {
    try {
      const url = categoryId
        ? `${this.getBaseURL()}&action=get_vod_streams&category_id=${categoryId}`
        : `${this.getBaseURL()}&action=get_vod_streams`;

      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar filmes:", error);
      throw error;
    }
  }

  async getSeriesCategories(): Promise<Category[]> {
    try {
      const response = await this.api.get(
        `${this.getBaseURL()}&action=get_series_categories`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar categorias de séries:", error);
      throw error;
    }
  }

  async getSeries(categoryId?: string): Promise<Series[]> {
    try {
      const url = categoryId
        ? `${this.getBaseURL()}&action=get_series&category_id=${categoryId}`
        : `${this.getBaseURL()}&action=get_series`;

      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar séries:", error);
      throw error;
    }
  }

  async getEPG(streamId: number): Promise<EPGData[]> {
    try {
      const response = await this.api.get(
        `${this.getBaseURL()}&action=get_short_epg&stream_id=${streamId}`
      );
      return response.data.epg_listings || [];
    } catch (error) {
      console.error("Erro ao buscar EPG:", error);
      return [];
    }
  }

  getStreamURL(streamId: number, extension: string = "ts"): string {
    if (!this.credentials) {
      throw new Error("Credenciais não definidas");
    }
    return `${this.credentials.host}/live/${this.credentials.username}/${this.credentials.password}/${streamId}.${extension}`;
  }

  getVODURL(streamId: number, extension: string): string {
    if (!this.credentials) {
      throw new Error("Credenciais não definidas");
    }
    return `${this.credentials.host}/movie/${this.credentials.username}/${this.credentials.password}/${streamId}.${extension}`;
  }

  async searchContent(query: string): Promise<{
    live: LiveStream[];
    vod: VODStream[];
    series: Series[];
  }> {
    try {
      const [liveStreams, vodStreams, seriesData] = await Promise.all([
        this.getLiveStreams(),
        this.getVODStreams(),
        this.getSeries(),
      ]);

      const searchTerm = query.toLowerCase();

      return {
        live: liveStreams.filter((stream) =>
          stream.name.toLowerCase().includes(searchTerm)
        ),
        vod: vodStreams.filter((stream) =>
          stream.name.toLowerCase().includes(searchTerm)
        ),
        series: seriesData.filter((serie) =>
          serie.name.toLowerCase().includes(searchTerm)
        ),
      };
    } catch (error) {
      console.error("Erro na busca:", error);
      return { live: [], vod: [], series: [] };
    }
  }
}

export default new XtreamAPIService();
