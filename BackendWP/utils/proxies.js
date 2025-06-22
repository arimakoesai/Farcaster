import axios from 'axios';

export default async function getProxies() {
  try {
    const res = await axios.get('https://cdn.jsdelivr.net/gh/proxifly/free-proxy-list@main/proxies/protocols/socks5/data.txt');
    const lines = res.data.split('\n');

    return lines
      .map(line => line.trim())
      .filter(p => p && !p.startsWith('#') && p.includes(':'))
      .map(p => `socks5://${p}`);
  } catch (err) {
    console.error('❌ Gagal ambil proxy list:', err.message);
    return [];
  }
}
