import axios from 'axios';
import { EPGData } from '../types';

class EPGService {
  private epgCache: { [channelId: string]: EPGData[] } = {};
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  async getEPG(channelId: string, epgUrl?: string): Promise<EPGData[]> {
    // Check cache first
    if (this.epgCache[channelId]) {
      return this.epgCache[channelId];
    }

    if (!epgUrl) {
      return [];
    }

    try {
      const response = await axios.get(epgUrl, {
        timeout: 10000,
      });

      const epgData = this.parseEPGXML(response.data, channelId);
      
      // Cache the result
      this.epgCache[channelId] = epgData;
      
      // Clear cache after timeout
      setTimeout(() => {
        delete this.epgCache[channelId];
      }, this.cacheTimeout);

      return epgData;
    } catch (error) {
      console.error('Erro ao carregar EPG:', error);
      return [];
    }
  }

  private parseEPGXML(xmlContent: string, channelId: string): EPGData[] {
    // Basic XML parsing for EPG
    // This is a simplified parser - you might want to use a proper XML parser
    const programs: EPGData[] = [];
    
    try {
      // Extract programme elements for the specific channel
      const programmeRegex = new RegExp(
        `<programme[^>]*channel="${channelId}"[^>]*>(.*?)</programme>`,
        'gs'
      );
      
      const matches = xmlContent.match(programmeRegex);
      
      if (matches) {
        matches.forEach((match, index) => {
          const startMatch = match.match(/start="([^"]+)"/);
          const stopMatch = match.match(/stop="([^"]+)"/);
          const titleMatch = match.match(/<title[^>]*>([^<]+)</);
          const descMatch = match.match(/<desc[^>]*>([^<]+)</);
          
          if (startMatch && stopMatch && titleMatch) {
            programs.push({
              id: `${channelId}_${index}`,
              epg_id: channelId,
              title: titleMatch[1],
              lang: 'pt',
              start: startMatch[1],
              end: stopMatch[1],
              description: descMatch ? descMatch[1] : '',
              channel_id: channelId,
              start_timestamp: this.parseEPGTime(startMatch[1]),
              stop_timestamp: this.parseEPGTime(stopMatch[1]),
            });
          }
        });
      }
    } catch (error) {
      console.error('Erro ao parsear EPG XML:', error);
    }

    return programs;
  }

  private parseEPGTime(epgTime: string): string {
    // Convert EPG time format (YYYYMMDDHHMMSS +TIMEZONE) to timestamp
    try {
      const dateStr = epgTime.substring(0, 8);
      const timeStr = epgTime.substring(8, 14);
      
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
      const day = parseInt(dateStr.substring(6, 8));
      const hour = parseInt(timeStr.substring(0, 2));
      const minute = parseInt(timeStr.substring(2, 4));
      const second = parseInt(timeStr.substring(4, 6));
      
      const date = new Date(year, month, day, hour, minute, second);
      return Math.floor(date.getTime() / 1000).toString();
    } catch (error) {
      console.error('Erro ao parsear tempo EPG:', error);
      return Date.now().toString();
    }
  }

  getCurrentProgram(programs: EPGData[]): EPGData | null {
    const now = Date.now() / 1000;
    return programs.find(program => 
      parseInt(program.start_timestamp) <= now && 
      parseInt(program.stop_timestamp) > now
    ) || null;
  }

  getNextProgram(programs: EPGData[]): EPGData | null {
    const now = Date.now() / 1000;
    const futurePrograms = programs.filter(program => 
      parseInt(program.start_timestamp) > now
    );
    
    return futurePrograms.sort((a, b) => 
      parseInt(a.start_timestamp) - parseInt(b.start_timestamp)
    )[0] || null;
  }

  clearCache(): void {
    this.epgCache = {};
  }
}

export default new EPGService();