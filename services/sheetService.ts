
import { Product } from '../types';

const SHEET_ID = '14y8xWyp0wfcoymTAgFdqOCcFK-ParHVrVH1oV6-cSUw';
/**
 * Senior Note: 
 * Menggunakan endpoint /gviz/tq?tqx=out:csv seringkali lebih bersahabat dengan CORS 
 * dibandingkan /export?format=csv untuk akses langsung dari browser.
 */
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(CSV_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
      }
    });

    if (!response.ok) {
      throw new Error(`Server merespon dengan status: ${response.status}`);
    }

    const csvText = await response.text();
    
    // Validasi sederhana jika yang diterima bukan CSV (misal halaman login Google jika sheet tidak publik)
    if (csvText.includes('<!DOCTYPE html>') || csvText.includes('login')) {
      throw new Error('Spreadsheet tidak dapat diakses secara publik. Pastikan opsi "Anyone with the link" aktif dan file "Published to the web".');
    }

    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching products:', error);
    // Kita lempar error agar ditangkap oleh UI component
    throw new Error(error instanceof Error ? error.message : 'Koneksi gagal');
  }
};

const parseCSV = (csvText: string): Product[] => {
  // Gviz terkadang membungkus hasil CSV dengan kutipan ganda ekstra atau format tertentu
  const lines = csvText.split(/\r?\n/);
  const products: Product[] = [];

  // Mulai dari index 1 untuk melewati header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split dengan regex yang menangani koma di dalam tanda kutip
    const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    if (parts.length >= 3) {
      const item = parts[0].replace(/^"|"$/g, '').trim();
      const description = parts[1].replace(/^"|"$/g, '').trim();
      // Hilangkan karakter non-numeric sebelum parsing harga
      const priceStr = parts[2].replace(/^"|"$/g, '').replace(/[^0-9]/g, '').trim();
      const price = parseInt(priceStr, 10);

      if (item && !isNaN(price)) {
        products.push({
          id: `prod-${i}`,
          item,
          description,
          price
        });
      }
    }
  }
  return products;
};
