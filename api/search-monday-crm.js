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
  const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjQ1NzU2NzQxNywiYWFpIjoxMSwidWlkIjo3MDc0NTI3MSwiaWFkIjoiMjAyNS0wMS0xNFQxMDoyOTo0OS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6OTc3Njk4NCwicmduIjoidXNlMSJ9.BEj_fvCfaotmbuiYw42tbu1-gBfeLX9uKlYRHPgSaWI'; // 🔥 Never expose in frontend

  try {
    const boardId = 1645436514;

    const graphqlQuery = `
      query {
        boards(ids: ${boardId}) {
          items_page(limit: 500) {
            items {
              id
              name
              column_values {
                id
                ... on MirrorValue {
                  display_value
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey,
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    const data = await response.json();
    console.log('Raw data from Monday:', JSON.stringify(data, null, 2));

    const items = data.data?.boards?.[0]?.items_page?.items || [];

    const getColumn = (item, colId) =>
      item.column_values.find(c => c.id === colId)?.display_value || '';

    const matches = items.filter(item => {
      const lowerQuery = query.toLowerCase();
      const nameMatch = item.name?.toLowerCase().includes(lowerQuery);
      const columnMatch = item.column_values?.some(col =>
        col.display_value?.toLowerCase().includes(lowerQuery)
      );
      return nameMatch || columnMatch;
    });

    const results = matches.map(item => ({
      id: item.id,
      name: item.name,
      email: getColumn(item, 'mirror95'),
      phone: getColumn(item, 'mirror76'),
      address: getColumn(item, 'mirror49'),
    }));

    res.status(200).json({ results });
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ results: [] });
  }
}
