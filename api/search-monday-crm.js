export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST method' });
  }

  const { query } = req.body;
  const apiKey = process.env.MONDAY_API_KEY;

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

    // Step 2: Search each board manually
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
                  column_values {
                    id
                    title
                    text
                  }
                }
              }
            }
          `
        })
      });

      const itemsData = await itemsResponse.json();
      const items = itemsData.data.boards[0]?.items || [];

      // Search in item name and all columns
      const matchingItems = items.filter(item => {
        const nameMatch = item.name && item.name.toLowerCase().includes(query.toLowerCase());
        const columnMatch = item.column_values.some(col => col.text && col.text.toLowerCase().includes(query.toLowerCase()));
        return nameMatch || columnMatch;
      });

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
