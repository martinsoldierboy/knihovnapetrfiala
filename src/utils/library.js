// Czech library classification & API helpers

// Helper to compare Czech strings properly (including Č, Ř, Š, Ž, CH, etc.)
export const compareCzechStrings = (a = '', b = '') => {
  return a.localeCompare(b, 'cs', { sensitivity: 'base', numeric: true });
};

// Formats author name into "Surname, Firstname" format for library cataloging
export const formatAuthorName = (authorStr) => {
  if (!authorStr || authorStr.trim() === '') return 'Neznámý autor';

  // If already in "Surname, Firstname" format
  if (authorStr.includes(',')) {
    const parts = authorStr.split(',').map(p => p.trim());
    return `${parts[0]}, ${parts.slice(1).join(' ')}`;
  }

  const parts = authorStr.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];

  const lastName = parts.pop();
  const firstNames = parts.join(' ');
  return `${lastName}, ${firstNames}`;
};

// Extracts surname for sorting
export const getAuthorSurname = (authorStr) => {
  const formatted = formatAuthorName(authorStr);
  return formatted.split(',')[0].trim();
};

// Generates MDT (Mezinárodní desetinné třídění) code based on genre/subject or categories
export const inferMDTCode = (categories = [], description = '', title = '') => {
  const text = `${Array.isArray(categories) ? categories.join(' ') : categories} ${description} ${title}`.toLowerCase();

  if (text.includes('poezie') || text.includes('básně') || text.includes('poetry')) return { code: '82-1', category: 'Poezie' };
  if (text.includes('drama') || text.includes('divadlo')) return { code: '82-2', category: 'Drama' };
  if (text.includes('scifi') || text.includes('sci-fi') || text.includes('fantasy')) return { code: '82-311.9', category: 'Beletrie - Sci-Fi / Fantasy' };
  if (text.includes('detektiv') || text.includes('krimi') || text.includes('thriller')) return { code: '82-312.4', category: 'Beletrie - Detektivky' };
  if (text.includes('historik') || text.includes('dějiny') || text.includes('history') || text.includes('historie')) return { code: '94', category: 'Historie' };
  if (text.includes('filosof') || text.includes('philosophy')) return { code: '1', category: 'Filozofie' };
  if (text.includes('psycholog') || text.includes('psychology')) return { code: '159.9', category: 'Psychologie' };
  if (text.includes('počítač') || text.includes('informatik') || text.includes('programming') || text.includes('software') || text.includes('technolog')) return { code: '004', category: 'Informatika a výpočetní technika' };
  if (text.includes('přírod') || text.includes('biolog') || text.includes('fyzik') || text.includes('chemie')) return { code: '5', category: 'Přírodní vědy' };
  if (text.includes('lékař') || text.includes('zdraví') || text.includes('medic')) return { code: '61', category: 'Lékařství' };
  if (text.includes('umění') || text.includes('malíř') || text.includes('hudba') || text.includes('art')) return { code: '7', category: 'Umění' };
  if (text.includes('pohádky') || text.includes('dětské') || text.includes('children')) return { code: '82-93', category: 'Literatura pro děti' };

  return { code: '82-3', category: 'Beletrie - Próza' };
};

// Generates standard Czech library Signatura (Call Number) e.g., "82-3 ČAP k"
export const generateSignatura = (mdtCode, authorStr, titleStr) => {
  const surname = getAuthorSurname(authorStr).toUpperCase();
  const authorTag = surname.substring(0, 3);
  const titleLetter = (titleStr || '').trim().charAt(0).toLowerCase();

  return `${mdtCode} ${authorTag} ${titleLetter}`.trim();
};

