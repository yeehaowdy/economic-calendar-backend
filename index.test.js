import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from './index.js';
import { getDocs, setDoc, deleteDoc, getCountFromServer } from 'firebase/firestore';

// Firebase modulok mockolása
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
  startAt: vi.fn(),
  count: vi.fn(),
  getCountFromServer: vi.fn(),
}));

// --- Segédfüggvények ---
const makeDocsSnapshot = (items) => ({
  forEach: (callback) => items.forEach(callback),
});

describe('Backend API végpontok tesztelése', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  // CALENDAR
  // ──────────────────────────────────────────────
  describe('Naptár események (Calendar)', () => {

    // GET /api/calendar – siker, date.toDate() ág
    it('GET /api/calendar - visszaadja az események listáját (toDate ággal)', async () => {
      const mockData = [
        {
          id: 'cal_1',
          data: () => ({ title: 'Meeting', date: { toDate: () => new Date('2024-05-01') } }),
        },
      ];
      getDocs.mockResolvedValueOnce(makeDocsSnapshot(mockData));

      const response = await request(app).get('/api/calendar');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].title).toBe('Meeting');
      expect(response.body[0].date).toContain('2024-05-01');
    });

    // GET /api/calendar – siker, date string ág (nincs toDate)
    it('GET /api/calendar - visszaadja az eseményeket (string date)', async () => {
      const mockData = [
        { id: 'cal_2', data: () => ({ title: 'Konferencia', date: '2024-06-15' }) },
      ];
      getDocs.mockResolvedValueOnce(makeDocsSnapshot(mockData));

      const response = await request(app).get('/api/calendar');

      expect(response.status).toBe(200);
      expect(response.body[0].date).toBe('2024-06-15');
    });

    // GET /api/calendar – Firestore hiba → 500
    it('GET /api/calendar - 500-at ad vissza hiba esetén', async () => {
      getDocs.mockRejectedValueOnce(new Error('Firestore connection error'));

      const response = await request(app).get('/api/calendar');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Server error');
      expect(response.body.details).toBe('Firestore connection error');
    });

    // POST /api/calendar – siker
    it('POST /api/calendar - sikeresen létrehoz egy eseményt', async () => {
      setDoc.mockResolvedValueOnce();

      const newEvent = { title: 'Új esemény', description: 'Teszt' };
      const response = await request(app).post('/api/calendar').send(newEvent);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Esemény létrehozva');
      expect(response.body.id).toContain('event_');
    });

    // POST /api/calendar – hiba → 500
    it('POST /api/calendar - 500-at ad vissza hiba esetén', async () => {
      setDoc.mockRejectedValueOnce(new Error('Write failed'));

      const response = await request(app).post('/api/calendar').send({ title: 'Hiba' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Write failed');
    });

    // PUT /api/calendar/:id – siker
    it('PUT /api/calendar/:id - sikeresen frissíti az eseményt', async () => {
      setDoc.mockResolvedValueOnce();

      const response = await request(app)
        .put('/api/calendar/event_123')
        .send({ title: 'Módosított esemény' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Esemény frissítve');
    });

    // PUT /api/calendar/:id – hiba → 500
    it('PUT /api/calendar/:id - 500-at ad vissza hiba esetén', async () => {
      setDoc.mockRejectedValueOnce(new Error('Update failed'));

      const response = await request(app)
        .put('/api/calendar/event_123')
        .send({ title: 'Hiba' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Update failed');
    });

    // DELETE /api/calendar/:id – siker
    it('DELETE /api/calendar/:id - törli az eseményt', async () => {
      deleteDoc.mockResolvedValueOnce();

      const response = await request(app).delete('/api/calendar/event_123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Esemény törölve');
    });

    // DELETE /api/calendar/:id – hiba → 500
    it('DELETE /api/calendar/:id - 500-at ad vissza hiba esetén', async () => {
      deleteDoc.mockRejectedValueOnce(new Error('Delete failed'));

      const response = await request(app).delete('/api/calendar/event_123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Delete failed');
    });
  });

  // ──────────────────────────────────────────────
  // NEWS
  // ──────────────────────────────────────────────
  describe('Hírek (News)', () => {

    // GET /api/news – siker, alapértelmezett oldal
    it('GET /api/news - visszaadja az első oldalt (alapértelmezett)', async () => {
      getCountFromServer.mockResolvedValueOnce({ data: () => ({ count: 25 }) });

      const mockItems = Array.from({ length: 12 }, (_, i) => ({
        id: `news_${i}`,
        data: () => ({ title: `Hír ${i}`, pubDate: { toDate: () => new Date('2024-01-01') } }),
      }));
      getDocs.mockResolvedValueOnce(makeDocsSnapshot(mockItems));

      const response = await request(app).get('/api/news');

      expect(response.status).toBe(200);
      expect(response.body.currentPage).toBe(1);
      expect(response.body.totalPages).toBe(3); // ceil(25/12) = 3
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    // GET /api/news – 2. oldal, egyéni limit
    it('GET /api/news - visszaadja a 2. oldalt egyéni limit-tel', async () => {
      getCountFromServer.mockResolvedValueOnce({ data: () => ({ count: 30 }) });

      // page=2, limit=5 → fetch 10 db, visszaad 5-10 indexet
      const mockItems = Array.from({ length: 10 }, (_, i) => ({
        id: `news_${i}`,
        data: () => ({ title: `Hír ${i}`, pubDate: '2024-02-01' }),
      }));
      getDocs.mockResolvedValueOnce(makeDocsSnapshot(mockItems));

      const response = await request(app).get('/api/news?page=2&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.currentPage).toBe(2);
      expect(response.body.data.length).toBe(5);
    });

    // GET /api/news – pubDate nincs toDate (string ág)
    it('GET /api/news - pubDate string formátum kezelése', async () => {
      getCountFromServer.mockResolvedValueOnce({ data: () => ({ count: 1 }) });

      getDocs.mockResolvedValueOnce(
        makeDocsSnapshot([
          { id: 'n1', data: () => ({ title: 'Teszt', pubDate: '2024-03-01' }) },
        ])
      );

      const response = await request(app).get('/api/news');

      expect(response.status).toBe(200);
      expect(response.body.data[0].pubDate).toBe('2024-03-01');
    });

    // GET /api/news – Firestore hiba → 500
    it('GET /api/news - 500-at ad vissza hiba esetén', async () => {
      getCountFromServer.mockRejectedValueOnce(new Error('Count error'));

      const response = await request(app).get('/api/news');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Server error');
      expect(response.body.details).toBe('Count error');
    });

    // GET /api/news/admin – siker, toDate ággal
    it('GET /api/news/admin - visszaadja az összes hírt (toDate ággal)', async () => {
      getDocs.mockResolvedValueOnce(
        makeDocsSnapshot([
          {
            id: 'news_1',
            data: () => ({
              title: 'Gazdasági hír',
              pubDate: { toDate: () => new Date('2024-01-15') },
            }),
          },
        ])
      );

      const response = await request(app).get('/api/news/admin');

      expect(response.status).toBe(200);
      expect(response.body[0].title).toBe('Gazdasági hír');
      expect(response.body[0].pubDate).toContain('2024-01-15');
    });

    // GET /api/news/admin – siker, string pubDate
    it('GET /api/news/admin - visszaadja az összes hírt (string pubDate)', async () => {
      getDocs.mockResolvedValueOnce(
        makeDocsSnapshot([
          { id: 'news_2', data: () => ({ title: 'Másik hír', pubDate: '2024-02-20' }) },
        ])
      );

      const response = await request(app).get('/api/news/admin');

      expect(response.status).toBe(200);
      expect(response.body[0].pubDate).toBe('2024-02-20');
    });

    // GET /api/news/admin – Firestore hiba → 500
    it('GET /api/news/admin - 500-at ad vissza hiba esetén', async () => {
      getDocs.mockRejectedValueOnce(new Error('Admin fetch error'));

      const response = await request(app).get('/api/news/admin');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Server error');
      expect(response.body.details).toBe('Admin fetch error');
    });

    // POST /api/news – siker
    it('POST /api/news - sikeresen létrehoz egy hírt', async () => {
      setDoc.mockResolvedValueOnce();

      const response = await request(app)
        .post('/api/news')
        .send({ title: 'Új hír', content: 'Tartalom' });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('News created successfully');
      expect(response.body.id).toContain('manual_');
    });

    // POST /api/news – hiba → 500
    it('POST /api/news - hiba esetén 500-at ad vissza', async () => {
      setDoc.mockRejectedValueOnce(new Error('Firestore hiba'));

      const response = await request(app).post('/api/news').send({ title: 'Hiba teszt' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Firestore hiba');
    });

    // PUT /api/news/:id – siker
    it('PUT /api/news/:id - sikeresen frissíti a hírt', async () => {
      setDoc.mockResolvedValueOnce();

      const response = await request(app)
        .put('/api/news/news_123')
        .send({ title: 'Frissített hír' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('News updated successfully');
    });

    // PUT /api/news/:id – hiba → 500
    it('PUT /api/news/:id - 500-at ad vissza hiba esetén', async () => {
      setDoc.mockRejectedValueOnce(new Error('Update error'));

      const response = await request(app)
        .put('/api/news/news_123')
        .send({ title: 'Hiba' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Update error');
    });

    // DELETE /api/news/:id – siker
    it('DELETE /api/news/:id - törli a hírt', async () => {
      deleteDoc.mockResolvedValueOnce();

      const response = await request(app).delete('/api/news/news_123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('News Deleted');
    });

    // DELETE /api/news/:id – hiba → 500
    it('DELETE /api/news/:id - 500-at ad vissza hiba esetén', async () => {
      deleteDoc.mockRejectedValueOnce(new Error('Delete news error'));

      const response = await request(app).delete('/api/news/news_123');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Delete news error');
    });
  });
});