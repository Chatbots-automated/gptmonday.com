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
  const apiKey = 'your-monday-api-key-here'; // 🔥

  try {
    const boardIds = [
      1645017543,
      8921495991,
      8720615243,
      183214238,
      2177969450
    ];

    let allResults = [];

    for (const boardId of boardIds) {
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
                      title
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
      const items = itemsData.data?.boards[0]?.items_page?.items || [];

      // 🪵 Debug: Show columns to console
      items.forEach(item => {
        console.log(`Item: ${item.name}`);
        item.column_values.forEach(col => {
          console.log(`  ${col.id} (${col.title}): ${col.text}`);
        });
      });

      const matchingItems = items.filter((item) => {
        const nameMatch = item.name?.toLowerCase().includes(query.toLowerCase());
        const columnMatch = item.column_values?.some((col) =>
          col.text?.toLowerCase().includes(query.toLowerCase())
        );
        return nameMatch || columnMatch;
      });

      allResults.push(
        ...matchingItems.map(item => {
          const getColumn = (ids) => {
            for (const id of ids) {
              const match = item.column_values.find(c => c.id === id);
              if (match?.text) return match.text;
            }
            return '';
          };

          return {
            id: item.id,
            name: item.name,
            email: getColumn(['dup__of_email8', 'email1']), // ✅ fallback safe
            phone: getColumn(['phone9', 'phone3']),
            address: getColumn(['miestas0', 'address7'])
          };
        })
      );
    }

    res.status(200).json({ results: allResults });
  } catch (err) {
    console.error('Error:', err);
    res.status(200).json({ results: [] });
  }
}
