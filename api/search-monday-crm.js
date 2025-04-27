export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST method' });
  }

  const { query } = req.body;

  // 👉 Hardcoded API key for testing
  const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjQ1NzU2NzQxNywiYWFpIjoxMSwidWlkIjo3MDc0NTI3MSwiaWFkIjoiMjAyNS0wMS0xNFQxMDoyOTo0OS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6OTc3Njk4NCwicmduIjoidXNlMSJ9.BEj_fvCfaotmbuiYw42tbu1-gBfeLX9uKlYRHPgSaWI';

  // Properly escape dangerous characters in GraphQL
  const safeQuery = query.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  try {
    // Step 1: Get all boards
    const boardsResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify({
        query: `
          query {
            boards {
              id
              name
            }
          }
        `
      })
    });

    const boardsData = await boardsResponse.json();
    const boards = boardsData.data.boards;

    let allResults = [];

    // Step 2: Fetch all items normally
    for (const board of boards) {
      const itemsResponse = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey
        },
        body: JSON.stringify({
          query: `
            query {
              boards(ids: ${board.id}) {
                items {
                  id
                  name
                }
              }
            }
          `
        })
      });

      const itemsData = await itemsResponse.json();
      const items = itemsData.data.boards[0]?.items || [];

      const matchingItems = items.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );

      if (matchingItems.length > 0) {
        allResults.push(...matchingItems);
      }
    }

    res.status(200).json({ results: allResults });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to search Monday.com boards' });
  }
}
