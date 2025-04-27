export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST method' });
  }

  const { query } = req.body;
  const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjQ1NzU2NzQxNywiYWFpIjoxMSwidWlkIjo3MDc0NTI3MSwiaWFkIjoiMjAyNS0wMS0xNFQxMDoyOTo0OS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6OTc3Njk4NCwicmduIjoidXNlMSJ9.BEj_fvCfaotmbuiYw42tbu1-gBfeLX9uKlYRHPgSaWI';

  console.log('Received search query:', query);  // <=== 🛑

  try {
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
    console.log('Boards data:', JSON.stringify(boardsData, null, 2));  // <=== 🛑

    const boards = boardsData.data.boards;

    let allResults = [];

    for (const board of boards) {
      console.log(`Searching board: ${board.name} (ID: ${board.id})`);  // <=== 🛑

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
      console.log(`Items on board ${board.name}:`, JSON.stringify(itemsData, null, 2));  // <=== 🛑

      const items = itemsData.data.boards[0]?.items || [];

      const matchingItems = items.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );

      console.log(`Found ${matchingItems.length} matching items on board ${board.name}`);  // <=== 🛑

      if (matchingItems.length > 0) {
        allResults.push(...matchingItems);
      }
    }

    console.log('Total matches found:', allResults.length);  // <=== 🛑

    res.status(200).json({ results: allResults });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to search Monday.com boards' });
  }
}