// Fetch book details from APIs (Google Books + Open Library fallback)
export const fetchBookMetadata = async (query) => {
  const cleanQuery = query.trim();
  const isISBN = /^(97(8|9))?\d{9}(\d|X)$/i.test(cleanQuery.replace(/[- ]/g, ''));
  const sanitizedQuery = isISBN ? cleanQuery.replace(/[- ]/g, '') : cleanQuery;

  // 1. Try Google Books API
  try {
    const qParam = isISBN ? `isbn:${sanitizedQuery}` : encodeURIComponent(sanitizedQuery);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${qParam}&maxResults=5`);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        const info = item.volumeInfo;
        const isbnObj = info.industryIdentifiers?.find(id => id.type.includes('13')) || info.industryIdentifiers?.[0];
        const isbn = isbnObj ? isbnObj.identifier : (isISBN ? sanitizedQuery : 'Neznámé ISBN');

        const authors = info.authors ? info.authors.join(', ') : 'Neznámý autor';
        const formattedAuthor = formatAuthorName(authors);
        const mdt = inferMDTCode(info.categories, info.description, info.title);
        const signatura = generateSignatura(mdt.code, formattedAuthor, info.title);

        return {
          id: item.id || Date.now().toString(),
          title: info.title || 'Neznámý název',
          author: formattedAuthor,
          rawAuthor: authors,
          isbn: isbn,
          publisher: info.publisher || 'Neznámé nakladatelství',
          publishedYear: info.publishedDate ? info.publishedDate.substring(0, 4) : 'N/A',
          pageCount: info.pageCount || null,
          category: mdt.category,
          mdt: mdt.code,
          signatura: signatura,
          coverUrl: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null,
          description: info.description || '',
          addedAt: new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.warn('Google Books API failed:', err);
  }

  // 2. Fallback to Open Library API if ISBN
  if (isISBN) {
    try {
      const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${sanitizedQuery}&format=json&jscmd=data`);
      if (olRes.ok) {
        const olData = await olRes.json();
        const bookKey = `ISBN:${sanitizedQuery}`;
        if (olData[bookKey]) {
          const book = olData[bookKey];
          const authors = book.authors ? book.authors.map(a => a.name).join(', ') : 'Neznámý autor';
          const formattedAuthor = formatAuthorName(authors);
          const mdt = inferMDTCode(book.subjects?.map(s => s.name), '', book.title);
          const signatura = generateSignatura(mdt.code, formattedAuthor, book.title);

          return {
            id: sanitizedQuery || Date.now().toString(),
            title: book.title || 'Neznámý název',
            author: formattedAuthor,
            rawAuthor: authors,
            isbn: sanitizedQuery,
            publisher: book.publishers ? book.publishers.map(p => p.name).join(', ') : 'Neznámé nakladatelství',
            publishedYear: book.publish_date ? book.publish_date.substring(0, 4) : 'N/A',
            pageCount: book.number_of_pages || null,
            category: mdt.category,
            mdt: mdt.code,
            signatura: signatura,
            coverUrl: book.cover?.medium || book.cover?.small || null,
            description: '',
            addedAt: new Date().toISOString()
          };
        }
      }
    } catch (err) {
      console.warn('Open Library API failed:', err);
    }
  }

  return null;
};

// Library Standard Sorting Rules:
// Standard Czech Library Sort (Standardní knihovnické řazení):
// Primary: MDT classification code (numerical order e.g. 004 -> 1 -> 5 -> 61 -> 82-1 -> 82-3 -> 94)
// Secondary: Author Surname (Příjmení autora A-Z - Czech alphabet order)
// Tertiary: Book Title (Název knihy A-Z)
export const sortBooksByLibraryStandard = (books) => {
  return [...books].sort((a, b) => {
    // 1. Sort by MDT Code
    const mdtCompare = compareCzechStrings(a.mdt || '', b.mdt || '');
    if (mdtCompare !== 0) return mdtCompare;

    // 2. Sort by Author Surname
    const surnameA = getAuthorSurname(a.author);
    const surnameB = getAuthorSurname(b.author);
    const authorCompare = compareCzechStrings(surnameA, surnameB);
    if (authorCompare !== 0) return authorCompare;

    // 3. Sort by Title
    return compareCzechStrings(a.title, b.title);
  });
};
