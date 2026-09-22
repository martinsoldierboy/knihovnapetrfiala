// Local storage persistence and sample library data

const STORAGE_KEY = 'knihovna_skenovane_knihy';

export const initialSampleBooks = [
  {
    id: 'sample-1',
    title: 'R.U.R.',
    author: 'Čapek, Karel',
    rawAuthor: 'Karel Čapek',
    isbn: '9788073352349',
    publisher: 'Aventinum',
    publishedYear: '1920',
    pageCount: 120,
    category: 'Drama',
    mdt: '82-2',
    signatura: '82-2 ČAP r',
    coverUrl: 'https://covers.openlibrary.org/b/id/8301772-M.jpg',
    description: 'Vynálezkyně a vědci vytvoří umělé lidi, zvané Roboti, kteří se nakonec vzbouří proti lidstvu.',
    addedAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'sample-2',
    title: 'Válka s Mloky',
    author: 'Čapek, Karel',
    rawAuthor: 'Karel Čapek',
    isbn: '9788072038756',
    publisher: 'Fr. Borový',
    publishedYear: '1936',
    pageCount: 260,
    category: 'Beletrie - Sci-Fi / Fantasy',
    mdt: '82-311.9',
    signatura: '82-311.9 ČAP v',
    coverUrl: 'https://covers.openlibrary.org/b/id/10239102-M.jpg',
    description: 'Satirický sci-fi román varující před fašismem a lhostejností lidstva.',
    addedAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'sample-3',
    title: 'Babička',
    author: 'Němcová, Božena',
    rawAuthor: 'Božena Němcová',
    isbn: '9788073900123',
    publisher: 'Jaroslav Pospíšil',
    publishedYear: '1855',
    pageCount: 310,
    category: 'Beletrie - Próza',
    mdt: '82-3',
    signatura: '82-3 NĚM b',
    coverUrl: 'https://covers.openlibrary.org/b/id/10543210-M.jpg',
    description: 'Klasické dílo české literatury o životě na venkově a moudré babičce.',
    addedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'sample-4',
    title: 'Máj',
    author: 'Mácha, Karel Hynek',
    rawAuthor: 'Karel Hynek Mácha',
    isbn: '9788020612111',
    publisher: 'Jan Hostivít Pospíšil',
    publishedYear: '1836',
    pageCount: 88,
    category: 'Poezie',
    mdt: '82-1',
    signatura: '82-1 MÁC m',
    coverUrl: 'https://covers.openlibrary.org/b/id/9253810-M.jpg',
    description: 'Vrcholné dílo českého romantismu, lyrickoepická báseň o tragické lásce a osudu.',
    addedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'sample-5',
    title: 'Kytice',
    author: 'Erben, Karel Jaromír',
    rawAuthor: 'Karel Jaromír Erben',
    isbn: '9788020718991',
    publisher: 'Tisk a sklad Jeřábkové',
    publishedYear: '1853',
    pageCount: 160,
    category: 'Poezie',
    mdt: '82-1',
    signatura: '82-1 ERB k',
    coverUrl: null,
    description: 'Sbírka balad založených na lidových pověstech.',
    addedAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'sample-6',
    title: 'Osudy dobrého vojáka Švejka za světové války',
    author: 'Hašek, Jaroslav',
    rawAuthor: 'Jaroslav Hašek',
    isbn: '9788073905555',
    publisher: 'Adolf Synek',
    publishedYear: '1921',
    pageCount: 750,
    category: 'Beletrie - Próza',
    mdt: '82-3',
    signatura: '82-3 HAŠ o',
    coverUrl: null,
    description: 'Světoznámá humoristická románová epopej z prostředí první světové války.',
    addedAt: new Date().toISOString()
  }
];

export const loadStoredBooks = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSampleBooks));
      return initialSampleBooks;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Chyba při načítání knih z localStorage:', err);
    return initialSampleBooks;
  }
};

export const saveStoredBooks = (books) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (err) {
    console.error('Chyba při ukládání knih do localStorage:', err);
  }
};
