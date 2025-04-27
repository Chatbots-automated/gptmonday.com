export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST method' });
  }

  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const { query } = req.body;
  const apiKey = 'your_api_key_here'; // Replace

  console.log('Received search query:', query);

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
    const boards = boardsData.data?.boards || [];

    let allResults = [];

    for (const board of boards) {
      console.log(`Searching board: ${board.name} (ID: ${board.id})`);

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
                items_page(limit: 500) {
                  items {
                    id
                    name
                    column_values {
                      id
                      title
                      text
                    }
                  }
                }
              }
            }
          `
        })
      });

      const itemsData = await itemsResponse.json();
      const items = itemsData.data?.boards[0]?.items_page?.items || [];

      const matchingItems = items.filter(item => {
        const nameMatch = item.name?.toLowerCase().includes(query.toLowerCase());
        const columnMatch = item.column_values?.some(col => col.text && col.text.toLowerCase().includes(query.toLowerCase()));
        return nameMatch || columnMatch;
      });

      console.log(`Found ${matchingItems.length} matching items on board ${board.name}`);

      if (matchingItems.length > 0) {
        allResults.push(...matchingItems);
      }
    }

    console.log('Total matches found:', allResults.length);

    res.status(200).json({ results: allResults });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to search Monday.com boards' });
  }
}
