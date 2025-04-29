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
  const apiKey = 'your-monday-api-key-here'; // replace this 🔥

  try {
    const boardId = 1645017543; // only 1 board

    let allResults = [];

    console.log(`Searching board: ${boardId} for query: "${query}"`);

    const itemsResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({
        query: `
          query {
            boards(ids: ${boardId}) {
              items_page(limit: 500) {
                items {
                  id
                  name
                  column_values {
                    id
                    text
                  }
                }
              }
            }
          }
        `,
      }),
    });

    const itemsData = await itemsResponse.json();
    console.log(`Raw data from Monday:`, JSON.stringify(itemsData, null, 2)); // << log the FULL data

    const items = itemsData.data?.boards[0]?.items_page?.items || [];

    const matchingItems = items.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(query.toLowerCase());
      const columnMatch = item.column_values?.some((col) =>
        col.text?.toLowerCase().includes(query.toLowerCase())
      );
      return nameMatch || columnMatch;
    });

    allResults.push(
      ...matchingItems.map(item => {
        const getColumn = (colId) => item.column_values.find(c => c.id === colId)?.text || '';

        return {
          id: item.id,
          name: item.name,
          email: getColumn('dup__of_email8'),       // 📨 email column id
          phone: getColumn('phone9'),               // 📞 phone column id
          address: getColumn('miestas0')            // 🏠 address column id
        };
      })
    );

    console.log(`Found ${allResults.length} matching items`);

    res.status(200).json({ results: allResults });
  } catch (err) {
    console.error('Error:', err);
    res.status(200).json({ results: [] }); // important: still return valid response
  }
}
