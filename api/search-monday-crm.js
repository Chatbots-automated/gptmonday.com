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
  const apiKey = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjQ1NzU2NzQxNywiYWFpIjoxMSwidWlkIjo3MDc0NTI3MSwiaWFkIjoiMjAyNS0wMS0xNFQxMDoyOTo0OS4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6OTc3Njk4NCwicmduIjoidXNlMSJ9.BEj_fvCfaotmbuiYw42tbu1-gBfeLX9uKlYRHPgSaWI'; // 🔥 Replace this

  const boardConfigs = [
    {
      id: 1645436514, // Single Project
      columns: { email: 'mirror95', phone: 'mirror76', address: 'mirror49' },
      boardName: 'Single Project',
    },
    {
      id: 2177969450, // Sales Pipeline B2C
      columns: { email: 'dup__of_email8', phone: 'phone9', address: 'miestas0' },
      boardName: 'Sales Pipeline B2C',
    },
    {
      id: 1645017543, // Sales Pipeline B2B
      columns: { email: 'dup__of_email8', phone: 'mirror0', address: 'location2' },
      boardName: 'Sales Pipeline B2B',
    },
  ];

  try {
    let allResults = [];

    for (const board of boardConfigs) {
      const graphqlQuery = `
        query {
          boards(ids: ${board.id}) {
            items_page(limit: 500) {
              items {
                id
                name
                column_values {
                  id
                  text
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
      console.log(`Raw data from Monday (board ${board.id}):`, JSON.stringify(data, null, 2));

      const items = data.data?.boards?.[0]?.items_page?.items || [];

      const getColumn = (item, colId) => {
        const col = item.column_values.find(c => c.id === colId);
        if (!col) return '';
        if (col.display_value) return col.display_value;
        if (col.text) return col.text;
        return '';
      };

      const lowerQuery = query.toLowerCase();

      const matches = items.filter(item => {
        const nameMatch = item.name?.toLowerCase().includes(lowerQuery);
        const columnMatch = item.column_values?.some(col =>
          (col.display_value || col.text)?.toLowerCase().includes(lowerQuery)
        );
        return nameMatch || columnMatch;
      });

      allResults.push(
        ...matches.map(item => ({
          id: item.id,
          name: item.name,
          email: getColumn(item, board.columns.email),
          phone: getColumn(item, board.columns.phone),
          address: getColumn(item, board.columns.address),
          board: board.boardName, // 🔥 Add from which board
        }))
      );
    }

    res.status(200).json({ results: allResults });
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({ results: [] });
  }
}
