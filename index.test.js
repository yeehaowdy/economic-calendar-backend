import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
// Fontos: Az index.js-ben legyen egy 'export default app' a végén!
import app from './index.js'; 
import { getDocs, setDoc, deleteDoc } from 'firebase/firestore';

// 1. A Firebase modulok mockolása, hogy ne kapcsolódjon az igazi felhőhöz
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  limit: vi.fn(),
  getCountFromServer: vi.fn(),
}));

describe('Backend API végpontok tesztelése', () => {
  
  beforeEach(() => {
    vi.clearAllMocks(); // Minden teszt előtt tiszta lappal indulunk
  });

  describe('Naptár események (Calendar)', () => {
    it('GET /api/calendar - visszaadja az események listáját', async () => {
      // Szimuláljuk a Firestore választ
      const mockData = [
        { id: '1', data: () => ({ title: 'Meeting', date: { toDate: () => new Date('2024-05-01') } }) }
      ];
      
      getDocs.mockResolvedValueOnce({
        forEach: (callback) => mockData.forEach(callback)
      });

      const response = await request(app).get('/api/calendar');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].title).toBe('Meeting');
    });

    it('POST /api/calendar - sikeresen létrehoz egy eseményt', async () => {
      setDoc.mockResolvedValueOnce(); // Sikeres mentés szimulálása

      const newEvent = { title: 'Új esemény', description: 'Teszt' };
      const response = await request(app)
        .post('/api/calendar')
        .send(newEvent);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Esemény létrehozva');
      expect(response.body.id).toContain('event_');
    });

    it('DELETE /api/calendar/:id - törli az eseményt', async () => {
      deleteDoc.mockResolvedValueOnce();

      const response = await request(app).delete('/api/calendar/event_123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Esemény törölve');
    });
  });

  describe('Hírek (News)', () => {
    it('GET /api/news/admin - visszaadja az összes hírt', async () => {
      getDocs.mockResolvedValueOnce({
        forEach: (callback) => callback({ 
          id: 'news_1', 
          data: () => ({ title: 'Gazdasági hír', pubDate: '2024-01-01' }) 
        })
      });

      const response = await request(app).get('/api/news/admin');

      expect(response.status).toBe(200);
      expect(response.body[0].title).toBe('Gazdasági hír');
    });

    it('POST /api/news - hiba esetén 500-at ad vissza', async () => {
      // Kényszerített hiba szimulálása
      setDoc.mockRejectedValueOnce(new Error('Firestore hiba'));

      const response = await request(app)
        .post('/api/news')
        .send({ title: 'Hiba teszt' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Firestore hiba');
    });
  });
});