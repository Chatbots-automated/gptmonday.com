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
  const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjQ1NzU2NzQxNywiYWFpIjoxMSwidWlkIjo3MDc0NTI3MSwiaWFkIjoiMjAyNS0wMS0xNFQxMDoyOTo0OS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6OTc3Njk4NCwicmduIjoidXNlMSJ9.BEj_fvCfaotmbuiYw42tbu1-gBfeLX9uKlYRHPgSaWI'; 

  console.log('Received search query:', query);

  try {
    const boardId = 1645017543; // Project execution

    const itemsResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
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
                    value
                  }
                }
              }
            }
          }
        `
      })
    });

    const itemsData = await itemsResponse.json();
    console.log('Items Data:', JSON.stringify(itemsData, null, 2));

    const items = itemsData.data?.boards[0]?.items_page?.items || [];

    const matchingItems = items.filter(item => {
      const nameMatch = item.name?.toLowerCase().includes(query.toLowerCase());
      const columnMatch = item.column_values?.some(col => 
        col.text?.toLowerCase().includes(query.toLowerCase())
      );
      return nameMatch || columnMatch;
    });

    console.log(`Found ${matchingItems.length} matching items`);

    res.status(200).json({ results: matchingItems });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to search Monday.com board' });
  }
}
