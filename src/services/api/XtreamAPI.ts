// src/services/api/XtreamAPI.ts
import axios, { AxiosInstance } from "axios";
import {
  XtreamCredentials,
  AuthData,
  Category,
  LiveStream,
  VODStream,
  Series,
  EPGData,
} from "../../types";

class XtreamAPIService {
  private api: AxiosInstance;
  private credentials: XtreamCredentials | null = null;
  private authData: AuthData | null = null;

  constructor() {
    this.api = axios.create({
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "IPTVPlayer/1.0",
      },
    });
  }

  // Validação de URL
  static validateStreamURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  async authenticate(credentials: XtreamCredentials): Promise<AuthData> {
    try {
      this.credentials = credentials;

      const url = `${credentials.host}/player_api.php?username=${credentials.username}&password=${credentials.password}`;
      
      console.log('Tentando autenticar:', url);
      
      const response = await this.api.get(url);

      console.log("Resposta bruta da API:", response.data);

      if (response.data?.user_info?.auth === 1) {
        this.authData = response.data;
        return response.data;
      } else {
        throw new Error("Usuário ou senha inválidos");
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      
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
      
      console.log('Buscando streams ao vivo:', url);
      
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar streams ao vivo:", error);
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
      console.error("Erro ao buscar categorias VOD:", error);
      throw error;
    }
  }

  async getVODStreams(categoryId?: string): Promise<VODStream[]> {
    try {
      const url = categoryId
        ? `${this.getBaseURL()}&action=get_vod_streams&category_id=${categoryId}`
        : `${this.getBaseURL()}&action=get_vod_streams`;
      
      console.log('Buscando filmes:', url);
      
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar streams VOD:", error);
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
      
      console.log('Buscando séries:', url);
      
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar séries:", error);
      throw error;
    }
  }

  async getVODInfo(vodId: number): Promise<any> {
    try {
      const url = `${this.getBaseURL()}&action=get_vod_info&vod_id=${vodId}`;
      console.log('Buscando info do filme:', url);
      
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar informações do VOD:", error);
      throw error;
    }
  }

  async getSeriesInfo(seriesId: number): Promise<any> {
    try {
      const url = `${this.getBaseURL()}&action=get_series_info&series_id=${seriesId}`;
      console.log('Buscando info da série:', url);
      
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar informações da série:", error);
      throw error;
    }
  }

  async getEPG(streamId: number): Promise<EPGData[]> {
    try {
      const url = `${this.getBaseURL()}&action=get_simple_data_table&stream_id=${streamId}`;
      console.log('Buscando EPG:', url);
      
      const response = await this.api.get(url);
      return response.data?.epg_listings || [];
    } catch (error) {
      console.error("Erro ao buscar EPG:", error);
      return [];
    }
  }

  // URLs para reprodução com validação
  getStreamURL(streamId: number, extension: string = "ts"): string {
    if (!this.credentials) {
      throw new Error("Credenciais não definidas");
    }
    
    const url = `${this.credentials.host}/live/${this.credentials.username}/${this.credentials.password}/${streamId}.${extension}`;
    
    console.log('URL do stream gerada:', url);
    
    if (!XtreamAPIService.validateStreamURL(url)) {
      throw new Error('URL de stream inválida gerada');
    }
    
    return url;
  }

  getVODURL(streamId: number, extension: string): string {
    if (!this.credentials) {
      throw new Error("Credenciais não definidas");
    }
    
    const cleanExtension = extension.replace(/^\./, '');
    const url = `${this.credentials.host}/movie/${this.credentials.username}/${this.credentials.password}/${streamId}.${cleanExtension}`;
    
    console.log('URL do VOD gerada:', url);
    
    if (!XtreamAPIService.validateStreamURL(url)) {
      throw new Error('URL de VOD inválida gerada');
    }
    
    return url;
  }

  getSeriesURL(seriesId: number, seasonNum: number, episodeNum: number, extension: string): string {
    if (!this.credentials) {
      throw new Error("Credenciais não definidas");
    }
    
    const cleanExtension = extension.replace(/^\./, '');
    const url = `${this.credentials.host}/series/${this.credentials.username}/${this.credentials.password}/${seriesId}/${seasonNum}/${episodeNum}.${cleanExtension}`;
    
    console.log('URL da série gerada:', url);
    
    if (!XtreamAPIService.validateStreamURL(url)) {
      throw new Error('URL de série inválida gerada');
    }
    
    return url;
  }

  getImageURL(imagePath: string): string {
    if (!this.credentials || !imagePath) {
      return '';
    }
    
    // Se já é uma URL completa, retorna como está
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Remove barra inicial se existir
    const cleanPath = imagePath.replace(/^\//, '');
    
    const url = `${this.credentials.host}/images/${cleanPath}`;
    console.log('URL da imagem gerada:', url);
    
    return url;
  }

  // Teste de conectividade
  async testConnection(): Promise<boolean> {
    try {
      if (!this.credentials) {
        throw new Error("Credenciais não definidas");
      }
      
      const url = `${this.credentials.host}/player_api.php?username=${this.credentials.username}&password=${this.credentials.password}`;
      
      const response = await this.api.get(url, { timeout: 5000 });
      
      return response.data?.user_info?.auth === 1;
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      return false;
    }
  }

  // Busca global
  async searchContent(query: string): Promise<{
    live: LiveStream[];
    vod: VODStream[];
    series: Series[];
  }> {
    try {
      const [liveStreams, vodStreams, seriesData] = await Promise.all([
        this.getLiveStreams(),
        this.getVODStreams(),
        this.getSeries()
      ]);

      const searchLower = query.toLowerCase();

      const filteredLive = liveStreams.filter(stream =>
        stream.name.toLowerCase().includes(searchLower)
      );

      const filteredVOD = vodStreams.filter(stream =>
        stream.name.toLowerCase().includes(searchLower)
      );

      const filteredSeries = seriesData.filter(series =>
        series.name.toLowerCase().includes(searchLower)
      );

      return {
        live: filteredLive,
        vod: filteredVOD,
        series: filteredSeries
      };
    } catch (error) {
      console.error('Erro na busca:', error);
      throw error;
    }
  }

  // Getter para credenciais
  getCredentials(): XtreamCredentials | null {
    return this.credentials;
  }

  // Getter para dados de auth
  getAuthData(): AuthData | null {
    return this.authData;
  }

  // Método para obter informações do servidor
  getServerInfo(): AuthData | null {
    return this.authData;
  }

  // Método para verificar se está autenticado
  isAuthenticated(): boolean {
    return !!(this.credentials && this.authData);
  }

  // Método para limpar autenticação
  clearAuth(): void {
    this.credentials = null;
    this.authData = null;
  }

  // Método para obter status da conta
  getAccountStatus(): {
    isActive: boolean;
    expirationDate: string;
    maxConnections: string;
    activeConnections: string;
    isTrial: boolean;
  } | null {
    if (!this.authData) return null;

    return {
      isActive: this.authData.user_info.status === 'Active',
      expirationDate: this.authData.user_info.exp_date,
      maxConnections: this.authData.user_info.max_connections,
      activeConnections: this.authData.user_info.active_cons,
      isTrial: this.authData.user_info.is_trial === '1',
    };
  }

  // Método para validar credenciais
  async validateCredentials(credentials: XtreamCredentials): Promise<boolean> {
    try {
      await this.authenticate(credentials);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Método para reconectar
  async reconnect(): Promise<void> {
    if (!this.credentials) {
      throw new Error("Nenhuma credencial salva para reconectar");
    }
    
    await this.authenticate(this.credentials);
  }

  // Método para testar URL específica
  async testStreamURL(url: string): Promise<{
    accessible: boolean;
    statusCode?: number;
    error?: string;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'IPTVPlayer/1.0',
        }
      });

      clearTimeout(timeoutId);

      return {
        accessible: response.status >= 200 && response.status < 400,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        accessible: false,
        error: error.message
      };
    }
  }

  // Método para obter formatos disponíveis para uma série
  async getAvailableSeriesFormats(
    seriesId: number, 
    seasonNum: number, 
    episodeNum: number
  ): Promise<string[]> {
    const formats = ['mp4', 'mkv', 'avi', 'ts', 'flv'];
    const availableFormats: string[] = [];

    for (const format of formats) {
      try {
        const url = this.getSeriesURL(seriesId, seasonNum, episodeNum, format);
        const test = await this.testStreamURL(url);
        
        if (test.accessible) {
          availableFormats.push(format);
        }
      } catch (error) {
        console.log(`Formato ${format} não disponível para série ${seriesId}`);
      }
    }

    return availableFormats;
  }

  // Método para obter formatos disponíveis para VOD
  async getAvailableVODFormats(streamId: number): Promise<string[]> {
    const formats = ['mp4', 'mkv', 'avi', 'ts', 'flv'];
    const availableFormats: string[] = [];

    for (const format of formats) {
      try {
        const url = this.getVODURL(streamId, format);
        const test = await this.testStreamURL(url);
        
        if (test.accessible) {
          availableFormats.push(format);
        }
      } catch (error) {
        console.log(`Formato ${format} não disponível para VOD ${streamId}`);
      }
    }

    return availableFormats;
  }

  // Método para diagnosticar problemas de série
  async diagnoseSeriesIssue(
    seriesId: number,
    seasonNum: number,
    episodeNum: number,
    extension: string
  ): Promise<{
    exists: boolean;
    accessible: boolean;
    alternativeFormats?: string[];
    episodeInfo?: any;
    error?: string;
  }> {
    try {
      // 1. Verificar se a série existe
      const seriesInfo = await this.getSeriesInfo(seriesId);
      
      if (!seriesInfo || !seriesInfo.episodes) {
        return {
          exists: false,
          accessible: false,
          error: 'Série não encontrada no servidor'
        };
      }

      // 2. Verificar se a temporada existe
      const seasonKey = seasonNum.toString();
      if (!seriesInfo.episodes[seasonKey]) {
        return {
          exists: false,
          accessible: false,
          error: `Temporada ${seasonNum} não encontrada`
        };
      }

      // 3. Verificar se o episódio existe
      const episode = seriesInfo.episodes[seasonKey].find((ep: any) => 
        ep.episode_num === episodeNum
      );

      if (!episode) {
        return {
          exists: false,
          accessible: false,
          error: `Episódio ${episodeNum} não encontrado`
        };
      }

      // 4. Testar acessibilidade da URL atual
      const currentUrl = this.getSeriesURL(seriesId, seasonNum, episodeNum, extension);
      const currentTest = await this.testStreamURL(currentUrl);

      // 5. Buscar formatos alternativos se necessário
      let alternativeFormats: string[] = [];
      if (!currentTest.accessible) {
        alternativeFormats = await this.getAvailableSeriesFormats(
          seriesId,
          seasonNum,
          episodeNum
        );
      }

      return {
        exists: true,
        accessible: currentTest.accessible,
        episodeInfo: episode,
        alternativeFormats: alternativeFormats.length > 0 ? alternativeFormats : undefined
      };

    } catch (error: any) {
      return {
        exists: false,
        accessible: false,
        error: error.message || 'Erro ao diagnosticar série'
      };
    }
  }
}

const XtreamAPI = new XtreamAPIService();
export default XtreamAPI;