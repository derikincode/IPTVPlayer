import axios from 'axios';
import { M3UChannel } from '../types';

class M3UParserService {
  async parseM3U(url: string): Promise<M3UChannel[]> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
      });

      const content = response.data;
      return this.parseM3UContent(content);
    } catch (error) {
      console.error('Erro ao carregar M3U:', error);
      throw new Error('Erro ao carregar lista M3U');
    }
  }

  private parseM3UContent(content: string): M3UChannel[] {
    const lines = content.split('\n');
    const channels: M3UChannel[] = [];
    let currentChannel: Partial<M3UChannel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXTINF:')) {
        // Parse channel info
        const info = this.parseExtInf(line);
        currentChannel = { ...info };
      } else if (line && !line.startsWith('#')) {
        // This is the URL
        if (currentChannel.name) {
          currentChannel.url = line;
          channels.push(currentChannel as M3UChannel);
          currentChannel = {};
        }
      }
    }

    return channels;
  }

  private parseExtInf(line: string): Partial<M3UChannel> {
    const channel: Partial<M3UChannel> = {};

    // Extract name (everything after the last comma)
    const nameMatch = line.match(/,(.+)$/);
    if (nameMatch) {
      channel.name = nameMatch[1].trim();
    }

    // Extract logo
    const logoMatch = line.match(/tvg-logo="([^"]+)"/);
    if (logoMatch) {
      channel.logo = logoMatch[1];
    }

    // Extract group
    const groupMatch = line.match(/group-title="([^"]+)"/);
    if (groupMatch) {
      channel.group = groupMatch[1];
    }

    // Extract EPG ID
    const epgMatch = line.match(/tvg-id="([^"]+)"/);
    if (epgMatch) {
      channel.epgId = epgMatch[1];
    }

    return channel;
  }

  groupChannelsByCategory(channels: M3UChannel[]): { [category: string]: M3UChannel[] } {
    const grouped: { [category: string]: M3UChannel[] } = {};

    channels.forEach(channel => {
      const category = channel.group || 'Sem Categoria';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(channel);
    });

    return grouped;
  }

  searchChannels(channels: M3UChannel[], query: string): M3UChannel[] {
    const searchTerm = query.toLowerCase();
    return channels.filter(channel =>
      channel.name.toLowerCase().includes(searchTerm) ||
      (channel.group && channel.group.toLowerCase().includes(searchTerm))
    );
  }
}

export default new M3UParserService();