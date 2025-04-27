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

    // Step 2: Search each board properly using items_page
    for (const board of boards) {
      const searchResponse = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey
        },
        body: JSON.stringify({
          query: `
            query {
              boards(ids: ${board.id}) {
                items_page(query_params: {
                  rules: [{
                    column_id: "name",
                    compare_value: ["${query}"],
                    operator: contains_text
                  }]
                }) {
                  items {
                    id
                    name
                  }
                }
              }
            }
          `
        })
      });

      const searchData = await searchResponse.json();
      const items = searchData.data.boards[0]?.items_page?.items || [];

      if (items.length > 0) {
        allResults.push(...items);
      }
    }

    res.status(200).json({ results: allResults });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to search Monday.com boards' });
  }
}
